import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import SettingsPage from "@/components/common/SettingsPage";
import SettingsSection from "@/components/common/SettingsSection";
import AvatarUploadBlock from "@/components/common/AvatarUploadBlock";
import { ChangePasswordCard } from "@/components/profile/ChangePasswordCard";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Il nome è obbligatorio").max(50, "Max 50 caratteri"),
  lastName: z.string().trim().min(1, "Il cognome è obbligatorio").max(50, "Max 50 caratteri"),
});

export default function SettingsProfile() {
  const { profile, user, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});

  const hasChanges =
    firstName !== (profile?.first_name || "") ||
    lastName !== (profile?.last_name || "");

  const getInitials = () => {
    const first = profile?.first_name?.[0] || "";
    const last = profile?.last_name?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  const handleSave = async () => {
    setErrors({});
    const result = profileSchema.safeParse({ firstName, lastName });
    if (!result.success) {
      const fieldErrors: { firstName?: string; lastName?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "firstName") fieldErrors.firstName = err.message;
        if (err.path[0] === "lastName") fieldErrors.lastName = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ first_name: result.data.firstName, last_name: result.data.lastName })
        .eq("id", profile!.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Profilo aggiornato con successo!");
    } catch {
      toast.error("Errore durante l'aggiornamento del profilo");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;

    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      toast.error("Formato non supportato. Usa PNG o JPG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Immagine troppo grande. Massimo 2MB.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const filePath = `${user.id}/avatar.${fileExt}`;

      await supabase.storage.from("profile-avatars").remove([
        `${user.id}/avatar.png`, `${user.id}/avatar.jpg`, `${user.id}/avatar.jpeg`,
      ]);

      const { error: uploadError } = await supabase.storage
        .from("profile-avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("profile-avatars").getPublicUrl(filePath);
      const avatarUrlWithCache = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrlWithCache })
        .eq("id", user.id);
      if (updateError) throw updateError;

      await refreshProfile();
      toast.success("Immagine profilo aggiornata!");
    } catch {
      toast.error("Errore durante il caricamento dell'immagine");
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!user) return;
    setUploading(true);
    try {
      await supabase.storage.from("profile-avatars").remove([
        `${user.id}/avatar.png`, `${user.id}/avatar.jpg`, `${user.id}/avatar.jpeg`,
      ]);
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Immagine profilo rimossa!");
    } catch {
      toast.error("Errore durante la rimozione dell'immagine");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SettingsPage title="Profilo personale" description="Gestisci le tue informazioni personali">
      <AvatarUploadBlock
        imageUrl={profile?.avatar_url}
        fallbackInitials={getInitials()}
        title="Foto profilo"
        onUpload={handleAvatarUpload}
        onRemove={handleAvatarRemove}
        uploading={uploading}
      />

      <SettingsSection title="Dati personali">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={errors.firstName ? "border-destructive" : ""}
              />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Cognome</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={errors.lastName ? "border-destructive" : ""}
              />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input value={profile?.email || ""} readOnly className="bg-muted/30" />
          </div>

          {hasChanges && (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Salvataggio...</> : <><Save className="mr-2 h-3.5 w-3.5" />Salva modifiche</>}
              </Button>
            </div>
          )}
        </div>
      </SettingsSection>

      <SettingsSection title="Sicurezza" separator={false}>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Password</Label>
          <div className="flex items-center gap-2">
            <Input type="password" value="••••••••" readOnly className="bg-muted/30 flex-1" />
            <Button variant="outline" size="sm" disabled>Cambia password</Button>
          </div>
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
