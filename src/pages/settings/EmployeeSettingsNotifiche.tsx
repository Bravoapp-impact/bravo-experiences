import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { SettingsSubPageLayout } from "@/components/settings/SettingsSubPageLayout";
import { SettingsField } from "@/components/settings/SettingsField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { devLog } from "@/lib/logger";

const emailSchema = z
  .string()
  .trim()
  .max(255, "Max 255 caratteri")
  .refine((v) => v === "" || z.string().email().safeParse(v).success, {
    message: "Email non valida",
  });

function ManagerEmailForm({
  profileId,
  initialManagerEmail,
  onSaved,
}: {
  profileId: string;
  initialManagerEmail: string | null;
  onSaved: () => void;
}) {
  const { refreshProfile } = useAuth();
  const [email, setEmail] = useState(initialManagerEmail || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setEmail(initialManagerEmail || "");
  }, [initialManagerEmail]);

  const handleSave = async () => {
    setError(undefined);
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    setSaving(true);
    try {
      const value = result.data === "" ? null : result.data;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ manager_email: value })
        .eq("id", profileId);
      if (updateError) throw updateError;
      await refreshProfile();
      toast.success(value ? "Email del responsabile salvata" : "Email del responsabile rimossa");
      onSaved();
    } catch (err) {
      devLog.error("Error updating manager_email:", err);
      toast.error("Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="managerEmail">Email del responsabile</Label>
        <Input
          id="managerEmail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="mario.rossi@azienda.com"
          className={error ? "border-destructive" : ""}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">
          Se imposti l'email del tuo responsabile, riceverà un avviso qualche giorno prima di ogni tua attività di volontariato. Lascia vuoto per non attivare l'avviso.
        </p>
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvataggio…
          </>
        ) : (
          "Salva"
        )}
      </Button>
    </div>
  );
}

export default function EmployeeSettingsNotifiche() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <SettingsSubPageLayout title="Notifiche">
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </SettingsSubPageLayout>
    );
  }

  return (
    <SettingsSubPageLayout title="Notifiche">
      <SettingsField
        label="Email del responsabile"
        value={profile.manager_email || ""}
        placeholder="Non impostata"
      >
        {(close) => (
          <ManagerEmailForm
            profileId={profile.id}
            initialManagerEmail={profile.manager_email}
            onSaved={close}
          />
        )}
      </SettingsField>
    </SettingsSubPageLayout>
  );
}
