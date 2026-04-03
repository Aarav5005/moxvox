import { json, type RequestContext } from "./_shared";

export const onRequestPost = async (_context: RequestContext): Promise<Response> => {
  // Stateless signed token: logout is client-side token removal.
  return json(200, { success: true });
};
