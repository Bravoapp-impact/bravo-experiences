import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, Building2, Loader2, ArrowRight, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AccessRequestModal } from "@/components/auth/AccessRequestModal";
import { PasswordStrengthInput } from "@/components/auth/PasswordStrengthInput";
import { signUp, validateAccessCode } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { evaluatePassword } from "@/lib/password-policy";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    accessCode: "",
  });
  const [entityName, setEntityName] = useState<string | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accessRequestModalOpen, setAccessRequestModalOpen] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "accessCode") {
      setEntityName(null);
    }
  };

  const handleCodeBlur = async () => {
    if (formData.accessCode.length < 3) return;

    setIsValidatingCode(true);
    try {
      const codeInfo = await validateAccessCode(formData.accessCode);
      if (codeInfo) {
        setEntityName(codeInfo.entity_name);
      } else {
        setEntityName(null);
      }
    } catch {
      setEntityName(null);
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleResendConfirmation = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: formData.email,
      });
      if (error) throw error;
      toast({
        title: "Email reinviata ✉️",
        description: "Controlla la tua casella email, inclusa la cartella spam.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile reinviare l'email. Riprova tra qualche minuto.",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!evaluatePassword(formData.password).isValid) {
      toast({
        variant: "destructive",
        title: "Password non sicura",
        description: "La password deve rispettare tutti i requisiti minimi indicati.",
      });
      return;
    }

    setIsLoading(true);

    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        accessCode: formData.accessCode,
      });

      setRegistrationComplete(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore di registrazione",
        description: error.message || "Si è verificato un errore. Riprova.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationComplete) {
    return (
      <AuthLayout
        title="Controlla la tua email"
        subtitle="Un ultimo passo per completare la registrazione"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-3">
            <p className="text-foreground">
              Abbiamo inviato un link di attivazione a{" "}
              <strong>{formData.email}</strong>.
            </p>
            <p className="text-foreground">
              Clicca il link nell'email per completare la registrazione e accedere alla piattaforma.
            </p>
          </div>

          <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Non trovi l'email?</p>
            <ul className="list-disc list-inside text-left space-y-1">
              <li>Controlla la cartella <strong>spam</strong> o <strong>posta indesiderata</strong></li>
              <li>Assicurati di aver inserito l'email corretta</li>
              <li>L'email potrebbe impiegare qualche minuto ad arrivare</li>
            </ul>
          </div>

          <Button
            onClick={handleResendConfirmation}
            variant="outline"
            className="w-full"
            disabled={isResending}
          >
            {isResending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Reinvia email di conferma
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Link to="/login">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Torna al login
            </Button>
          </Link>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Crea il tuo account"
      subtitle="Inserisci i tuoi dati per creare un account"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-4"
        >
          {/* Access Code - First! */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="accessCode">Codice di Accesso</Label>
              <button
                type="button"
                onClick={() => setAccessRequestModalOpen(true)}
                className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
              >
                Non hai il codice di accesso?
              </button>
            </div>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="accessCode"
                name="accessCode"
                type="text"
                placeholder="Inserisci il codice di accesso"
                value={formData.accessCode}
                onChange={handleChange}
                onBlur={handleCodeBlur}
                className="pl-10"
                required
              />
              {isValidatingCode && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {entityName && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-sm text-secondary-foreground flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg"
              >
                <span className="text-lg">✓</span>
                {entityName}
              </motion.p>
            )}
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Mario"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Cognome</Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Rossi"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="esempio@dominio.it"
                value={formData.email}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Password */}
          <PasswordStrengthInput
            id="password"
            label="Password"
            value={formData.password}
            onChange={(val) => setFormData((prev) => ({ ...prev, password: val }))}
            placeholder="Crea una password sicura"
            autoComplete="new-password"
            required
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={isLoading || !entityName}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Registrati
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </motion.div>
      </form>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-8 text-center text-sm text-muted-foreground"
      >
        Hai già un account?{" "}
        <Link
          to="/login"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Accedi
        </Link>
      </motion.p>

      <AccessRequestModal
        open={accessRequestModalOpen}
        onClose={() => setAccessRequestModalOpen(false)}
      />
    </AuthLayout>
  );
}
