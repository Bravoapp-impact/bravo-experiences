import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SettingsSubPageLayout } from "@/components/settings/SettingsSubPageLayout";
import { SettingsField } from "@/components/settings/SettingsField";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordCard";
import { EnrollMFA } from "@/components/auth/EnrollMFA";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function EmployeeSettingsSicurezza() {
  const { profile } = useAuth();
  const [mfaState, setMfaState] = useState<"loading" | "on" | "off">("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await supabase.auth.mfa.listFactors();
        if (!active) return;
        const verified = (data?.totp ?? []).filter((f) => f.status === "verified");
        setMfaState(verified.length > 0 ? "on" : "off");
      } catch {
        if (active) setMfaState("off");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const mfaValue =
    mfaState === "loading" ? "Caricamento…" : mfaState === "on" ? "Attiva" : "Non attiva";

  if (!profile) {
    return (
      <SettingsSubPageLayout title="Accesso e sicurezza">
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </SettingsSubPageLayout>
    );
  }

  return (
    <SettingsSubPageLayout title="Accesso e sicurezza">
      <SettingsField label="Password" value="••••••••">
        {() => profile.email ? <ChangePasswordForm email={profile.email} /> : null}
      </SettingsField>
      <SettingsField label="Autenticazione a due fattori" value={mfaValue}>
        {() => <EnrollMFA />}
      </SettingsField>
    </SettingsSubPageLayout>
  );
}
