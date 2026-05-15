import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppBootSkeleton } from "@/components/common/skeletons/AppBootSkeleton";

interface ProtectedSuperAdminRouteProps {
  children: React.ReactNode;
}

export function ProtectedSuperAdminRoute({ children }: ProtectedSuperAdminRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AppBootSkeleton role="admin" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile?.role !== "super_admin") {
    // Redirect based on role
    if (profile?.role === "hr_admin") {
      return <Navigate to="/hr" replace />;
    }
    if (profile?.role === "association_admin") {
      return <Navigate to="/association" replace />;
    }
    return <Navigate to="/app/experiences" replace />;
  }

  return <>{children}</>;
}
