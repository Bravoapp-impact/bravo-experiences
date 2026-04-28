import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordStrengthInput } from "@/components/auth/PasswordStrengthInput";
import { updatePassword } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { evaluatePassword } from "@/lib/password-policy";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsValidSession(!!session);
    };
    
    checkSession();

    // Listen for auth state changes (recovery link clicked)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsValidSession(true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Le password non coincidono.",
      });
      return;
    }

    if (!evaluatePassword(password).isValid) {
      toast({
        variant: "destructive",
        title: "Password non sicura",
        description: "La password deve rispettare tutti i requisiti minimi indicati.",
      });
      return;
    }

    setIsLoading(true);

    try {
      await updatePassword(password);
      setIsSuccess(true);
      toast({
        title: "Password aggiornata",
        description: "La tua password è stata reimpostata con successo.",
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Si è verificato un errore. Riprova.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <AuthLayout title="Verifica in corso..." subtitle="">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthLayout>
    );
  }

  // Invalid or expired link
  if (!isValidSession) {
    return (
      <AuthLayout
        title="Link non valido"
        subtitle="Il link di reset password è scaduto o non valido"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <p className="text-muted-foreground">
            Il link che hai utilizzato potrebbe essere scaduto. Richiedi un nuovo link per reimpostare la password.
          </p>
          
          <Button onClick={() => navigate("/forgot-password")} className="w-full">
            Richiedi nuovo link
          </Button>
        </motion.div>
      </AuthLayout>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <AuthLayout
        title="Password reimpostata!"
        subtitle="Ora puoi accedere con la tua nuova password"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          
          <p className="text-muted-foreground">
            Verrai reindirizzato alla pagina di login tra pochi secondi...
          </p>
          
          <Button onClick={() => navigate("/login")} variant="outline" className="w-full">
            Vai al login
          </Button>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Nuova password"
      subtitle="Inserisci la tua nuova password"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-4"
        >
          <PasswordStrengthInput
            id="password"
            label="Nuova password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required
          />

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Conferma password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="text-xs text-destructive">Le password non coincidono.</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Reimposta password"
            )}
          </Button>
        </motion.div>
      </form>
    </AuthLayout>
  );
}
