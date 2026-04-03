import { checkRateLimit, createSessionToken, getClientIp, getCredentials, json, readJson, readString, type RequestContext } from "./_shared";

export const onRequestPost = async (context: RequestContext): Promise<Response> => {
  const ip = getClientIp(context.request);
  const rate = checkRateLimit("verify-admin", ip);
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
  const email = readString(payload.email);
  const password = readString(payload.password);

  const expected = await getCredentials(context.env, false);
  const success = !!expected.email && !!expected.password && email === expected.email && password === expected.password;

  if (!success) {
    return json(401, { success: false });
  }

  const authToken = await createSessionToken(context.env, email);
  return json(200, { success: true, authToken });
};
