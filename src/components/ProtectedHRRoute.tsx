import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppBootSkeleton } from "@/components/common/skeletons/AppBootSkeleton";

interface ProtectedHRRouteProps {
  children: React.ReactNode;
}

export function ProtectedHRRoute({ children }: ProtectedHRRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AppBootSkeleton role="admin" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile?.role !== "hr_admin") {
    // Redirect based on role
    if (profile?.role === "super_admin") {
      return <Navigate to="/super-admin" replace />;
    }
    if (profile?.role === "association_admin") {
      return <Navigate to="/association" replace />;
    }
    return <Navigate to="/app/experiences" replace />;
  }

  return <>{children}</>;
}
