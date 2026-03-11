import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Mail, Building2 } from "lucide-react";
import { HRLayout } from "@/components/layout/HRLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProfileAvatarUpload } from "@/components/profile/ProfileAvatarUpload";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { EnrollMFA } from "@/components/auth/EnrollMFA";
import { PageHeader } from "@/components/common/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useHourBudget } from "@/hooks/useHourBudget";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";

export default function HRProfile() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { budgetHours, usedHours, isUnlimited, loading: budgetLoading } = useHourBudget();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <HRLayout>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          title="Il mio profilo"
          description="Gestisci le tue informazioni personali"
        />

        {/* Avatar & Name Preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
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
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-[13px] text-muted-foreground">{profile?.email}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">HR Admin</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Clicca sull'immagine per cambiarla (max 2MB, PNG o JPG)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {profile?.id && (
            <ProfileEditForm
              profileId={profile.id}
              initialFirstName={profile.first_name}
              initialLastName={profile.last_name}
              onSave={refreshProfile}
              cardClassName="border-border/50 bg-card/80 backdrop-blur-sm"
            />
          )}
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
            <CardTitle className="text-base font-semibold">Informazioni account</CardTitle>
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <EnrollMFA />
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
    </HRLayout>
  );
}
