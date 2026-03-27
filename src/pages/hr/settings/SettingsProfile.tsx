import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ProfileAvatarUpload } from "@/components/profile/ProfileAvatarUpload";
import { toast } from "sonner";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Il nome è obbligatorio").max(50, "Max 50 caratteri"),
  lastName: z.string().trim().min(1, "Il cognome è obbligatorio").max(50, "Max 50 caratteri"),
});

export default function SettingsProfile() {
  const { profile, user, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});

  const hasChanges =
    firstName !== (profile?.first_name || "") ||
    lastName !== (profile?.last_name || "");

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

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <h2 className="text-lg font-semibold text-foreground">Profilo personale</h2>
      <p className="text-sm text-muted-foreground mb-6">Gestisci le tue informazioni personali</p>

      <div className="flex items-start gap-4 mb-6">
        {user && (
          <ProfileAvatarUpload
            userId={user.id}
            avatarUrl={profile?.avatar_url}
            firstName={profile?.first_name}
            lastName={profile?.last_name}
            onUploadComplete={refreshProfile}
            size="lg"
          />
        )}
      </div>

      <div className="space-y-3 max-w-sm">
        <div>
          <Label className="text-xs text-muted-foreground">Nome</Label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={errors.firstName ? "mt-1 border-destructive" : "mt-1"}
          />
          {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Cognome</Label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={errors.lastName ? "mt-1 border-destructive" : "mt-1"}
          />
          {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName}</p>}
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Email</Label>
          <Input value={profile?.email || ""} readOnly className="mt-1 bg-muted/30" />
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Salvataggio...</> : <><Save className="mr-2 h-3.5 w-3.5" />Salva modifiche</>}
          </Button>
        )}
      </div>

      <Separator className="my-6" />

      <h3 className="text-sm font-semibold text-foreground mb-1">Sicurezza</h3>
      <div className="max-w-sm">
        <Label className="text-xs text-muted-foreground">Password</Label>
        <div className="flex items-center gap-2 mt-1">
          <Input type="password" value="••••••••" readOnly className="bg-muted/30 flex-1" />
          <Button variant="outline" size="sm" disabled>Cambia password</Button>
        </div>
      </div>
    </motion.div>
  );
}
