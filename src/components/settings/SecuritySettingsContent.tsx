import { useAuth } from "@/hooks/useAuth";
import SettingsPage from "@/components/common/SettingsPage";
import SettingsFormRow from "@/components/common/SettingsFormRow";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordCard";
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
      className="max-w-3xl"
    >
      <div className="divide-y divide-border">
        {profile?.email && (
          <SettingsFormRow
            title="Cambia password"
            description="Per la tua sicurezza, ti chiediamo prima la password attuale."
          >
            <ChangePasswordForm email={profile.email} />
          </SettingsFormRow>
        )}
        <SettingsFormRow
          title="Autenticazione a due fattori"
          description="Proteggi il tuo account con un secondo fattore di accesso (2FA)."
        >
          <EnrollMFA />
        </SettingsFormRow>
      </div>
    </SettingsPage>
  );
}

