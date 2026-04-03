import { json, type EnvBindings, type RequestContext } from "../functions/api/_shared";
import { onRequestPost as verifyAdmin } from "../functions/api/verify-admin";
import { onRequestPost as changeAdminPassword } from "../functions/api/change-admin-password";
import { onRequestPost as verifyAdminEdit } from "../functions/api/verify-admin-edit";
import { onRequestPost as changeAdminEditPassword } from "../functions/api/change-admin-edit-password";
import { onRequestPost as verifyAdminSession } from "../functions/api/verify-admin-session";
import { onRequestPost as logoutAdmin } from "../functions/api/logout-admin";
import { onRequestPost as sendWhatsApp } from "../functions/api/send-whatsapp";

type StaticAssetsBinding = {
  fetch: (request: Request) => Promise<Response>;
};

type WorkerEnv = EnvBindings & {
  STATIC_ASSETS: StaticAssetsBinding;
};

const apiHandlers: Record<string, (context: RequestContext) => Promise<Response>> = {
  "/api/verify-admin": verifyAdmin,
  "/api/change-admin-password": changeAdminPassword,
  "/api/verify-admin-edit": verifyAdminEdit,
  "/api/change-admin-edit-password": changeAdminEditPassword,
  "/api/verify-admin-session": verifyAdminSession,
  "/api/logout-admin": logoutAdmin,
  "/api/send-whatsapp": sendWhatsApp,
};

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith("/api/")) {
      if (request.method !== "POST") {
        return json(405, { success: false, error: "Method not allowed" });
      }

      const handler = apiHandlers[pathname];
      if (!handler) {
        return json(404, { success: false, error: "Route not found" });
      }

      return handler({ request, env });
    }

    return env.STATIC_ASSETS.fetch(request);
  },
};
