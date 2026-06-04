import fs from "node:fs";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { configureWhatsApp, sendWhatsApp } from "./server/sendWhatsApp";

function loadDotEnvOnly() {
  const envPath = path.resolve(process.cwd(), ".env");

  if (!fs.existsSync(envPath)) {
    console.error("[env] Missing .env file at project root. Create .env and restart the server.");
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (key) {
      process.env[key] = value;
    }
  }
}

function verifyAdminApiPlugin() {
  type AuthRouteType =
    | "verify-admin"
    | "change-admin-password"
    | "verify-admin-edit"
    | "change-admin-edit-password"
    | "verify-admin-session"
    | "logout-admin";

  type MiddlewareHandler = (req: IncomingMessage, res: ServerResponse) => void;
  type MiddlewareCapableServer = {
    middlewares: {
      use: (path: string, handler: MiddlewareHandler) => void;
    };
  };

  let currentAdminEmail = process.env.ADMIN_EMAIL || "";
  let currentAdminPassword = process.env.ADMIN_PASSWORD || "";
  const EDIT_ACTION_PASSWORD = "moxvox@2026";
  const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
  const SESSION_SECRET =
    process.env.ADMIN_SESSION_SECRET ||
    `${currentAdminEmail}:${currentAdminPassword}:${EDIT_ACTION_PASSWORD}`;
  const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
  const RATE_LIMIT_BLOCK_MS = 5 * 60 * 1000;
  const rateLimitByKey = new Map<string, { count: number; windowStart: number; blockedUntil: number }>();

  const sendJson = (res: ServerResponse, statusCode: number, payload: Record<string, unknown>) => {
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(payload));
  };

  const toBase64Url = (raw: string) => Buffer.from(raw, "utf8").toString("base64url");
  const fromBase64Url = (raw: string) => Buffer.from(raw, "base64url").toString("utf8");

  const sign = (payloadBase64: string) => {
    return createHmac("sha256", SESSION_SECRET).update(payloadBase64).digest("base64url");
  };

  const createSessionToken = (email: string) => {
    const payload = {
      email,
      exp: Date.now() + SESSION_TTL_MS,
    };
    const payloadBase64 = toBase64Url(JSON.stringify(payload));
    const signature = sign(payloadBase64);
    return `${payloadBase64}.${signature}`;
  };

  const isValidSessionToken = (token: string) => {
    const [payloadBase64, signature] = token.split(".");
    if (!payloadBase64 || !signature) {
      return false;
    }

    const expectedSignature = sign(payloadBase64);
    const provided = Buffer.from(signature, "utf8");
    const expected = Buffer.from(expectedSignature, "utf8");

    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return false;
    }

    try {
      const payloadText = fromBase64Url(payloadBase64);
      const payload = JSON.parse(payloadText) as { email?: unknown; exp?: unknown };
      if (typeof payload.email !== "string" || typeof payload.exp !== "number") {
        return false;
      }

      if (Date.now() > payload.exp) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  };

  const getClientIp = (req: IncomingMessage) => {
    const forwardedHeader = req.headers["x-forwarded-for"];
    const forwardedValue = Array.isArray(forwardedHeader) ? forwardedHeader[0] : forwardedHeader;
    const forwardedIp = typeof forwardedValue === "string" ? forwardedValue.split(",")[0]?.trim() : "";
    return forwardedIp || req.socket.remoteAddress || "unknown";
  };

  const checkRateLimit = (routeType: AuthRouteType, ip: string) => {
    const limitedRoutes = new Set<AuthRouteType>([
      "verify-admin",
      "verify-admin-edit",
      "change-admin-password",
      "change-admin-edit-password",
    ]);

    if (!limitedRoutes.has(routeType)) {
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const now = Date.now();
    const maxAttempts = 15;
    const key = `${routeType}:${ip}`;
    const existing = rateLimitByKey.get(key);

    if (!existing) {
      rateLimitByKey.set(key, { count: 1, windowStart: now, blockedUntil: 0 });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (existing.blockedUntil > now) {
      const retryAfterSeconds = Math.ceil((existing.blockedUntil - now) / 1000);
      return { allowed: false, retryAfterSeconds };
    }

    if (now - existing.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitByKey.set(key, { count: 1, windowStart: now, blockedUntil: 0 });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const nextCount = existing.count + 1;
    const blockedUntil = nextCount > maxAttempts ? now + RATE_LIMIT_BLOCK_MS : 0;
    rateLimitByKey.set(key, {
      count: nextCount,
      windowStart: existing.windowStart,
      blockedUntil,
    });

    if (blockedUntil > 0) {
      const retryAfterSeconds = Math.ceil((blockedUntil - now) / 1000);
      return { allowed: false, retryAfterSeconds };
    }

    return { allowed: true, retryAfterSeconds: 0 };
  };

  const writeEnvValue = (key: string, value: string) => {
    const envPath = path.resolve(process.cwd(), ".env");
    const safeValue = String(value ?? "").replace(/\r?\n/g, "").trim();

    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, `${key}=${safeValue}\n`, "utf8");
      return;
    }

    const content = fs.readFileSync(envPath, "utf8");
    const lines = content.split(/\r?\n/);
    let updated = false;

    const nextLines = lines.map((line) => {
      if (line.trim().startsWith(`${key}=`)) {
        updated = true;
        return `${key}=${safeValue}`;
      }
      return line;
    });

    if (!updated) {
      nextLines.push(`${key}=${safeValue}`);
    }

    fs.writeFileSync(envPath, `${nextLines.join("\n").replace(/\n+$/, "")}\n`, "utf8");
  };

  const createRouteHandler = (routeType: AuthRouteType): MiddlewareHandler => {
    return (req, res) => {

      if (req.method !== "POST") {
        sendJson(res, 405, { success: false });
        return;
      }

      const ip = getClientIp(req);
      const rate = checkRateLimit(routeType, ip);
      if (!rate.allowed) {
        res.setHeader("Retry-After", String(rate.retryAfterSeconds));
        sendJson(res, 429, { success: false, error: "Too many attempts. Please try again later." });
        return;
      }

      let body = "";
      req.on("data", (chunk: Buffer | string) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        try {
          const parsed = body ? (JSON.parse(body) as Record<string, unknown>) : {};
          const readString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

          const verifyLogin = (email: string, password: string, expectedEmail: string, expectedPassword: string) => {
            const success =
              typeof email === "string" &&
              typeof password === "string" &&
              !!expectedEmail &&
              !!expectedPassword &&
              email === expectedEmail &&
              password === expectedPassword;
            return success;
          };

          const changePassword = (
            keyEmail: string,
            keyPassword: string,
            getCurrentEmail: () => string,
            getCurrentPassword: () => string,
            setCurrent: (nextEmail: string, nextPassword: string) => void
          ) => {
            const email = readString(parsed?.email);
            const oldPassword = readString(parsed?.old_password ?? parsed?.oldPassword);
            const newPassword = readString(parsed?.new_password ?? parsed?.newPassword);

            if (!email || !oldPassword || !newPassword) {
              sendJson(res, 400, { success: false, error: "Email, old password and new password are required." });
              return;
            }

            if (newPassword.length < 4) {
              sendJson(res, 400, { success: false, error: "New password must be at least 4 characters." });
              return;
            }

            if (email !== getCurrentEmail() || oldPassword !== getCurrentPassword()) {
              sendJson(res, 401, { success: false, error: "Old password is incorrect." });
              return;
            }

            setCurrent(email, newPassword);
            process.env[keyEmail] = email;
            process.env[keyPassword] = newPassword;

            writeEnvValue(keyEmail, email);
            writeEnvValue(keyPassword, newPassword);

            sendJson(res, 200, { success: true, message: "Password changed successfully." });
            return;
          };

          if (routeType === "verify-admin") {
            const email = readString(parsed?.email);
            const password = readString(parsed?.password);
            const success = verifyLogin(email, password, currentAdminEmail, currentAdminPassword);

            if (!success) {
              sendJson(res, 401, { success: false });
              return;
            }

            const authToken = createSessionToken(email);
            sendJson(res, 200, { success: true, authToken });
            return;
          }

          if (routeType === "change-admin-password") {
            changePassword(
              "ADMIN_EMAIL",
              "ADMIN_PASSWORD",
              () => currentAdminEmail,
              () => currentAdminPassword,
              (nextEmail, nextPassword) => {
                currentAdminEmail = nextEmail;
                currentAdminPassword = nextPassword;
              }
            );
            return;
          }

          if (routeType === "verify-admin-edit") {
            const success = readString(parsed?.password) === EDIT_ACTION_PASSWORD;

            sendJson(res, success ? 200 : 401, { success });
            return;
          }

          if (routeType === "change-admin-edit-password") {
            sendJson(res, 410, {
              success: false,
              error: "Edit/delete password is fixed and cannot be changed from API.",
            });
            return;
          }

          if (routeType === "verify-admin-session") {
            const authToken = readString(parsed?.authToken);
            const success = !!authToken && isValidSessionToken(authToken);
            sendJson(res, success ? 200 : 401, { success });
            return;
          }

          if (routeType === "logout-admin") {
            // Stateless session token: logout is handled on client by deleting token.
            sendJson(res, 200, { success: true });
            return;
          }

          sendJson(res, 404, { success: false, error: "Route not found" });
        } catch {
          sendJson(res, 400, { success: false });
        }
      });
    };
  };

  return {
    name: "verify-admin-api",
    configureServer(server: MiddlewareCapableServer) {
      server.middlewares.use("/api/verify-admin", createRouteHandler("verify-admin"));
      server.middlewares.use("/api/change-admin-password", createRouteHandler("change-admin-password"));
      server.middlewares.use("/api/verify-admin-edit", createRouteHandler("verify-admin-edit"));
      server.middlewares.use("/api/change-admin-edit-password", createRouteHandler("change-admin-edit-password"));
      server.middlewares.use("/api/verify-admin-session", createRouteHandler("verify-admin-session"));
      server.middlewares.use("/api/logout-admin", createRouteHandler("logout-admin"));
    },
    configurePreviewServer(server: MiddlewareCapableServer) {
      server.middlewares.use("/api/verify-admin", createRouteHandler("verify-admin"));
      server.middlewares.use("/api/change-admin-password", createRouteHandler("change-admin-password"));
      server.middlewares.use("/api/verify-admin-edit", createRouteHandler("verify-admin-edit"));
      server.middlewares.use("/api/change-admin-edit-password", createRouteHandler("change-admin-edit-password"));
      server.middlewares.use("/api/verify-admin-session", createRouteHandler("verify-admin-session"));
      server.middlewares.use("/api/logout-admin", createRouteHandler("logout-admin"));
    },
  };
}

