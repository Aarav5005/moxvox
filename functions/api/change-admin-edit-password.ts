import {
  checkRateLimit,
  getClientIp,
  getCredentials,
  json,
  readJson,
  readString,
  updateCredentials,
  type RequestContext,
} from "./_shared";

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

  const payload = await readJson(context.request);
  const email = readString(payload.email);
  const oldPassword = readString(payload.old_password ?? payload.oldPassword);
  const newPassword = readString(payload.new_password ?? payload.newPassword);

  if (!email || !oldPassword || !newPassword) {
    return json(400, { success: false, error: "Email, old password and new password are required." });
  }

  if (newPassword.length < 4) {
    return json(400, { success: false, error: "New password must be at least 4 characters." });
  }

  const expected = await getCredentials(context.env, true);
  if (email !== expected.email || oldPassword !== expected.password) {
    return json(401, { success: false, error: "Old password is incorrect." });
  }

  const persisted = await updateCredentials(context.env, true, email, newPassword);
  if (!persisted.persisted) {
    return json(400, { success: false, error: persisted.error || "Unable to persist credentials." });
  }

  return json(200, { success: true, message: "Password changed successfully." });
};
