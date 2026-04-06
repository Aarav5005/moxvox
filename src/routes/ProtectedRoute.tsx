import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "@/services/authService";

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      try {
        const { data: { user }, error } = await getCurrentUser();
        
        if (!cancelled) {
          setIsAuthenticated(!!user && !error);
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
