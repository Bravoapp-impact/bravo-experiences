import { useState } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { evaluatePassword } from "@/lib/password-policy";
import { PasswordStrengthInput } from "@/components/auth/PasswordStrengthInput";

interface ChangePasswordCardProps {
  email: string;
  cardClassName?: string;
}

export function ChangePasswordCard({ email, cardClassName = "border bg-card" }: ChangePasswordCardProps) {
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
      // Re-authenticate to verify current password
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
    } catch (err) {
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
    <Card className={cardClassName}>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          Cambia password
        </CardTitle>
        <CardDescription>
          Aggiorna la password del tuo account. Per la tua sicurezza, ti chiediamo prima la password attuale.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Password attuale</Label>
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

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Conferma nuova password</Label>
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

          <Button type="submit" disabled={!canSubmit} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aggiornamento…
              </>
            ) : (
              "Aggiorna password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
