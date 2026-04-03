type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type JsonObject = { [key: string]: JsonValue };

export type KVNamespaceLike = {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string) => Promise<void>;
};

export type EnvBindings = {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_EDIT_EMAIL?: string;
  ADMIN_EDIT_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
  GREENTICK_API_KEY?: string;
  GREENTICK_API_URL?: string;
  TERMS_LINK?: string;
  WHATSAPP_FROM_NUMBER?: string;
  WHATSAPP_TEMPLATE_NAME?: string;
  AUTH_KV?: KVNamespaceLike;
};

export type RequestContext = {
  request: Request;
  env: EnvBindings;
};

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_BLOCK_MS = 5 * 60 * 1000;

const rateLimitByKey = new Map<string, { count: number; windowStart: number; blockedUntil: number }>();

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toBase64UrlFromString(value: string): string {
  const bytes = textEncoder.encode(value);
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function toBase64UrlFromBytes(value: Uint8Array): string {
  return bytesToBase64(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64UrlToString(value: string): string {
  const padded = `${value}${"=".repeat((4 - (value.length % 4 || 4)) % 4)}`
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const bytes = base64ToBytes(padded);
  return textDecoder.decode(bytes);
}

async function signHmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(payload));
  return toBase64UrlFromBytes(new Uint8Array(signature));
}

function getSessionSecret(env: EnvBindings): string {
  const fallback = `${env.ADMIN_EMAIL || ""}:${env.ADMIN_PASSWORD || ""}:${env.ADMIN_EDIT_EMAIL || ""}:${env.ADMIN_EDIT_PASSWORD || ""}`;
  return env.ADMIN_SESSION_SECRET || fallback || "please-set-admin-session-secret";
}

export async function createSessionToken(env: EnvBindings, email: string): Promise<string> {
  const payloadBase64 = toBase64UrlFromString(
    JSON.stringify({
      email,
      exp: Date.now() + SESSION_TTL_MS,
    })
  );

  const signature = await signHmac(getSessionSecret(env), payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export async function isValidSessionToken(env: EnvBindings, token: string): Promise<boolean> {
  const [payloadBase64, providedSignature] = token.split(".");
  if (!payloadBase64 || !providedSignature) {
    return false;
  }

  const expectedSignature = await signHmac(getSessionSecret(env), payloadBase64);
  if (expectedSignature !== providedSignature) {
    return false;
  }

  try {
    const payloadText = fromBase64UrlToString(payloadBase64);
    const payload = JSON.parse(payloadText) as { email?: unknown; exp?: unknown };

    return typeof payload.email === "string" && typeof payload.exp === "number" && Date.now() <= payload.exp;
  } catch {
    return false;
  }
}

export function json(statusCode: number, payload: JsonObject): Response {
  return new Response(JSON.stringify(payload), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const parsed = (await request.json()) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

export function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || "unknown";
}

export function checkRateLimit(route: string, ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const limitedRoutes = new Set([
    "verify-admin",
    "verify-admin-edit",
    "change-admin-password",
    "change-admin-edit-password",
  ]);

  if (!limitedRoutes.has(route)) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const now = Date.now();
  const maxAttempts = 15;
  const key = `${route}:${ip}`;
  const existing = rateLimitByKey.get(key);

  if (!existing) {
    rateLimitByKey.set(key, { count: 1, windowStart: now, blockedUntil: 0 });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((existing.blockedUntil - now) / 1000),
    };
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
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((blockedUntil - now) / 1000),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function getCredentials(env: EnvBindings, isEdit: boolean): Promise<{ email: string; password: string }> {
  const prefix = isEdit ? "ADMIN_EDIT" : "ADMIN";
  const kv = env.AUTH_KV;

  const kvEmail = kv ? await kv.get(`${prefix}_EMAIL`) : null;
  const kvPassword = kv ? await kv.get(`${prefix}_PASSWORD`) : null;

  if (kvEmail && kvPassword) {
    return {
      email: kvEmail,
      password: kvPassword,
    };
  }

  return {
    email: isEdit ? env.ADMIN_EDIT_EMAIL || env.ADMIN_EMAIL || "" : env.ADMIN_EMAIL || "",
    password: isEdit ? env.ADMIN_EDIT_PASSWORD || env.ADMIN_PASSWORD || "" : env.ADMIN_PASSWORD || "",
  };
}

export async function updateCredentials(
  env: EnvBindings,
  isEdit: boolean,
  email: string,
  password: string
): Promise<{ persisted: boolean; error?: string }> {
  const kv = env.AUTH_KV;
  if (!kv) {
    return {
      persisted: false,
      error: "Password change on Cloudflare requires AUTH_KV binding. Set credentials in env vars or configure KV.",
    };
  }

  const prefix = isEdit ? "ADMIN_EDIT" : "ADMIN";
  await kv.put(`${prefix}_EMAIL`, email);
  await kv.put(`${prefix}_PASSWORD`, password);

  return { persisted: true };
}
