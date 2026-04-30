import { useAuth } from "@/hooks/useAuth";
import SettingsPage from "@/components/common/SettingsPage";
import { ChangePasswordCard } from "@/components/profile/ChangePasswordCard";
import { EnrollMFA } from "@/components/auth/EnrollMFA";

/**
 * Role-agnostic security settings: password change + MFA enrollment.
 */
export default function SecuritySettingsContent() {
  const { profile } = useAuth();

  return (
    <SettingsPage
      title="Sicurezza"
      description="Gestisci la password e l'autenticazione a due fattori"
    >
      <div className="space-y-6">
        {profile?.email && (
          <ChangePasswordCard email={profile.email} />
        )}
        <EnrollMFA />
      </div>
    </SettingsPage>
  );
}
