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
import GenderSelector, { GenderValue, genderDisplay } from "@/components/common/GenderSelector";

const nameSchema = z.object({
  firstName: z.string().trim().min(1, "Il nome è obbligatorio").max(50, "Max 50 caratteri"),
  lastName: z.string().trim().min(1, "Il cognome è obbligatorio").max(50, "Max 50 caratteri"),
});

function NameForm({
  profileId,
  initialFirstName,
  initialLastName,
  onSaved,
}: {
  profileId: string;
  initialFirstName: string | null;
  initialLastName: string | null;
  onSaved: () => void;
}) {
  const { refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState(initialFirstName || "");
  const [lastName, setLastName] = useState(initialLastName || "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});

  useEffect(() => {
    setFirstName(initialFirstName || "");
    setLastName(initialLastName || "");
  }, [initialFirstName, initialLastName]);

  const handleSave = async () => {
    setErrors({});
    const result = nameSchema.safeParse({ firstName, lastName });
    if (!result.success) {
      const fe: { firstName?: string; lastName?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "firstName") fe.firstName = err.message;
        if (err.path[0] === "lastName") fe.lastName = err.message;
      });
      setErrors(fe);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: result.data.firstName,
          last_name: result.data.lastName,
        })
        .eq("id", profileId);
      if (error) throw error;
      await refreshProfile();
      toast.success("Profilo aggiornato");
      onSaved();
    } catch (err) {
      devLog.error("Error updating profile:", err);
      toast.error("Errore durante l'aggiornamento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="firstName">Nome</Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className={errors.firstName ? "border-destructive" : ""}
        />
        {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">Cognome</Label>
        <Input
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className={errors.lastName ? "border-destructive" : ""}
        />
        {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
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

function GenderForm({
  profileId,
  initialGender,
  onSaved,
}: {
  profileId: string;
  initialGender: GenderValue;
  onSaved: () => void;
}) {
  const { refreshProfile } = useAuth();
  const [gender, setGender] = useState<GenderValue>(initialGender);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setGender(initialGender);
  }, [initialGender]);

  const handleSave = async () => {
    if (!gender) {
      toast.error("Seleziona un'opzione");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ gender })
        .eq("id", profileId);
      if (error) throw error;
      await refreshProfile();
      toast.success("Preferenza aggiornata");
      onSaved();
    } catch (err) {
      devLog.error("Error updating gender:", err);
      toast.error("Errore durante l'aggiornamento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <GenderSelector value={gender} onChange={setGender} hideLabel />
      <Button onClick={handleSave} disabled={saving || !gender} className="w-full">
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

export default function EmployeeSettingsPersonali() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <SettingsSubPageLayout title="Informazioni personali">
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </SettingsSubPageLayout>
    );
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");

  return (
    <SettingsSubPageLayout title="Informazioni personali">
      <SettingsField label="Nome e cognome" value={fullName}>
        {(close) => (
          <NameForm
            profileId={profile.id}
            initialFirstName={profile.first_name}
            initialLastName={profile.last_name}
            onSaved={close}
          />
        )}
      </SettingsField>
      <SettingsField
        label="Preferenza di accoglienza"
        value={genderDisplay((profile as any).gender)}
        placeholder="Non impostato"
      >
        {(close) => (
          <GenderForm
            profileId={profile.id}
            initialGender={((profile as any).gender ?? "") as GenderValue}
            onSaved={close}
          />
        )}
      </SettingsField>
      <SettingsField label="Email" value={profile.email} editable={false} />
      <SettingsField
        label="Azienda"
        value={profile.companies?.name || ""}
        placeholder="Non associata"
        editable={false}
      />
    </SettingsSubPageLayout>
  );
}
