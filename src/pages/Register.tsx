import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, User, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordStrengthInput } from "@/components/auth/PasswordStrengthInput";
import { signUp } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { evaluatePassword } from "@/lib/password-policy";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "" as "" | "m" | "f" | "x",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    if (!formData.gender) {
      toast({
        variant: "destructive",
        title: "Manca una scelta",
        description: "Seleziona come vuoi che ti accogliamo nell'app.",
      });
      return;
    }

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
        gender: formData.gender as "m" | "f" | "x",
      });

      setRegistrationComplete(true);
    } catch (error: any) {
      const rawMessage: string = error?.message || "";
      // Server-side trigger (handle_new_user) rejects unknown email domains.
      const isDomainRejection =
        /domain/i.test(rawMessage) ||
        /dominio/i.test(rawMessage) ||
        /not allowed/i.test(rawMessage) ||
        /non.*ammess/i.test(rawMessage) ||
        /Database error saving new user/i.test(rawMessage);

      toast({
        variant: "destructive",
        title: "Errore di registrazione",
        description: isDomainRejection
          ? "Questa email non è ammessa alla registrazione. Contatta il team di Bravo! per maggiori informazioni — team@bravoapp.it"
          : rawMessage || "Si è verificato un errore. Riprova.",
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

          {/* Accoglienza (genere) */}
          <div className="space-y-2">
            <Label>Come vuoi che ti accogliamo nell'app?</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "m", label: "Bravo!" },
                { value: "f", label: "Brava!" },
                { value: "x", label: "Bravə!" },
              ] as const).map((opt) => {
                const selected = formData.gender === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, gender: opt.value }))}
                    aria-pressed={selected}
                    className={`flex flex-col items-center justify-center rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
                      selected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-input bg-background text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                );
              })}
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
            disabled={isLoading}
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
    </AuthLayout>
  );
}
