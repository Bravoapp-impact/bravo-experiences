import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Clock, Settings, ChevronRight } from "lucide-react";
import { AppBootSkeleton } from "@/components/common/skeletons/AppBootSkeleton";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileAvatarUpload } from "@/components/profile/ProfileAvatarUpload";
import { useAuth } from "@/hooks/useAuth";
import { useHourBudget } from "@/hooks/useHourBudget";

export default function Profile() {
  const { profile, loading, signOut, refreshProfile } = useAuth();
  const { budgetHours, usedHours, isUnlimited, loading: budgetLoading } = useHourBudget();
  const navigate = useNavigate();

  // Redirect admin users to their specific profile pages
  useEffect(() => {
    if (!loading && profile) {
      const roleRoutes: Record<string, string> = {
        super_admin: "/super-admin/impostazioni/profilo",
        hr_admin: "/hr/impostazioni/profilo",
        association_admin: "/association/impostazioni/profilo",
      };

      if (profile.role && roleRoutes[profile.role]) {
        navigate(roleRoutes[profile.role], { replace: true });
      }
    }
  }, [profile, loading, navigate]);

  if (loading || (profile?.role && profile.role !== "employee")) {
    return <AppBootSkeleton role="employee" />;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6 pb-20 md:pb-8">
        {/* Header */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-bold text-foreground"
          >
            Profilo
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-1"
          >
            Gestisci le tue informazioni personali
          </motion.p>
        </div>

        {/* Avatar & Name Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {profile?.id && (
                  <ProfileAvatarUpload
                    userId={profile.id}
                    avatarUrl={profile.avatar_url}
                    firstName={profile.first_name}
                    lastName={profile.last_name}
                    onUploadComplete={refreshProfile}
                  />
                )}
                <div className="flex-1">
                  <p className="text-base font-semibold text-foreground">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-[13px] text-muted-foreground">{profile?.email}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Clicca sull'immagine per cambiarla (max 2MB, PNG o JPG)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hour Budget Widget */}
        {(budgetLoading || !isUnlimited) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.17 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 flex-shrink-0">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {budgetLoading ? (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Ore utilizzate</span>
                          <span className="text-xs font-medium text-foreground">{usedHours} / {budgetHours}</span>
                        </div>
                        <Progress value={budgetHours > 0 ? (usedHours / budgetHours) * 100 : 0} className="h-2" />
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Settings link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          <Link to="/app/impostazioni" className="block">
            <Card className="hover:bg-muted/30 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted shrink-0">
                  <Settings className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Impostazioni</p>
                  <p className="text-xs text-muted-foreground">Profilo, sicurezza, notifiche</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Esci dall'account
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
