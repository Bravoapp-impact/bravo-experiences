import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Mail, Heart } from "lucide-react";
import { AssociationLayout } from "@/components/layout/AssociationLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProfileAvatarUpload } from "@/components/profile/ProfileAvatarUpload";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { EnrollMFA } from "@/components/auth/EnrollMFA";
import { ChangePasswordCard } from "@/components/profile/ChangePasswordCard";
import { PageHeader } from "@/components/common/PageHeader";
import { useAuth } from "@/hooks/useAuth";

export default function AssociationAdminProfile() {
  const { profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <AssociationLayout>
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
          <Card className="border bg-card">
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
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  <p className="text-xs text-primary mt-1">Referente Associazione</p>
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
              cardClassName="border bg-card"
            />
          )}
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Informazioni account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Associazione</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.associations?.name || "Non associata"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Change Password */}
        {profile?.email && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
          >
            <ChangePasswordCard email={profile.email} />
          </motion.div>
        )}

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
    </AssociationLayout>
  );
}
