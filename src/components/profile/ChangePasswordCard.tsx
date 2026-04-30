import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { evaluatePassword } from "@/lib/password-policy";
import { PasswordStrengthInput } from "@/components/auth/PasswordStrengthInput";

interface ChangePasswordFormProps {
  email: string;
}

export function ChangePasswordForm({ email }: ChangePasswordFormProps) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const evaluation = evaluatePassword(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit =
    currentPassword.length > 0 && evaluation.isValid && passwordsMatch && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (newPassword === currentPassword) {
      toast({
        variant: "destructive",
        title: "Password identica",
        description: "La nuova password deve essere diversa da quella attuale.",
      });
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        toast({
          variant: "destructive",
          title: "Password attuale errata",
          description: "Verifica la tua password attuale e riprova.",
        });
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast({
          variant: "destructive",
          title: "Errore",
          description: updateError.message || "Impossibile aggiornare la password.",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Password aggiornata",
        description: "La tua password è stata cambiata con successo.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore inatteso. Riprova.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">Cambia password</h3>
        <p className="text-sm text-muted-foreground">
          Per la tua sicurezza, ti chiediamo prima la password attuale.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="current-password" className="text-xs text-muted-foreground">
            Password attuale
          </Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <PasswordStrengthInput
          id="new-password"
          label="Nuova password"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          required
        />

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password" className="text-xs text-muted-foreground">
            Conferma nuova password
          </Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-xs text-destructive">Le password non coincidono.</p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={!canSubmit} size="sm">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Aggiornamento…
              </>
            ) : (
              <>
                <Save className="mr-2 h-3.5 w-3.5" />
                Aggiorna password
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}

// Backward-compat alias — old import sites keep working.
export const ChangePasswordCard = ChangePasswordForm;
