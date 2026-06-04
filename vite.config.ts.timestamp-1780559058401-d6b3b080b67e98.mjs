// vite.config.ts
import fs from "node:fs";
import { createHmac, timingSafeEqual } from "node:crypto";
import { defineConfig } from "file:///C:/Users/ppmau/mox-vox-website-1/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/ppmau/mox-vox-website-1/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";

// server/sendWhatsApp.ts
var greentickApiKey = "";
var greentickApiUrl = "";
var greentickFromNumber = "";
var greentickTemplateName = "";
function configureWhatsApp(config) {
  greentickApiKey = config.apiKey || "";
  greentickApiUrl = config.apiUrl || "";
  greentickFromNumber = config.fromNumber || "";
  greentickTemplateName = config.templateName || "";
  if (!greentickApiKey || !greentickApiUrl) {
    console.error(
      "[WhatsApp] Missing required env vars: GREENTICK_API_KEY and/or GREENTICK_API_URL in .env"
    );
  }
}
function formatIndianPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }
  if (digits.length > 10) {
    const last10 = digits.slice(-10);
    return `91${last10}`;
  }
  return `91${digits}`;
}
async function sendWhatsApp(phone, params) {
  console.log("\n===================================");
  console.log("[WhatsApp Debug] Checking Environment Variables");
  console.log(`[WhatsApp Debug] GREENTICK_API_URL: ${greentickApiUrl ? greentickApiUrl.substring(0, 30) + "..." : "undefined"}`);
  console.log(`[WhatsApp Debug] GREENTICK_API_KEY: ${greentickApiKey ? greentickApiKey.substring(0, 5) + "..." : "undefined"}`);
  console.log(`[WhatsApp Debug] WHATSAPP_FROM_NUMBER: ${greentickFromNumber}`);
  console.log(`[WhatsApp Debug] WHATSAPP_TEMPLATE_NAME: ${greentickTemplateName}`);
  if (!greentickApiKey || !greentickApiUrl) {
    throw new Error("Missing GreenTick/AOC API key or URL");
  }
  if (!greentickFromNumber || !greentickTemplateName) {
    console.warn("[WhatsApp Debug] Warning: WHATSAPP_FROM_NUMBER or WHATSAPP_TEMPLATE_NAME is missing from .env");
  }
  const to = formatIndianPhone(phone);
  console.log(`[WhatsApp Debug] Formatted phone number: ${to}`);
  const payload = {
    from: greentickFromNumber || "+910000000000",
    // Will fail if not provided in .env, but follows format
    campaignName: "api-test",
    to: `+${to}`,
    templateName: greentickTemplateName || "template_name",
    components: {
      body: {
        params
      }
    },
    type: "template"
  };
  console.log("[WhatsApp Debug] Payload being sent:", JSON.stringify(payload));
  console.log(`[WhatsApp Debug] Sending request to: ${greentickApiUrl}`);
  console.log("[WhatsApp Debug] Headers:", JSON.stringify({
    apikey: `${greentickApiKey.substring(0, 5)}...`,
    "Content-Type": "application/json"
  }));
  let response;
  try {
    response = await fetch(greentickApiUrl, {
      method: "POST",
      headers: {
        apikey: greentickApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    console.log(`[WhatsApp Debug] Fetch completed. Status: ${response.status} ${response.statusText}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const cause = error instanceof Error ? error.cause : void 0;
    console.error("[WhatsApp Debug] Fetch failed with exception:", message, cause);
    const causeCode = cause?.code;
    const causeMessage = cause?.message;
    throw new Error(
      ["Network error while calling GreenTick API", message, causeCode, causeMessage].filter(Boolean).join(" | ")
    );
  }
  const responseText = await response.text();
  console.log(`[WhatsApp Debug] Response Body: ${responseText}`);
  let data = {};
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log(`[WhatsApp Debug] Could not parse response as JSON`);
    }
  }
  if (!response.ok) {
    throw new Error(`WhatsApp Send Failed: Status ${response.status} | Body: ${responseText}`);
  }
  return data;
}

// vite.config.ts
var __vite_injected_original_dirname = "C:\\Users\\ppmau\\mox-vox-website-1";
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
  let currentAdminEmail = process.env.ADMIN_EMAIL || "";
  let currentAdminPassword = process.env.ADMIN_PASSWORD || "";
  const EDIT_ACTION_PASSWORD = "moxvox@2026";
  const SESSION_TTL_MS = 8 * 60 * 60 * 1e3;
  const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || `${currentAdminEmail}:${currentAdminPassword}:${EDIT_ACTION_PASSWORD}`;
  const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1e3;
  const RATE_LIMIT_BLOCK_MS = 5 * 60 * 1e3;
  const rateLimitByKey = /* @__PURE__ */ new Map();
  const sendJson = (res, statusCode, payload) => {
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(payload));
  };
  const toBase64Url = (raw) => Buffer.from(raw, "utf8").toString("base64url");
  const fromBase64Url = (raw) => Buffer.from(raw, "base64url").toString("utf8");
  const sign = (payloadBase64) => {
    return createHmac("sha256", SESSION_SECRET).update(payloadBase64).digest("base64url");
  };
  const createSessionToken = (email) => {
    const payload = {
      email,
      exp: Date.now() + SESSION_TTL_MS
    };
    const payloadBase64 = toBase64Url(JSON.stringify(payload));
    const signature = sign(payloadBase64);
    return `${payloadBase64}.${signature}`;
  };
  const isValidSessionToken = (token) => {
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
      const payload = JSON.parse(payloadText);
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
  const getClientIp = (req) => {
    const forwardedHeader = req.headers["x-forwarded-for"];
    const forwardedValue = Array.isArray(forwardedHeader) ? forwardedHeader[0] : forwardedHeader;
    const forwardedIp = typeof forwardedValue === "string" ? forwardedValue.split(",")[0]?.trim() : "";
    return forwardedIp || req.socket.remoteAddress || "unknown";
  };
  const checkRateLimit = (routeType, ip) => {
    const limitedRoutes = /* @__PURE__ */ new Set([
      "verify-admin",
      "verify-admin-edit",
      "change-admin-password",
      "change-admin-edit-password"
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
      const retryAfterSeconds = Math.ceil((existing.blockedUntil - now) / 1e3);
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
      blockedUntil
    });
    if (blockedUntil > 0) {
      const retryAfterSeconds = Math.ceil((blockedUntil - now) / 1e3);
      return { allowed: false, retryAfterSeconds };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  };
  const writeEnvValue = (key, value) => {
    const envPath = path.resolve(process.cwd(), ".env");
    const safeValue = String(value ?? "").replace(/\r?\n/g, "").trim();
    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, `${key}=${safeValue}
`, "utf8");
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
    fs.writeFileSync(envPath, `${nextLines.join("\n").replace(/\n+$/, "")}
`, "utf8");
  };
  const createRouteHandler = (routeType) => {
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
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          const readString = (value) => typeof value === "string" ? value.trim() : "";
          const verifyLogin = (email, password, expectedEmail, expectedPassword) => {
            const success = typeof email === "string" && typeof password === "string" && !!expectedEmail && !!expectedPassword && email === expectedEmail && password === expectedPassword;
            return success;
          };
          const changePassword = (keyEmail, keyPassword, getCurrentEmail, getCurrentPassword, setCurrent) => {
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
              error: "Edit/delete password is fixed and cannot be changed from API."
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
    configureServer(server) {
      server.middlewares.use("/api/verify-admin", createRouteHandler("verify-admin"));
      server.middlewares.use("/api/change-admin-password", createRouteHandler("change-admin-password"));
      server.middlewares.use("/api/verify-admin-edit", createRouteHandler("verify-admin-edit"));
      server.middlewares.use("/api/change-admin-edit-password", createRouteHandler("change-admin-edit-password"));
      server.middlewares.use("/api/verify-admin-session", createRouteHandler("verify-admin-session"));
      server.middlewares.use("/api/logout-admin", createRouteHandler("logout-admin"));
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/verify-admin", createRouteHandler("verify-admin"));
      server.middlewares.use("/api/change-admin-password", createRouteHandler("change-admin-password"));
      server.middlewares.use("/api/verify-admin-edit", createRouteHandler("verify-admin-edit"));
      server.middlewares.use("/api/change-admin-edit-password", createRouteHandler("change-admin-edit-password"));
      server.middlewares.use("/api/verify-admin-session", createRouteHandler("verify-admin-session"));
      server.middlewares.use("/api/logout-admin", createRouteHandler("logout-admin"));
    }
  };
}
function sendWhatsAppApiPlugin() {
  const formatDateToDdmmyyyy = (dateValue) => {
    const trimmed = String(dateValue || "").trim();
    if (!trimmed || trimmed === "N/A") return "N/A";
    const parts = trimmed.split("-");
    if (parts.length !== 3) return trimmed;
    const [year, month, day] = parts;
    if (!year || !month || !day) return trimmed;
    return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
  };
  const formatTimeTo12Hour = (timeValue) => {
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
  const handler = (req, res) => {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false }));
      return;
    }
    let body = "";
    req.on("data", (chunk) => {
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
        if (menuItems.length > 0) {
          const encodedItems = encodeURIComponent(menuItems.join("|"));
          dynamicLink = `https://www.mox-vox.online/menu.html?items=${encodedItems}`;
        }
        const formattedPartyStart = formatTimeTo12Hour(String(partyTime || "N/A"));
        const formattedPartyEnd = formatTimeTo12Hour(String(partyEndTime || "N/A"));
        const formattedPartyTime = formattedPartyEnd !== "N/A" ? `${formattedPartyStart} - ${formattedPartyEnd}` : formattedPartyStart;
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
      } catch (error) {
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
    configureServer(server) {
      server.middlewares.use("/api/send-whatsapp", handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/send-whatsapp", handler);
    }
  };
}
var vite_config_default = defineConfig(() => {
  loadDotEnvOnly();
  configureWhatsApp({
    apiKey: process.env.GREENTICK_API_KEY,
    apiUrl: process.env.GREENTICK_API_URL,
    fromNumber: process.env.WHATSAPP_FROM_NUMBER,
    templateName: process.env.WHATSAPP_TEMPLATE_NAME
  });
  return {
    plugins: [react(), verifyAdminApiPlugin(), sendWhatsAppApiPlugin()],
    define: {
      __SUPABASE_URL__: JSON.stringify(process.env.VITE_SUPABASE_URL || ""),
      __SUPABASE_ANON_KEY__: JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || "")
    },
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic2VydmVyL3NlbmRXaGF0c0FwcC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHBwbWF1XFxcXG1veC12b3gtd2Vic2l0ZS0xXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxwcG1hdVxcXFxtb3gtdm94LXdlYnNpdGUtMVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvcHBtYXUvbW94LXZveC13ZWJzaXRlLTEvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgZnMgZnJvbSBcIm5vZGU6ZnNcIjtcclxuaW1wb3J0IHsgY3JlYXRlSG1hYywgdGltaW5nU2FmZUVxdWFsIH0gZnJvbSBcIm5vZGU6Y3J5cHRvXCI7XHJcbmltcG9ydCB0eXBlIHsgSW5jb21pbmdNZXNzYWdlLCBTZXJ2ZXJSZXNwb25zZSB9IGZyb20gXCJub2RlOmh0dHBcIjtcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29uZmlndXJlV2hhdHNBcHAsIHNlbmRXaGF0c0FwcCB9IGZyb20gXCIuL3NlcnZlci9zZW5kV2hhdHNBcHBcIjtcclxuXHJcbmZ1bmN0aW9uIGxvYWREb3RFbnZPbmx5KCkge1xyXG4gIGNvbnN0IGVudlBhdGggPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgXCIuZW52XCIpO1xyXG5cclxuICBpZiAoIWZzLmV4aXN0c1N5bmMoZW52UGF0aCkpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJbZW52XSBNaXNzaW5nIC5lbnYgZmlsZSBhdCBwcm9qZWN0IHJvb3QuIENyZWF0ZSAuZW52IGFuZCByZXN0YXJ0IHRoZSBzZXJ2ZXIuXCIpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhlbnZQYXRoLCBcInV0ZjhcIik7XHJcblxyXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KC9cXHI/XFxuLykpIHtcclxuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcclxuXHJcbiAgICBpZiAoIWxpbmUgfHwgbGluZS5zdGFydHNXaXRoKFwiI1wiKSkge1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzZXBhcmF0b3JJbmRleCA9IGxpbmUuaW5kZXhPZihcIj1cIik7XHJcbiAgICBpZiAoc2VwYXJhdG9ySW5kZXggPT09IC0xKSB7XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGtleSA9IGxpbmUuc2xpY2UoMCwgc2VwYXJhdG9ySW5kZXgpLnRyaW0oKTtcclxuICAgIGNvbnN0IHZhbHVlID0gbGluZS5zbGljZShzZXBhcmF0b3JJbmRleCArIDEpLnRyaW0oKS5yZXBsYWNlKC9eWydcIl18WydcIl0kL2csIFwiXCIpO1xyXG5cclxuICAgIGlmIChrZXkpIHtcclxuICAgICAgcHJvY2Vzcy5lbnZba2V5XSA9IHZhbHVlO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gdmVyaWZ5QWRtaW5BcGlQbHVnaW4oKSB7XHJcbiAgdHlwZSBBdXRoUm91dGVUeXBlID1cclxuICAgIHwgXCJ2ZXJpZnktYWRtaW5cIlxyXG4gICAgfCBcImNoYW5nZS1hZG1pbi1wYXNzd29yZFwiXHJcbiAgICB8IFwidmVyaWZ5LWFkbWluLWVkaXRcIlxyXG4gICAgfCBcImNoYW5nZS1hZG1pbi1lZGl0LXBhc3N3b3JkXCJcclxuICAgIHwgXCJ2ZXJpZnktYWRtaW4tc2Vzc2lvblwiXHJcbiAgICB8IFwibG9nb3V0LWFkbWluXCI7XHJcblxyXG4gIHR5cGUgTWlkZGxld2FyZUhhbmRsZXIgPSAocmVxOiBJbmNvbWluZ01lc3NhZ2UsIHJlczogU2VydmVyUmVzcG9uc2UpID0+IHZvaWQ7XHJcbiAgdHlwZSBNaWRkbGV3YXJlQ2FwYWJsZVNlcnZlciA9IHtcclxuICAgIG1pZGRsZXdhcmVzOiB7XHJcbiAgICAgIHVzZTogKHBhdGg6IHN0cmluZywgaGFuZGxlcjogTWlkZGxld2FyZUhhbmRsZXIpID0+IHZvaWQ7XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIGxldCBjdXJyZW50QWRtaW5FbWFpbCA9IHByb2Nlc3MuZW52LkFETUlOX0VNQUlMIHx8IFwiXCI7XHJcbiAgbGV0IGN1cnJlbnRBZG1pblBhc3N3b3JkID0gcHJvY2Vzcy5lbnYuQURNSU5fUEFTU1dPUkQgfHwgXCJcIjtcclxuICBjb25zdCBFRElUX0FDVElPTl9QQVNTV09SRCA9IFwibW94dm94QDIwMjZcIjtcclxuICBjb25zdCBTRVNTSU9OX1RUTF9NUyA9IDggKiA2MCAqIDYwICogMTAwMDtcclxuICBjb25zdCBTRVNTSU9OX1NFQ1JFVCA9XHJcbiAgICBwcm9jZXNzLmVudi5BRE1JTl9TRVNTSU9OX1NFQ1JFVCB8fFxyXG4gICAgYCR7Y3VycmVudEFkbWluRW1haWx9OiR7Y3VycmVudEFkbWluUGFzc3dvcmR9OiR7RURJVF9BQ1RJT05fUEFTU1dPUkR9YDtcclxuICBjb25zdCBSQVRFX0xJTUlUX1dJTkRPV19NUyA9IDEwICogNjAgKiAxMDAwO1xyXG4gIGNvbnN0IFJBVEVfTElNSVRfQkxPQ0tfTVMgPSA1ICogNjAgKiAxMDAwO1xyXG4gIGNvbnN0IHJhdGVMaW1pdEJ5S2V5ID0gbmV3IE1hcDxzdHJpbmcsIHsgY291bnQ6IG51bWJlcjsgd2luZG93U3RhcnQ6IG51bWJlcjsgYmxvY2tlZFVudGlsOiBudW1iZXIgfT4oKTtcclxuXHJcbiAgY29uc3Qgc2VuZEpzb24gPSAocmVzOiBTZXJ2ZXJSZXNwb25zZSwgc3RhdHVzQ29kZTogbnVtYmVyLCBwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4ge1xyXG4gICAgcmVzLnN0YXR1c0NvZGUgPSBzdGF0dXNDb2RlO1xyXG4gICAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XHJcbiAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHBheWxvYWQpKTtcclxuICB9O1xyXG5cclxuICBjb25zdCB0b0Jhc2U2NFVybCA9IChyYXc6IHN0cmluZykgPT4gQnVmZmVyLmZyb20ocmF3LCBcInV0ZjhcIikudG9TdHJpbmcoXCJiYXNlNjR1cmxcIik7XHJcbiAgY29uc3QgZnJvbUJhc2U2NFVybCA9IChyYXc6IHN0cmluZykgPT4gQnVmZmVyLmZyb20ocmF3LCBcImJhc2U2NHVybFwiKS50b1N0cmluZyhcInV0ZjhcIik7XHJcblxyXG4gIGNvbnN0IHNpZ24gPSAocGF5bG9hZEJhc2U2NDogc3RyaW5nKSA9PiB7XHJcbiAgICByZXR1cm4gY3JlYXRlSG1hYyhcInNoYTI1NlwiLCBTRVNTSU9OX1NFQ1JFVCkudXBkYXRlKHBheWxvYWRCYXNlNjQpLmRpZ2VzdChcImJhc2U2NHVybFwiKTtcclxuICB9O1xyXG5cclxuICBjb25zdCBjcmVhdGVTZXNzaW9uVG9rZW4gPSAoZW1haWw6IHN0cmluZykgPT4ge1xyXG4gICAgY29uc3QgcGF5bG9hZCA9IHtcclxuICAgICAgZW1haWwsXHJcbiAgICAgIGV4cDogRGF0ZS5ub3coKSArIFNFU1NJT05fVFRMX01TLFxyXG4gICAgfTtcclxuICAgIGNvbnN0IHBheWxvYWRCYXNlNjQgPSB0b0Jhc2U2NFVybChKU09OLnN0cmluZ2lmeShwYXlsb2FkKSk7XHJcbiAgICBjb25zdCBzaWduYXR1cmUgPSBzaWduKHBheWxvYWRCYXNlNjQpO1xyXG4gICAgcmV0dXJuIGAke3BheWxvYWRCYXNlNjR9LiR7c2lnbmF0dXJlfWA7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgaXNWYWxpZFNlc3Npb25Ub2tlbiA9ICh0b2tlbjogc3RyaW5nKSA9PiB7XHJcbiAgICBjb25zdCBbcGF5bG9hZEJhc2U2NCwgc2lnbmF0dXJlXSA9IHRva2VuLnNwbGl0KFwiLlwiKTtcclxuICAgIGlmICghcGF5bG9hZEJhc2U2NCB8fCAhc2lnbmF0dXJlKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBleHBlY3RlZFNpZ25hdHVyZSA9IHNpZ24ocGF5bG9hZEJhc2U2NCk7XHJcbiAgICBjb25zdCBwcm92aWRlZCA9IEJ1ZmZlci5mcm9tKHNpZ25hdHVyZSwgXCJ1dGY4XCIpO1xyXG4gICAgY29uc3QgZXhwZWN0ZWQgPSBCdWZmZXIuZnJvbShleHBlY3RlZFNpZ25hdHVyZSwgXCJ1dGY4XCIpO1xyXG5cclxuICAgIGlmIChwcm92aWRlZC5sZW5ndGggIT09IGV4cGVjdGVkLmxlbmd0aCB8fCAhdGltaW5nU2FmZUVxdWFsKHByb3ZpZGVkLCBleHBlY3RlZCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHBheWxvYWRUZXh0ID0gZnJvbUJhc2U2NFVybChwYXlsb2FkQmFzZTY0KTtcclxuICAgICAgY29uc3QgcGF5bG9hZCA9IEpTT04ucGFyc2UocGF5bG9hZFRleHQpIGFzIHsgZW1haWw/OiB1bmtub3duOyBleHA/OiB1bmtub3duIH07XHJcbiAgICAgIGlmICh0eXBlb2YgcGF5bG9hZC5lbWFpbCAhPT0gXCJzdHJpbmdcIiB8fCB0eXBlb2YgcGF5bG9hZC5leHAgIT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChEYXRlLm5vdygpID4gcGF5bG9hZC5leHApIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdCBnZXRDbGllbnRJcCA9IChyZXE6IEluY29taW5nTWVzc2FnZSkgPT4ge1xyXG4gICAgY29uc3QgZm9yd2FyZGVkSGVhZGVyID0gcmVxLmhlYWRlcnNbXCJ4LWZvcndhcmRlZC1mb3JcIl07XHJcbiAgICBjb25zdCBmb3J3YXJkZWRWYWx1ZSA9IEFycmF5LmlzQXJyYXkoZm9yd2FyZGVkSGVhZGVyKSA/IGZvcndhcmRlZEhlYWRlclswXSA6IGZvcndhcmRlZEhlYWRlcjtcclxuICAgIGNvbnN0IGZvcndhcmRlZElwID0gdHlwZW9mIGZvcndhcmRlZFZhbHVlID09PSBcInN0cmluZ1wiID8gZm9yd2FyZGVkVmFsdWUuc3BsaXQoXCIsXCIpWzBdPy50cmltKCkgOiBcIlwiO1xyXG4gICAgcmV0dXJuIGZvcndhcmRlZElwIHx8IHJlcS5zb2NrZXQucmVtb3RlQWRkcmVzcyB8fCBcInVua25vd25cIjtcclxuICB9O1xyXG5cclxuICBjb25zdCBjaGVja1JhdGVMaW1pdCA9IChyb3V0ZVR5cGU6IEF1dGhSb3V0ZVR5cGUsIGlwOiBzdHJpbmcpID0+IHtcclxuICAgIGNvbnN0IGxpbWl0ZWRSb3V0ZXMgPSBuZXcgU2V0PEF1dGhSb3V0ZVR5cGU+KFtcclxuICAgICAgXCJ2ZXJpZnktYWRtaW5cIixcclxuICAgICAgXCJ2ZXJpZnktYWRtaW4tZWRpdFwiLFxyXG4gICAgICBcImNoYW5nZS1hZG1pbi1wYXNzd29yZFwiLFxyXG4gICAgICBcImNoYW5nZS1hZG1pbi1lZGl0LXBhc3N3b3JkXCIsXHJcbiAgICBdKTtcclxuXHJcbiAgICBpZiAoIWxpbWl0ZWRSb3V0ZXMuaGFzKHJvdXRlVHlwZSkpIHtcclxuICAgICAgcmV0dXJuIHsgYWxsb3dlZDogdHJ1ZSwgcmV0cnlBZnRlclNlY29uZHM6IDAgfTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xyXG4gICAgY29uc3QgbWF4QXR0ZW1wdHMgPSAxNTtcclxuICAgIGNvbnN0IGtleSA9IGAke3JvdXRlVHlwZX06JHtpcH1gO1xyXG4gICAgY29uc3QgZXhpc3RpbmcgPSByYXRlTGltaXRCeUtleS5nZXQoa2V5KTtcclxuXHJcbiAgICBpZiAoIWV4aXN0aW5nKSB7XHJcbiAgICAgIHJhdGVMaW1pdEJ5S2V5LnNldChrZXksIHsgY291bnQ6IDEsIHdpbmRvd1N0YXJ0OiBub3csIGJsb2NrZWRVbnRpbDogMCB9KTtcclxuICAgICAgcmV0dXJuIHsgYWxsb3dlZDogdHJ1ZSwgcmV0cnlBZnRlclNlY29uZHM6IDAgfTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZXhpc3RpbmcuYmxvY2tlZFVudGlsID4gbm93KSB7XHJcbiAgICAgIGNvbnN0IHJldHJ5QWZ0ZXJTZWNvbmRzID0gTWF0aC5jZWlsKChleGlzdGluZy5ibG9ja2VkVW50aWwgLSBub3cpIC8gMTAwMCk7XHJcbiAgICAgIHJldHVybiB7IGFsbG93ZWQ6IGZhbHNlLCByZXRyeUFmdGVyU2Vjb25kcyB9O1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChub3cgLSBleGlzdGluZy53aW5kb3dTdGFydCA+IFJBVEVfTElNSVRfV0lORE9XX01TKSB7XHJcbiAgICAgIHJhdGVMaW1pdEJ5S2V5LnNldChrZXksIHsgY291bnQ6IDEsIHdpbmRvd1N0YXJ0OiBub3csIGJsb2NrZWRVbnRpbDogMCB9KTtcclxuICAgICAgcmV0dXJuIHsgYWxsb3dlZDogdHJ1ZSwgcmV0cnlBZnRlclNlY29uZHM6IDAgfTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBuZXh0Q291bnQgPSBleGlzdGluZy5jb3VudCArIDE7XHJcbiAgICBjb25zdCBibG9ja2VkVW50aWwgPSBuZXh0Q291bnQgPiBtYXhBdHRlbXB0cyA/IG5vdyArIFJBVEVfTElNSVRfQkxPQ0tfTVMgOiAwO1xyXG4gICAgcmF0ZUxpbWl0QnlLZXkuc2V0KGtleSwge1xyXG4gICAgICBjb3VudDogbmV4dENvdW50LFxyXG4gICAgICB3aW5kb3dTdGFydDogZXhpc3Rpbmcud2luZG93U3RhcnQsXHJcbiAgICAgIGJsb2NrZWRVbnRpbCxcclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChibG9ja2VkVW50aWwgPiAwKSB7XHJcbiAgICAgIGNvbnN0IHJldHJ5QWZ0ZXJTZWNvbmRzID0gTWF0aC5jZWlsKChibG9ja2VkVW50aWwgLSBub3cpIC8gMTAwMCk7XHJcbiAgICAgIHJldHVybiB7IGFsbG93ZWQ6IGZhbHNlLCByZXRyeUFmdGVyU2Vjb25kcyB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7IGFsbG93ZWQ6IHRydWUsIHJldHJ5QWZ0ZXJTZWNvbmRzOiAwIH07XHJcbiAgfTtcclxuXHJcbiAgY29uc3Qgd3JpdGVFbnZWYWx1ZSA9IChrZXk6IHN0cmluZywgdmFsdWU6IHN0cmluZykgPT4ge1xyXG4gICAgY29uc3QgZW52UGF0aCA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCBcIi5lbnZcIik7XHJcbiAgICBjb25zdCBzYWZlVmFsdWUgPSBTdHJpbmcodmFsdWUgPz8gXCJcIikucmVwbGFjZSgvXFxyP1xcbi9nLCBcIlwiKS50cmltKCk7XHJcblxyXG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKGVudlBhdGgpKSB7XHJcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMoZW52UGF0aCwgYCR7a2V5fT0ke3NhZmVWYWx1ZX1cXG5gLCBcInV0ZjhcIik7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGVudlBhdGgsIFwidXRmOFwiKTtcclxuICAgIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdCgvXFxyP1xcbi8pO1xyXG4gICAgbGV0IHVwZGF0ZWQgPSBmYWxzZTtcclxuXHJcbiAgICBjb25zdCBuZXh0TGluZXMgPSBsaW5lcy5tYXAoKGxpbmUpID0+IHtcclxuICAgICAgaWYgKGxpbmUudHJpbSgpLnN0YXJ0c1dpdGgoYCR7a2V5fT1gKSkge1xyXG4gICAgICAgIHVwZGF0ZWQgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybiBgJHtrZXl9PSR7c2FmZVZhbHVlfWA7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGxpbmU7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoIXVwZGF0ZWQpIHtcclxuICAgICAgbmV4dExpbmVzLnB1c2goYCR7a2V5fT0ke3NhZmVWYWx1ZX1gKTtcclxuICAgIH1cclxuXHJcbiAgICBmcy53cml0ZUZpbGVTeW5jKGVudlBhdGgsIGAke25leHRMaW5lcy5qb2luKFwiXFxuXCIpLnJlcGxhY2UoL1xcbiskLywgXCJcIil9XFxuYCwgXCJ1dGY4XCIpO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGNyZWF0ZVJvdXRlSGFuZGxlciA9IChyb3V0ZVR5cGU6IEF1dGhSb3V0ZVR5cGUpOiBNaWRkbGV3YXJlSGFuZGxlciA9PiB7XHJcbiAgICByZXR1cm4gKHJlcSwgcmVzKSA9PiB7XHJcblxyXG4gICAgICBpZiAocmVxLm1ldGhvZCAhPT0gXCJQT1NUXCIpIHtcclxuICAgICAgICBzZW5kSnNvbihyZXMsIDQwNSwgeyBzdWNjZXNzOiBmYWxzZSB9KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGlwID0gZ2V0Q2xpZW50SXAocmVxKTtcclxuICAgICAgY29uc3QgcmF0ZSA9IGNoZWNrUmF0ZUxpbWl0KHJvdXRlVHlwZSwgaXApO1xyXG4gICAgICBpZiAoIXJhdGUuYWxsb3dlZCkge1xyXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoXCJSZXRyeS1BZnRlclwiLCBTdHJpbmcocmF0ZS5yZXRyeUFmdGVyU2Vjb25kcykpO1xyXG4gICAgICAgIHNlbmRKc29uKHJlcywgNDI5LCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogXCJUb28gbWFueSBhdHRlbXB0cy4gUGxlYXNlIHRyeSBhZ2FpbiBsYXRlci5cIiB9KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGxldCBib2R5ID0gXCJcIjtcclxuICAgICAgcmVxLm9uKFwiZGF0YVwiLCAoY2h1bms6IEJ1ZmZlciB8IHN0cmluZykgPT4ge1xyXG4gICAgICAgIGJvZHkgKz0gY2h1bmsudG9TdHJpbmcoKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXEub24oXCJlbmRcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBjb25zdCBwYXJzZWQgPSBib2R5ID8gKEpTT04ucGFyc2UoYm9keSkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIDoge307XHJcbiAgICAgICAgICBjb25zdCByZWFkU3RyaW5nID0gKHZhbHVlOiB1bmtub3duKSA9PiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiID8gdmFsdWUudHJpbSgpIDogXCJcIik7XHJcblxyXG4gICAgICAgICAgY29uc3QgdmVyaWZ5TG9naW4gPSAoZW1haWw6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZywgZXhwZWN0ZWRFbWFpbDogc3RyaW5nLCBleHBlY3RlZFBhc3N3b3JkOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9XHJcbiAgICAgICAgICAgICAgdHlwZW9mIGVtYWlsID09PSBcInN0cmluZ1wiICYmXHJcbiAgICAgICAgICAgICAgdHlwZW9mIHBhc3N3b3JkID09PSBcInN0cmluZ1wiICYmXHJcbiAgICAgICAgICAgICAgISFleHBlY3RlZEVtYWlsICYmXHJcbiAgICAgICAgICAgICAgISFleHBlY3RlZFBhc3N3b3JkICYmXHJcbiAgICAgICAgICAgICAgZW1haWwgPT09IGV4cGVjdGVkRW1haWwgJiZcclxuICAgICAgICAgICAgICBwYXNzd29yZCA9PT0gZXhwZWN0ZWRQYXNzd29yZDtcclxuICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3M7XHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIGNvbnN0IGNoYW5nZVBhc3N3b3JkID0gKFxyXG4gICAgICAgICAgICBrZXlFbWFpbDogc3RyaW5nLFxyXG4gICAgICAgICAgICBrZXlQYXNzd29yZDogc3RyaW5nLFxyXG4gICAgICAgICAgICBnZXRDdXJyZW50RW1haWw6ICgpID0+IHN0cmluZyxcclxuICAgICAgICAgICAgZ2V0Q3VycmVudFBhc3N3b3JkOiAoKSA9PiBzdHJpbmcsXHJcbiAgICAgICAgICAgIHNldEN1cnJlbnQ6IChuZXh0RW1haWw6IHN0cmluZywgbmV4dFBhc3N3b3JkOiBzdHJpbmcpID0+IHZvaWRcclxuICAgICAgICAgICkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBlbWFpbCA9IHJlYWRTdHJpbmcocGFyc2VkPy5lbWFpbCk7XHJcbiAgICAgICAgICAgIGNvbnN0IG9sZFBhc3N3b3JkID0gcmVhZFN0cmluZyhwYXJzZWQ/Lm9sZF9wYXNzd29yZCA/PyBwYXJzZWQ/Lm9sZFBhc3N3b3JkKTtcclxuICAgICAgICAgICAgY29uc3QgbmV3UGFzc3dvcmQgPSByZWFkU3RyaW5nKHBhcnNlZD8ubmV3X3Bhc3N3b3JkID8/IHBhcnNlZD8ubmV3UGFzc3dvcmQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFlbWFpbCB8fCAhb2xkUGFzc3dvcmQgfHwgIW5ld1Bhc3N3b3JkKSB7XHJcbiAgICAgICAgICAgICAgc2VuZEpzb24ocmVzLCA0MDAsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBcIkVtYWlsLCBvbGQgcGFzc3dvcmQgYW5kIG5ldyBwYXNzd29yZCBhcmUgcmVxdWlyZWQuXCIgfSk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobmV3UGFzc3dvcmQubGVuZ3RoIDwgNCkge1xyXG4gICAgICAgICAgICAgIHNlbmRKc29uKHJlcywgNDAwLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogXCJOZXcgcGFzc3dvcmQgbXVzdCBiZSBhdCBsZWFzdCA0IGNoYXJhY3RlcnMuXCIgfSk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZW1haWwgIT09IGdldEN1cnJlbnRFbWFpbCgpIHx8IG9sZFBhc3N3b3JkICE9PSBnZXRDdXJyZW50UGFzc3dvcmQoKSkge1xyXG4gICAgICAgICAgICAgIHNlbmRKc29uKHJlcywgNDAxLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogXCJPbGQgcGFzc3dvcmQgaXMgaW5jb3JyZWN0LlwiIH0pO1xyXG4gICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2V0Q3VycmVudChlbWFpbCwgbmV3UGFzc3dvcmQpO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudltrZXlFbWFpbF0gPSBlbWFpbDtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnZba2V5UGFzc3dvcmRdID0gbmV3UGFzc3dvcmQ7XHJcblxyXG4gICAgICAgICAgICB3cml0ZUVudlZhbHVlKGtleUVtYWlsLCBlbWFpbCk7XHJcbiAgICAgICAgICAgIHdyaXRlRW52VmFsdWUoa2V5UGFzc3dvcmQsIG5ld1Bhc3N3b3JkKTtcclxuXHJcbiAgICAgICAgICAgIHNlbmRKc29uKHJlcywgMjAwLCB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6IFwiUGFzc3dvcmQgY2hhbmdlZCBzdWNjZXNzZnVsbHkuXCIgfSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgaWYgKHJvdXRlVHlwZSA9PT0gXCJ2ZXJpZnktYWRtaW5cIikge1xyXG4gICAgICAgICAgICBjb25zdCBlbWFpbCA9IHJlYWRTdHJpbmcocGFyc2VkPy5lbWFpbCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhc3N3b3JkID0gcmVhZFN0cmluZyhwYXJzZWQ/LnBhc3N3b3JkKTtcclxuICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IHZlcmlmeUxvZ2luKGVtYWlsLCBwYXNzd29yZCwgY3VycmVudEFkbWluRW1haWwsIGN1cnJlbnRBZG1pblBhc3N3b3JkKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgIHNlbmRKc29uKHJlcywgNDAxLCB7IHN1Y2Nlc3M6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgYXV0aFRva2VuID0gY3JlYXRlU2Vzc2lvblRva2VuKGVtYWlsKTtcclxuICAgICAgICAgICAgc2VuZEpzb24ocmVzLCAyMDAsIHsgc3VjY2VzczogdHJ1ZSwgYXV0aFRva2VuIH0pO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKHJvdXRlVHlwZSA9PT0gXCJjaGFuZ2UtYWRtaW4tcGFzc3dvcmRcIikge1xyXG4gICAgICAgICAgICBjaGFuZ2VQYXNzd29yZChcclxuICAgICAgICAgICAgICBcIkFETUlOX0VNQUlMXCIsXHJcbiAgICAgICAgICAgICAgXCJBRE1JTl9QQVNTV09SRFwiLFxyXG4gICAgICAgICAgICAgICgpID0+IGN1cnJlbnRBZG1pbkVtYWlsLFxyXG4gICAgICAgICAgICAgICgpID0+IGN1cnJlbnRBZG1pblBhc3N3b3JkLFxyXG4gICAgICAgICAgICAgIChuZXh0RW1haWwsIG5leHRQYXNzd29yZCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY3VycmVudEFkbWluRW1haWwgPSBuZXh0RW1haWw7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50QWRtaW5QYXNzd29yZCA9IG5leHRQYXNzd29yZDtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAocm91dGVUeXBlID09PSBcInZlcmlmeS1hZG1pbi1lZGl0XCIpIHtcclxuICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IHJlYWRTdHJpbmcocGFyc2VkPy5wYXNzd29yZCkgPT09IEVESVRfQUNUSU9OX1BBU1NXT1JEO1xyXG5cclxuICAgICAgICAgICAgc2VuZEpzb24ocmVzLCBzdWNjZXNzID8gMjAwIDogNDAxLCB7IHN1Y2Nlc3MgfSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAocm91dGVUeXBlID09PSBcImNoYW5nZS1hZG1pbi1lZGl0LXBhc3N3b3JkXCIpIHtcclxuICAgICAgICAgICAgc2VuZEpzb24ocmVzLCA0MTAsIHtcclxuICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICBlcnJvcjogXCJFZGl0L2RlbGV0ZSBwYXNzd29yZCBpcyBmaXhlZCBhbmQgY2Fubm90IGJlIGNoYW5nZWQgZnJvbSBBUEkuXCIsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKHJvdXRlVHlwZSA9PT0gXCJ2ZXJpZnktYWRtaW4tc2Vzc2lvblwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGF1dGhUb2tlbiA9IHJlYWRTdHJpbmcocGFyc2VkPy5hdXRoVG9rZW4pO1xyXG4gICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gISFhdXRoVG9rZW4gJiYgaXNWYWxpZFNlc3Npb25Ub2tlbihhdXRoVG9rZW4pO1xyXG4gICAgICAgICAgICBzZW5kSnNvbihyZXMsIHN1Y2Nlc3MgPyAyMDAgOiA0MDEsIHsgc3VjY2VzcyB9KTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmIChyb3V0ZVR5cGUgPT09IFwibG9nb3V0LWFkbWluXCIpIHtcclxuICAgICAgICAgICAgLy8gU3RhdGVsZXNzIHNlc3Npb24gdG9rZW46IGxvZ291dCBpcyBoYW5kbGVkIG9uIGNsaWVudCBieSBkZWxldGluZyB0b2tlbi5cclxuICAgICAgICAgICAgc2VuZEpzb24ocmVzLCAyMDAsIHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHNlbmRKc29uKHJlcywgNDA0LCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogXCJSb3V0ZSBub3QgZm91bmRcIiB9KTtcclxuICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgIHNlbmRKc29uKHJlcywgNDAwLCB7IHN1Y2Nlc3M6IGZhbHNlIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBuYW1lOiBcInZlcmlmeS1hZG1pbi1hcGlcIixcclxuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXI6IE1pZGRsZXdhcmVDYXBhYmxlU2VydmVyKSB7XHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoXCIvYXBpL3ZlcmlmeS1hZG1pblwiLCBjcmVhdGVSb3V0ZUhhbmRsZXIoXCJ2ZXJpZnktYWRtaW5cIikpO1xyXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKFwiL2FwaS9jaGFuZ2UtYWRtaW4tcGFzc3dvcmRcIiwgY3JlYXRlUm91dGVIYW5kbGVyKFwiY2hhbmdlLWFkbWluLXBhc3N3b3JkXCIpKTtcclxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShcIi9hcGkvdmVyaWZ5LWFkbWluLWVkaXRcIiwgY3JlYXRlUm91dGVIYW5kbGVyKFwidmVyaWZ5LWFkbWluLWVkaXRcIikpO1xyXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKFwiL2FwaS9jaGFuZ2UtYWRtaW4tZWRpdC1wYXNzd29yZFwiLCBjcmVhdGVSb3V0ZUhhbmRsZXIoXCJjaGFuZ2UtYWRtaW4tZWRpdC1wYXNzd29yZFwiKSk7XHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoXCIvYXBpL3ZlcmlmeS1hZG1pbi1zZXNzaW9uXCIsIGNyZWF0ZVJvdXRlSGFuZGxlcihcInZlcmlmeS1hZG1pbi1zZXNzaW9uXCIpKTtcclxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShcIi9hcGkvbG9nb3V0LWFkbWluXCIsIGNyZWF0ZVJvdXRlSGFuZGxlcihcImxvZ291dC1hZG1pblwiKSk7XHJcbiAgICB9LFxyXG4gICAgY29uZmlndXJlUHJldmlld1NlcnZlcihzZXJ2ZXI6IE1pZGRsZXdhcmVDYXBhYmxlU2VydmVyKSB7XHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoXCIvYXBpL3ZlcmlmeS1hZG1pblwiLCBjcmVhdGVSb3V0ZUhhbmRsZXIoXCJ2ZXJpZnktYWRtaW5cIikpO1xyXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKFwiL2FwaS9jaGFuZ2UtYWRtaW4tcGFzc3dvcmRcIiwgY3JlYXRlUm91dGVIYW5kbGVyKFwiY2hhbmdlLWFkbWluLXBhc3N3b3JkXCIpKTtcclxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShcIi9hcGkvdmVyaWZ5LWFkbWluLWVkaXRcIiwgY3JlYXRlUm91dGVIYW5kbGVyKFwidmVyaWZ5LWFkbWluLWVkaXRcIikpO1xyXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKFwiL2FwaS9jaGFuZ2UtYWRtaW4tZWRpdC1wYXNzd29yZFwiLCBjcmVhdGVSb3V0ZUhhbmRsZXIoXCJjaGFuZ2UtYWRtaW4tZWRpdC1wYXNzd29yZFwiKSk7XHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoXCIvYXBpL3ZlcmlmeS1hZG1pbi1zZXNzaW9uXCIsIGNyZWF0ZVJvdXRlSGFuZGxlcihcInZlcmlmeS1hZG1pbi1zZXNzaW9uXCIpKTtcclxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShcIi9hcGkvbG9nb3V0LWFkbWluXCIsIGNyZWF0ZVJvdXRlSGFuZGxlcihcImxvZ291dC1hZG1pblwiKSk7XHJcbiAgICB9LFxyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNlbmRXaGF0c0FwcEFwaVBsdWdpbigpIHtcclxuICB0eXBlIE1pZGRsZXdhcmVIYW5kbGVyID0gKHJlcTogSW5jb21pbmdNZXNzYWdlLCByZXM6IFNlcnZlclJlc3BvbnNlKSA9PiB2b2lkO1xyXG4gIHR5cGUgTWlkZGxld2FyZUNhcGFibGVTZXJ2ZXIgPSB7XHJcbiAgICBtaWRkbGV3YXJlczoge1xyXG4gICAgICB1c2U6IChwYXRoOiBzdHJpbmcsIGhhbmRsZXI6IE1pZGRsZXdhcmVIYW5kbGVyKSA9PiB2b2lkO1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBjb25zdCBmb3JtYXREYXRlVG9EZG1teXl5eSA9IChkYXRlVmFsdWU6IHN0cmluZyk6IHN0cmluZyA9PiB7XHJcbiAgICBjb25zdCB0cmltbWVkID0gU3RyaW5nKGRhdGVWYWx1ZSB8fCBcIlwiKS50cmltKCk7XHJcbiAgICBpZiAoIXRyaW1tZWQgfHwgdHJpbW1lZCA9PT0gXCJOL0FcIikgcmV0dXJuIFwiTi9BXCI7XHJcbiAgICBjb25zdCBwYXJ0cyA9IHRyaW1tZWQuc3BsaXQoXCItXCIpO1xyXG4gICAgaWYgKHBhcnRzLmxlbmd0aCAhPT0gMykgcmV0dXJuIHRyaW1tZWQ7XHJcbiAgICBjb25zdCBbeWVhciwgbW9udGgsIGRheV0gPSBwYXJ0cztcclxuICAgIGlmICgheWVhciB8fCAhbW9udGggfHwgIWRheSkgcmV0dXJuIHRyaW1tZWQ7XHJcbiAgICByZXR1cm4gYCR7ZGF5LnBhZFN0YXJ0KDIsIFwiMFwiKX0tJHttb250aC5wYWRTdGFydCgyLCBcIjBcIil9LSR7eWVhcn1gO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGZvcm1hdFRpbWVUbzEySG91ciA9ICh0aW1lVmFsdWU6IHN0cmluZyk6IHN0cmluZyA9PiB7XHJcbiAgICBjb25zdCB0cmltbWVkID0gU3RyaW5nKHRpbWVWYWx1ZSB8fCBcIlwiKS50cmltKCk7XHJcbiAgICBpZiAoIXRyaW1tZWQgfHwgdHJpbW1lZCA9PT0gXCJOL0FcIikgcmV0dXJuIFwiTi9BXCI7XHJcbiAgICBjb25zdCB1cHBlciA9IHRyaW1tZWQudG9VcHBlckNhc2UoKTtcclxuICAgIGlmICh1cHBlci5pbmNsdWRlcyhcIkFNXCIpIHx8IHVwcGVyLmluY2x1ZGVzKFwiUE1cIikpIHJldHVybiB0cmltbWVkO1xyXG4gICAgY29uc3QgcGFydHMgPSB0cmltbWVkLnNwbGl0KFwiOlwiKTtcclxuICAgIGlmIChwYXJ0cy5sZW5ndGggPCAyKSByZXR1cm4gdHJpbW1lZDtcclxuICAgIGNvbnN0IGhvdXJzID0gTnVtYmVyKHBhcnRzWzBdKTtcclxuICAgIGNvbnN0IG1pbnV0ZXMgPSBOdW1iZXIocGFydHNbMV0pO1xyXG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoaG91cnMpIHx8ICFOdW1iZXIuaXNGaW5pdGUobWludXRlcykpIHJldHVybiB0cmltbWVkO1xyXG4gICAgY29uc3QgcGVyaW9kID0gaG91cnMgPj0gMTIgPyBcIlBNXCIgOiBcIkFNXCI7XHJcbiAgICBjb25zdCBkaXNwbGF5SG91cnMgPSBob3VycyAlIDEyIHx8IDEyO1xyXG4gICAgY29uc3QgZGlzcGxheU1pbnV0ZXMgPSBTdHJpbmcobWludXRlcykucGFkU3RhcnQoMiwgXCIwXCIpO1xyXG4gICAgcmV0dXJuIGAke2Rpc3BsYXlIb3Vyc306JHtkaXNwbGF5TWludXRlc30gJHtwZXJpb2R9YDtcclxuICB9O1xyXG5cclxuICBjb25zdCBoYW5kbGVyOiBNaWRkbGV3YXJlSGFuZGxlciA9IChyZXEsIHJlcykgPT4ge1xyXG4gICAgaWYgKHJlcS5tZXRob2QgIT09IFwiUE9TVFwiKSB7XHJcbiAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA1O1xyXG4gICAgICByZXMuc2V0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcclxuICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlIH0pKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBib2R5ID0gXCJcIjtcclxuICAgIHJlcS5vbihcImRhdGFcIiwgKGNodW5rOiBCdWZmZXIgfCBzdHJpbmcpID0+IHtcclxuICAgICAgYm9keSArPSBjaHVuay50b1N0cmluZygpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmVxLm9uKFwiZW5kXCIsIGFzeW5jICgpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBwYXJzZWQgPSBib2R5ID8gSlNPTi5wYXJzZShib2R5KSA6IHt9O1xyXG4gICAgICAgIGNvbnN0IHBob25lID0gcGFyc2VkPy5waG9uZTtcclxuICAgICAgICBjb25zdCBuYW1lID0gcGFyc2VkPy5uYW1lO1xyXG4gICAgICAgIGNvbnN0IGRhdGUgPSBwYXJzZWQ/LmRhdGU7XHJcbiAgICAgICAgY29uc3QgcGFydHlUaW1lID0gcGFyc2VkPy5wYXJ0eV90aW1lO1xyXG4gICAgICAgIGNvbnN0IHBhcnR5RW5kVGltZSA9IHBhcnNlZD8ucGFydHlfZW5kX3RpbWU7XHJcbiAgICAgICAgY29uc3Qgc3RhcnRlclRpbWUgPSBwYXJzZWQ/LnN0YXJ0ZXJfdGltZTtcclxuICAgICAgICBjb25zdCBtYWluQ291cnNlVGltZSA9IHBhcnNlZD8ubWFpbl9jb3Vyc2VfdGltZTtcclxuICAgICAgICBjb25zdCBkalRpbWUgPSBwYXJzZWQ/LmRqX3RpbWU7XHJcblxyXG4gICAgICAgIGNvbnN0IG1lbnVJdGVtcyA9IEFycmF5LmlzQXJyYXkocGFyc2VkPy5tZW51X2l0ZW1zKSA/IHBhcnNlZC5tZW51X2l0ZW1zIDogW107XHJcbiAgICAgICAgbGV0IGR5bmFtaWNMaW5rID0gcHJvY2Vzcy5lbnYuVEVSTVNfTElOSyB8fCBcImh0dHBzOi8vd3d3Lm1veC12b3gub25saW5lL3Rlcm1zLmh0bWxcIjtcclxuICAgICAgICBpZiAobWVudUl0ZW1zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgIGNvbnN0IGVuY29kZWRJdGVtcyA9IGVuY29kZVVSSUNvbXBvbmVudChtZW51SXRlbXMuam9pbihcInxcIikpO1xyXG4gICAgICAgICAgZHluYW1pY0xpbmsgPSBgaHR0cHM6Ly93d3cubW94LXZveC5vbmxpbmUvbWVudS5odG1sP2l0ZW1zPSR7ZW5jb2RlZEl0ZW1zfWA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBmb3JtYXR0ZWRQYXJ0eVN0YXJ0ID0gZm9ybWF0VGltZVRvMTJIb3VyKFN0cmluZyhwYXJ0eVRpbWUgfHwgXCJOL0FcIikpO1xyXG4gICAgICAgIGNvbnN0IGZvcm1hdHRlZFBhcnR5RW5kID0gZm9ybWF0VGltZVRvMTJIb3VyKFN0cmluZyhwYXJ0eUVuZFRpbWUgfHwgXCJOL0FcIikpO1xyXG4gICAgICAgIGNvbnN0IGZvcm1hdHRlZFBhcnR5VGltZSA9IGZvcm1hdHRlZFBhcnR5RW5kICE9PSBcIk4vQVwiXHJcbiAgICAgICAgICA/IGAke2Zvcm1hdHRlZFBhcnR5U3RhcnR9IC0gJHtmb3JtYXR0ZWRQYXJ0eUVuZH1gXHJcbiAgICAgICAgICA6IGZvcm1hdHRlZFBhcnR5U3RhcnQ7XHJcblxyXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlUGFyYW1zID0gW1xyXG4gICAgICAgICAgU3RyaW5nKG5hbWUgfHwgXCJHdWVzdFwiKSxcclxuICAgICAgICAgIGZvcm1hdERhdGVUb0RkbW15eXl5KFN0cmluZyhkYXRlIHx8IFwiTi9BXCIpKSxcclxuICAgICAgICAgIGZvcm1hdHRlZFBhcnR5VGltZSxcclxuICAgICAgICAgIGZvcm1hdFRpbWVUbzEySG91cihTdHJpbmcoc3RhcnRlclRpbWUgfHwgXCJOL0FcIikpLFxyXG4gICAgICAgICAgZm9ybWF0VGltZVRvMTJIb3VyKFN0cmluZyhtYWluQ291cnNlVGltZSB8fCBcIk4vQVwiKSksXHJcbiAgICAgICAgICBmb3JtYXRUaW1lVG8xMkhvdXIoU3RyaW5nKGRqVGltZSB8fCBcIk4vQVwiKSksXHJcbiAgICAgICAgICBkeW5hbWljTGlua1xyXG4gICAgICAgIF07XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiXFxuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cIik7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJbUm91dGUgRGVidWddIEluY29taW5nIFBPU1QgdG8gL2FwaS9zZW5kLXdoYXRzYXBwXCIpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiW1JvdXRlIERlYnVnXSBQYXlsb2FkOlwiLCBKU09OLnN0cmluZ2lmeShwYXJzZWQpKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIltSb3V0ZSBEZWJ1Z10gRHluYW1pYyBMaW5rOlwiLCBkeW5hbWljTGluayk7XHJcblxyXG4gICAgICAgIGlmICghcGhvbmUpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbUm91dGUgRGVidWddIE5vIHBob25lIG51bWJlciBwcm92aWRlZCBpbiBwYXlsb2FkXCIpO1xyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDA7XHJcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcclxuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IFwicGhvbmUgaXMgcmVxdWlyZWRcIiB9KSk7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyhgW1JvdXRlIERlYnVnXSBDYWxsaW5nIHNlbmRXaGF0c0FwcCB3aXRoIHBob25lPSR7cGhvbmV9YCk7XHJcbiAgICAgICAgYXdhaXQgc2VuZFdoYXRzQXBwKFN0cmluZyhwaG9uZSksIHRlbXBsYXRlUGFyYW1zKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIltSb3V0ZSBEZWJ1Z10gc2VuZFdoYXRzQXBwIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHkuXCIpO1xyXG5cclxuICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcclxuICAgICAgICByZXMuc2V0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcclxuICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSB9KSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiB1bmtub3duKSB7XHJcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogXCJXaGF0c0FwcCBzZW5kIGZhaWxlZFwiO1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJcXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVwiKTtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiW1JvdXRlIERlYnVnXSBXaGF0c0FwcCBBUEkgZXJyb3IgY2F1Z2h0IGluIHJvdXRlOlwiKTtcclxuICAgICAgICBjb25zb2xlLmVycm9yKG1lc3NhZ2UpO1xyXG5cclxuICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcclxuICAgICAgICByZXMuc2V0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcclxuICAgICAgICByZXMuZW5kKFxyXG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgZXJyb3I6IG1lc3NhZ2UsXHJcbiAgICAgICAgICAgIGRlYnVnX2luZm86IFN0cmluZyhlcnJvcilcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIG5hbWU6IFwic2VuZC13aGF0c2FwcC1hcGlcIixcclxuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXI6IE1pZGRsZXdhcmVDYXBhYmxlU2VydmVyKSB7XHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoXCIvYXBpL3NlbmQtd2hhdHNhcHBcIiwgaGFuZGxlcik7XHJcbiAgICB9LFxyXG4gICAgY29uZmlndXJlUHJldmlld1NlcnZlcihzZXJ2ZXI6IE1pZGRsZXdhcmVDYXBhYmxlU2VydmVyKSB7XHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoXCIvYXBpL3NlbmQtd2hhdHNhcHBcIiwgaGFuZGxlcik7XHJcbiAgICB9LFxyXG4gIH07XHJcbn1cclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoKSA9PiB7XHJcbiAgLy8gSW50ZW50aW9uYWxseSBsb2FkIG9ubHkgLmVudiBzbyBlbnYgY29uZmlnIGhhcyBhIHNpbmdsZSBzb3VyY2Ugb2YgdHJ1dGguXHJcbiAgbG9hZERvdEVudk9ubHkoKTtcclxuXHJcbiAgY29uZmlndXJlV2hhdHNBcHAoe1xyXG4gICAgYXBpS2V5OiBwcm9jZXNzLmVudi5HUkVFTlRJQ0tfQVBJX0tFWSxcclxuICAgIGFwaVVybDogcHJvY2Vzcy5lbnYuR1JFRU5USUNLX0FQSV9VUkwsXHJcbiAgICBmcm9tTnVtYmVyOiBwcm9jZXNzLmVudi5XSEFUU0FQUF9GUk9NX05VTUJFUixcclxuICAgIHRlbXBsYXRlTmFtZTogcHJvY2Vzcy5lbnYuV0hBVFNBUFBfVEVNUExBVEVfTkFNRSxcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHBsdWdpbnM6IFtyZWFjdCgpLCB2ZXJpZnlBZG1pbkFwaVBsdWdpbigpLCBzZW5kV2hhdHNBcHBBcGlQbHVnaW4oKV0sXHJcbiAgICBkZWZpbmU6IHtcclxuICAgICAgX19TVVBBQkFTRV9VUkxfXzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgXCJcIiksXHJcbiAgICAgIF9fU1VQQUJBU0VfQU5PTl9LRVlfXzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSB8fCBcIlwiKSxcclxuICAgIH0sXHJcbiAgICByZXNvbHZlOiB7XHJcbiAgICAgIGFsaWFzOiB7XHJcbiAgICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH07XHJcbn0pO1xyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHBwbWF1XFxcXG1veC12b3gtd2Vic2l0ZS0xXFxcXHNlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxccHBtYXVcXFxcbW94LXZveC13ZWJzaXRlLTFcXFxcc2VydmVyXFxcXHNlbmRXaGF0c0FwcC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvcHBtYXUvbW94LXZveC13ZWJzaXRlLTEvc2VydmVyL3NlbmRXaGF0c0FwcC50c1wiO2xldCBncmVlbnRpY2tBcGlLZXkgPSBcIlwiO1xyXG5sZXQgZ3JlZW50aWNrQXBpVXJsID0gXCJcIjtcclxubGV0IGdyZWVudGlja0Zyb21OdW1iZXIgPSBcIlwiO1xyXG5sZXQgZ3JlZW50aWNrVGVtcGxhdGVOYW1lID0gXCJcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb25maWd1cmVXaGF0c0FwcChjb25maWc6IHsgYXBpS2V5Pzogc3RyaW5nOyBhcGlVcmw/OiBzdHJpbmc7IGZyb21OdW1iZXI/OiBzdHJpbmc7IHRlbXBsYXRlTmFtZT86IHN0cmluZyB9KSB7XHJcbiAgZ3JlZW50aWNrQXBpS2V5ID0gY29uZmlnLmFwaUtleSB8fCBcIlwiO1xyXG4gIGdyZWVudGlja0FwaVVybCA9IGNvbmZpZy5hcGlVcmwgfHwgXCJcIjtcclxuICBncmVlbnRpY2tGcm9tTnVtYmVyID0gY29uZmlnLmZyb21OdW1iZXIgfHwgXCJcIjtcclxuICBncmVlbnRpY2tUZW1wbGF0ZU5hbWUgPSBjb25maWcudGVtcGxhdGVOYW1lIHx8IFwiXCI7XHJcblxyXG4gIGlmICghZ3JlZW50aWNrQXBpS2V5IHx8ICFncmVlbnRpY2tBcGlVcmwpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgIFwiW1doYXRzQXBwXSBNaXNzaW5nIHJlcXVpcmVkIGVudiB2YXJzOiBHUkVFTlRJQ0tfQVBJX0tFWSBhbmQvb3IgR1JFRU5USUNLX0FQSV9VUkwgaW4gLmVudlwiXHJcbiAgICApO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZm9ybWF0SW5kaWFuUGhvbmUocGhvbmU6IHN0cmluZykge1xyXG4gIGNvbnN0IGRpZ2l0cyA9IFN0cmluZyhwaG9uZSB8fCBcIlwiKS5yZXBsYWNlKC9cXEQvZywgXCJcIik7XHJcblxyXG4gIGlmIChkaWdpdHMubGVuZ3RoID09PSAxMCkge1xyXG4gICAgcmV0dXJuIGA5MSR7ZGlnaXRzfWA7XHJcbiAgfVxyXG5cclxuICBpZiAoZGlnaXRzLmxlbmd0aCA9PT0gMTIgJiYgZGlnaXRzLnN0YXJ0c1dpdGgoXCI5MVwiKSkge1xyXG4gICAgcmV0dXJuIGRpZ2l0cztcclxuICB9XHJcblxyXG4gIGlmIChkaWdpdHMubGVuZ3RoID4gMTApIHtcclxuICAgIGNvbnN0IGxhc3QxMCA9IGRpZ2l0cy5zbGljZSgtMTApO1xyXG4gICAgcmV0dXJuIGA5MSR7bGFzdDEwfWA7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gYDkxJHtkaWdpdHN9YDtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlbmRXaGF0c0FwcChwaG9uZTogc3RyaW5nLCBwYXJhbXM6IHN0cmluZ1tdKSB7XHJcbiAgY29uc29sZS5sb2coXCJcXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVwiKTtcclxuICBjb25zb2xlLmxvZyhcIltXaGF0c0FwcCBEZWJ1Z10gQ2hlY2tpbmcgRW52aXJvbm1lbnQgVmFyaWFibGVzXCIpO1xyXG4gIGNvbnNvbGUubG9nKGBbV2hhdHNBcHAgRGVidWddIEdSRUVOVElDS19BUElfVVJMOiAke2dyZWVudGlja0FwaVVybCA/IGdyZWVudGlja0FwaVVybC5zdWJzdHJpbmcoMCwgMzApICsgXCIuLi5cIiA6IFwidW5kZWZpbmVkXCJ9YCk7XHJcbiAgY29uc29sZS5sb2coYFtXaGF0c0FwcCBEZWJ1Z10gR1JFRU5USUNLX0FQSV9LRVk6ICR7Z3JlZW50aWNrQXBpS2V5ID8gZ3JlZW50aWNrQXBpS2V5LnN1YnN0cmluZygwLCA1KSArIFwiLi4uXCIgOiBcInVuZGVmaW5lZFwifWApO1xyXG4gIGNvbnNvbGUubG9nKGBbV2hhdHNBcHAgRGVidWddIFdIQVRTQVBQX0ZST01fTlVNQkVSOiAke2dyZWVudGlja0Zyb21OdW1iZXJ9YCk7XHJcbiAgY29uc29sZS5sb2coYFtXaGF0c0FwcCBEZWJ1Z10gV0hBVFNBUFBfVEVNUExBVEVfTkFNRTogJHtncmVlbnRpY2tUZW1wbGF0ZU5hbWV9YCk7XHJcblxyXG4gIGlmICghZ3JlZW50aWNrQXBpS2V5IHx8ICFncmVlbnRpY2tBcGlVcmwpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcIk1pc3NpbmcgR3JlZW5UaWNrL0FPQyBBUEkga2V5IG9yIFVSTFwiKTtcclxuICB9XHJcblxyXG4gIGlmICghZ3JlZW50aWNrRnJvbU51bWJlciB8fCAhZ3JlZW50aWNrVGVtcGxhdGVOYW1lKSB7XHJcbiAgICBjb25zb2xlLndhcm4oXCJbV2hhdHNBcHAgRGVidWddIFdhcm5pbmc6IFdIQVRTQVBQX0ZST01fTlVNQkVSIG9yIFdIQVRTQVBQX1RFTVBMQVRFX05BTUUgaXMgbWlzc2luZyBmcm9tIC5lbnZcIik7XHJcbiAgfVxyXG5cclxuICBjb25zdCB0byA9IGZvcm1hdEluZGlhblBob25lKHBob25lKTtcclxuICBjb25zb2xlLmxvZyhgW1doYXRzQXBwIERlYnVnXSBGb3JtYXR0ZWQgcGhvbmUgbnVtYmVyOiAke3RvfWApO1xyXG5cclxuICAvLyBDb25zdHJ1Y3QgcGF5bG9hZCBzcGVjaWZpY2FsbHkgZm9yIEFPQyBBUEkgVGVtcGxhdGUgZm9ybWF0XHJcbiAgY29uc3QgcGF5bG9hZCA9IHtcclxuICAgIGZyb206IGdyZWVudGlja0Zyb21OdW1iZXIgfHwgXCIrOTEwMDAwMDAwMDAwXCIsIC8vIFdpbGwgZmFpbCBpZiBub3QgcHJvdmlkZWQgaW4gLmVudiwgYnV0IGZvbGxvd3MgZm9ybWF0XHJcbiAgICBjYW1wYWlnbk5hbWU6IFwiYXBpLXRlc3RcIixcclxuICAgIHRvOiBgKyR7dG99YCwgXHJcbiAgICB0ZW1wbGF0ZU5hbWU6IGdyZWVudGlja1RlbXBsYXRlTmFtZSB8fCBcInRlbXBsYXRlX25hbWVcIixcclxuICAgIGNvbXBvbmVudHM6IHtcclxuICAgICAgYm9keToge1xyXG4gICAgICAgIHBhcmFtczogcGFyYW1zXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICB0eXBlOiBcInRlbXBsYXRlXCJcclxuICB9O1xyXG4gIFxyXG4gIGNvbnNvbGUubG9nKFwiW1doYXRzQXBwIERlYnVnXSBQYXlsb2FkIGJlaW5nIHNlbnQ6XCIsIEpTT04uc3RyaW5naWZ5KHBheWxvYWQpKTtcclxuICBjb25zb2xlLmxvZyhgW1doYXRzQXBwIERlYnVnXSBTZW5kaW5nIHJlcXVlc3QgdG86ICR7Z3JlZW50aWNrQXBpVXJsfWApO1xyXG4gIGNvbnNvbGUubG9nKFwiW1doYXRzQXBwIERlYnVnXSBIZWFkZXJzOlwiLCBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICBhcGlrZXk6IGAke2dyZWVudGlja0FwaUtleS5zdWJzdHJpbmcoMCwgNSl9Li4uYCxcclxuICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gIH0pKTtcclxuXHJcbiAgbGV0IHJlc3BvbnNlOiBSZXNwb25zZTtcclxuICB0cnkge1xyXG4gICAgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChncmVlbnRpY2tBcGlVcmwsIHtcclxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIGFwaWtleTogZ3JlZW50aWNrQXBpS2V5LFxyXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSxcclxuICAgIH0pO1xyXG4gICAgY29uc29sZS5sb2coYFtXaGF0c0FwcCBEZWJ1Z10gRmV0Y2ggY29tcGxldGVkLiBTdGF0dXM6ICR7cmVzcG9uc2Uuc3RhdHVzfSAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YCk7XHJcbiAgfSBjYXRjaCAoZXJyb3I6IHVua25vd24pIHtcclxuICAgIGNvbnN0IG1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiVW5rbm93biBlcnJvclwiO1xyXG4gICAgY29uc3QgY2F1c2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gKGVycm9yIGFzIEVycm9yICYgeyBjYXVzZT86IHsgY29kZT86IHN0cmluZzsgbWVzc2FnZT86IHN0cmluZyB9IH0pLmNhdXNlIDogdW5kZWZpbmVkO1xyXG4gICAgY29uc29sZS5lcnJvcihcIltXaGF0c0FwcCBEZWJ1Z10gRmV0Y2ggZmFpbGVkIHdpdGggZXhjZXB0aW9uOlwiLCBtZXNzYWdlLCBjYXVzZSk7XHJcbiAgICBjb25zdCBjYXVzZUNvZGUgPSBjYXVzZT8uY29kZTtcclxuICAgIGNvbnN0IGNhdXNlTWVzc2FnZSA9IGNhdXNlPy5tZXNzYWdlO1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICBbXCJOZXR3b3JrIGVycm9yIHdoaWxlIGNhbGxpbmcgR3JlZW5UaWNrIEFQSVwiLCBtZXNzYWdlLCBjYXVzZUNvZGUsIGNhdXNlTWVzc2FnZV1cclxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXHJcbiAgICAgICAgLmpvaW4oXCIgfCBcIilcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBjb25zdCByZXNwb25zZVRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XHJcbiAgY29uc29sZS5sb2coYFtXaGF0c0FwcCBEZWJ1Z10gUmVzcG9uc2UgQm9keTogJHtyZXNwb25zZVRleHR9YCk7XHJcblxyXG4gIGxldCBkYXRhID0ge307XHJcbiAgaWYgKHJlc3BvbnNlVGV4dCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBkYXRhID0gSlNPTi5wYXJzZShyZXNwb25zZVRleHQpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBbV2hhdHNBcHAgRGVidWddIENvdWxkIG5vdCBwYXJzZSByZXNwb25zZSBhcyBKU09OYCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpZiAoIXJlc3BvbnNlLm9rKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFdoYXRzQXBwIFNlbmQgRmFpbGVkOiBTdGF0dXMgJHtyZXNwb25zZS5zdGF0dXN9IHwgQm9keTogJHtyZXNwb25zZVRleHR9YCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZGF0YTtcclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTBSLE9BQU8sUUFBUTtBQUN6UyxTQUFTLFlBQVksdUJBQXVCO0FBRTVDLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7OztBQ0xrUyxJQUFJLGtCQUFrQjtBQUN6VSxJQUFJLGtCQUFrQjtBQUN0QixJQUFJLHNCQUFzQjtBQUMxQixJQUFJLHdCQUF3QjtBQUVyQixTQUFTLGtCQUFrQixRQUEwRjtBQUMxSCxvQkFBa0IsT0FBTyxVQUFVO0FBQ25DLG9CQUFrQixPQUFPLFVBQVU7QUFDbkMsd0JBQXNCLE9BQU8sY0FBYztBQUMzQywwQkFBd0IsT0FBTyxnQkFBZ0I7QUFFL0MsTUFBSSxDQUFDLG1CQUFtQixDQUFDLGlCQUFpQjtBQUN4QyxZQUFRO0FBQUEsTUFDTjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxTQUFTLGtCQUFrQixPQUFlO0FBQ3hDLFFBQU0sU0FBUyxPQUFPLFNBQVMsRUFBRSxFQUFFLFFBQVEsT0FBTyxFQUFFO0FBRXBELE1BQUksT0FBTyxXQUFXLElBQUk7QUFD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
