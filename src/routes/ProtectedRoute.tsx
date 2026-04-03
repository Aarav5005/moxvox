import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      const authToken = sessionStorage.getItem("adminAuthToken") || "";

      if (!authToken) {
        if (!cancelled) {
          setIsAuthenticated(false);
          setIsChecking(false);
        }
        return;
      }

      try {
        const response = await fetch("/api/verify-admin-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ authToken }),
        });

        const result = (await response.json()) as { success?: boolean };
        const success = response.ok && !!result?.success;

        if (!cancelled) {
          setIsAuthenticated(success);
          setIsChecking(false);
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
          setIsChecking(false);
        }
      }
    };

    void verifySession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isChecking) {
    return null;
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <Navigate to="/admin/login" replace />;
}
