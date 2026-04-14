import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { devLog } from "@/lib/logger";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Il nome è obbligatorio").max(50, "Max 50 caratteri"),
  lastName: z.string().trim().min(1, "Il cognome è obbligatorio").max(50, "Max 50 caratteri"),
});

interface ProfileEditFormProps {
  profileId: string;
  initialFirstName: string | null;
  initialLastName: string | null;
  onSave: () => void;
  cardClassName?: string;
}

export function ProfileEditForm({
  profileId,
  initialFirstName,
  initialLastName,
  onSave,
  cardClassName = "",
}: ProfileEditFormProps) {
  const [firstName, setFirstName] = useState(initialFirstName || "");
  const [lastName, setLastName] = useState(initialLastName || "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});

  // Sync with prop changes (e.g., after profile refresh)
  useEffect(() => {
    setFirstName(initialFirstName || "");
    setLastName(initialLastName || "");
  }, [initialFirstName, initialLastName]);

  const hasChanges =
    firstName !== (initialFirstName || "") ||
    lastName !== (initialLastName || "");

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
        .update({
          first_name: result.data.firstName,
          last_name: result.data.lastName,
        })
        .eq("id", profileId);

      if (error) throw error;

      await onSave();
      toast.success("Profilo aggiornato con successo!");
    } catch (error) {
      devLog.error("Error updating profile:", error);
      toast.error("Errore durante l'aggiornamento del profilo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={cardClassName}>
      <CardHeader>
        <CardTitle className="text-lg">Modifica dati</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nome</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Il tuo nome"
            className={errors.firstName ? "border-destructive" : ""}
          />
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Cognome</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Il tuo cognome"
            className={errors.lastName ? "border-destructive" : ""}
          />
          {errors.lastName && (
            <p className="text-xs text-destructive">{errors.lastName}</p>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salva modifiche
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