function sendWhatsAppApiPlugin() {
  type MiddlewareHandler = (req: IncomingMessage, res: ServerResponse) => void;
  type MiddlewareCapableServer = {
    middlewares: {
      use: (path: string, handler: MiddlewareHandler) => void;
    };
  };

  const formatDateToDdmmyyyy = (dateValue: string): string => {
    const trimmed = String(dateValue || "").trim();
    if (!trimmed || trimmed === "N/A") return "N/A";
    const parts = trimmed.split("-");
    if (parts.length !== 3) return trimmed;
    const [year, month, day] = parts;
    if (!year || !month || !day) return trimmed;
    return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
  };

  const formatTimeTo12Hour = (timeValue: string): string => {
    const trimmed = String(timeValue || "").trim();
    if (!trimmed || trimmed === "N/A") return "N/A";
    const upper = trimmed.toUpperCase();
    if (upper.includes("AM") || upper.includes("PM")) return trimmed;
    const parts = trimmed.split(":");
    if (parts.length < 2) return trimmed;
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return trimmed;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = String(minutes).padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const handler: MiddlewareHandler = (req, res) => {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false }));
      return;
    }

    let body = "";
    req.on("data", (chunk: Buffer | string) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        const phone = parsed?.phone;
        const name = parsed?.name;
        const date = parsed?.date;
        const partyTime = parsed?.party_time;
        const partyEndTime = parsed?.party_end_time;
        const starterTime = parsed?.starter_time;
        const mainCourseTime = parsed?.main_course_time;
        const djTime = parsed?.dj_time;

        const menuItems = Array.isArray(parsed?.menu_items) ? parsed.menu_items : [];
        let dynamicLink = process.env.TERMS_LINK || "https://www.mox-vox.online/terms.html";
        const termsLink = dynamicLink;

        if (menuItems.length > 0) {
          const encodedItems = encodeURIComponent(menuItems.join("|"));
          const longLink = `https://www.mox-vox.online/menu.html?items=${encodedItems}`;
          
          let shortLink = longLink;
          try {
            const shortenerRes = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(longLink)}`);
            if (shortenerRes.ok) {
              shortLink = (await shortenerRes.text()).trim();
            }
          } catch (e) {
            console.error("is.gd shortener failed:", e);
          }

          dynamicLink = `${termsLink} | Menu: ${shortLink}`;
        }

        const formattedPartyStart = formatTimeTo12Hour(String(partyTime || "N/A"));
        const formattedPartyEnd = formatTimeTo12Hour(String(partyEndTime || "N/A"));
        const formattedPartyTime = formattedPartyEnd !== "N/A"
          ? `${formattedPartyStart} - ${formattedPartyEnd}`
          : formattedPartyStart;

        const templateParams = [
          String(name || "Guest"),
          formatDateToDdmmyyyy(String(date || "N/A")),
          formattedPartyTime,
          formatTimeTo12Hour(String(starterTime || "N/A")),
          formatTimeTo12Hour(String(mainCourseTime || "N/A")),
          formatTimeTo12Hour(String(djTime || "N/A")),
          dynamicLink
        ];

        console.log("\n===================================");
        console.log("[Route Debug] Incoming POST to /api/send-whatsapp");
        console.log("[Route Debug] Payload:", JSON.stringify(parsed));
        console.log("[Route Debug] Dynamic Link:", dynamicLink);

        if (!phone) {
          console.error("[Route Debug] No phone number provided in payload");
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, error: "phone is required" }));
          return;
        }

        console.log(`[Route Debug] Calling sendWhatsApp with phone=${phone}`);
        await sendWhatsApp(String(phone), templateParams);
        console.log("[Route Debug] sendWhatsApp completed successfully.");

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ success: true }));
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "WhatsApp send failed";
        console.error("\n===================================");
        console.error("[Route Debug] WhatsApp API error caught in route:");
        console.error(message);

        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            success: false,
            error: message,
            debug_info: String(error)
          })
        );
      }
    });
  };

  return {
    name: "send-whatsapp-api",
    configureServer(server: MiddlewareCapableServer) {
      server.middlewares.use("/api/send-whatsapp", handler);
    },
    configurePreviewServer(server: MiddlewareCapableServer) {
      server.middlewares.use("/api/send-whatsapp", handler);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(() => {
  // Intentionally load only .env so env config has a single source of truth.
  loadDotEnvOnly();

  configureWhatsApp({
    apiKey: process.env.GREENTICK_API_KEY,
    apiUrl: process.env.GREENTICK_API_URL,
    fromNumber: process.env.WHATSAPP_FROM_NUMBER,
    templateName: process.env.WHATSAPP_TEMPLATE_NAME,
  });

  return {
    plugins: [react(), verifyAdminApiPlugin(), sendWhatsAppApiPlugin()],
    define: {
      __SUPABASE_URL__: JSON.stringify(process.env.VITE_SUPABASE_URL || ""),
      __SUPABASE_ANON_KEY__: JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || ""),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
