import { useState, useEffect } from "react";
import { Save, Loader2, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { devLog } from "@/lib/logger";
import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .max(255, "Max 255 caratteri")
  .refine((v) => v === "" || z.string().email().safeParse(v).success, {
    message: "Email non valida",
  });

interface ManagerEmailCardProps {
  profileId: string;
  initialManagerEmail: string | null;
  onSave: () => Promise<void> | void;
}

export function ManagerEmailCard({
  profileId,
  initialManagerEmail,
  onSave,
}: ManagerEmailCardProps) {
  const [email, setEmail] = useState(initialManagerEmail || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setEmail(initialManagerEmail || "");
  }, [initialManagerEmail]);

  const hasChanges = email.trim() !== (initialManagerEmail || "");

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

      await onSave();
      toast.success(
        value
          ? "Email del responsabile salvata"
          : "Email del responsabile rimossa"
      );
    } catch (err) {
      devLog.error("Error updating manager_email:", err);
      toast.error("Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          Notifiche al responsabile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="managerEmail">Email del responsabile (facoltativa)</Label>
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
            Se imposti l'email del tuo responsabile, riceverà un avviso qualche
            giorno prima di ogni tua attività di volontariato. Lascia vuoto per
            non attivare l'avviso.
          </p>
        </div>

        {hasChanges && (
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salva
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
