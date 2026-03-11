import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Building2, Mail, Loader2, Clock } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileAvatarUpload } from "@/components/profile/ProfileAvatarUpload";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { EnrollMFA } from "@/components/auth/EnrollMFA";
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
        super_admin: "/super-admin/profile",
        hr_admin: "/hr/profile",
        association_admin: "/association/my-profile",
      };

      if (profile.role && roleRoutes[profile.role]) {
        navigate(roleRoutes[profile.role], { replace: true });
      }
    }
  }, [profile, loading, navigate]);

  // Show loading while checking role or redirecting
  if (loading || (profile?.role && profile.role !== "employee")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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

        {/* Edit Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {profile?.id && (
            <ProfileEditForm
              profileId={profile.id}
              initialFirstName={profile.first_name}
              initialLastName={profile.last_name}
              onSave={refreshProfile}
            />
          )}
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informazioni account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-[13px] font-medium text-foreground">Email</p>
                  <p className="text-[13px] text-muted-foreground">{profile?.email}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-[13px] font-medium text-foreground">Azienda</p>
                  <p className="text-[13px] text-muted-foreground">
                    {profile?.companies?.name || "Non associata"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* MFA Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <EnrollMFA />
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
