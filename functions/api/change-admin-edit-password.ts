import { checkRateLimit, getClientIp, json, type RequestContext } from "./_shared";

export const onRequestPost = async (context: RequestContext): Promise<Response> => {
  const ip = getClientIp(context.request);
  const rate = checkRateLimit("change-admin-edit-password", ip);
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

  return json(410, {
    success: false,
    error: "Edit/delete password is fixed and cannot be changed from API.",
  });
};
