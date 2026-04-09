import { checkRateLimit, getClientIp, json, readJson, readString, type RequestContext } from "./_shared";

const EDIT_ACTION_PASSWORD = "moxvox@2026";

export const onRequestPost = async (context: RequestContext): Promise<Response> => {
  const ip = getClientIp(context.request);
  const rate = checkRateLimit("verify-admin-edit", ip);
  if (!rate.allowed) {
    return new Response(
      JSON.stringify({ success: false, error: "Too many attempts. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rate.retryAfterSeconds),
        },
      }
    );
  }

  const payload = await readJson(context.request);
  const password = readString(payload.password);
  const success = password === EDIT_ACTION_PASSWORD;

  return json(success ? 200 : 401, { success });
};
