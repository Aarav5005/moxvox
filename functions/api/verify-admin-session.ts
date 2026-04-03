import { isValidSessionToken, json, readJson, readString, type RequestContext } from "./_shared";

export const onRequestPost = async (context: RequestContext): Promise<Response> => {
  const payload = await readJson(context.request);
  const authToken = readString(payload.authToken);

  if (!authToken) {
    return json(401, { success: false });
  }

  const success = await isValidSessionToken(context.env, authToken);
  return json(success ? 200 : 401, { success });
};
