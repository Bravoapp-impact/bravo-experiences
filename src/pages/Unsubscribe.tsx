import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle, MailX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type Status =
  | "validating"
  | "valid"
  | "invalid"
  | "already_unsubscribed"
  | "submitting"
  | "success"
  | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("validating");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setErrorMessage("Link non valido: token mancante.");
      return;
    }

    const validate = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } },
        );
        const data = await res.json();
        if (!res.ok) {
          setStatus("invalid");
          setErrorMessage(data?.error || "Token non valido o scaduto.");
          return;
        }
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already_unsubscribed");
          return;
        }
        if (data.valid === true) {
          setStatus("valid");
          return;
        }
        setStatus("invalid");
      } catch {
        setStatus("invalid");
        setErrorMessage("Impossibile verificare il link.");
      }
    };

    validate();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setStatus("submitting");
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ token }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data?.error || "Operazione non riuscita.");
        return;
      }
      if (data.success === false && data.reason === "already_unsubscribed") {
        setStatus("already_unsubscribed");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Errore di rete. Riprova più tardi.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailX className="h-5 w-5 text-primary" />
            Disiscrizione
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "validating" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sto verificando il link...
            </div>
          )}

          {status === "valid" && (
            <>
              <p className="text-sm text-foreground">
                Confermi di voler interrompere la ricezione delle email da Bravo!? Continueremo a inviarti solo le comunicazioni essenziali legate al tuo account.
              </p>
              <Button onClick={confirm} className="w-full">
                Conferma disiscrizione
              </Button>
            </>
          )}

          {status === "submitting" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Aggiornamento in corso...
            </div>
          )}

          {status === "success" && (
            <div className="flex items-start gap-2 text-foreground">
              <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
              <p className="text-sm">
                Sei stato disiscritto con successo. Non riceverai più email promozionali da Bravo!.
              </p>
            </div>
          )}

          {status === "already_unsubscribed" && (
            <div className="flex items-start gap-2 text-foreground">
              <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
              <p className="text-sm">Sei già disiscritto. Nessun'altra azione richiesta.</p>
            </div>
          )}

          {(status === "invalid" || status === "error") && (
            <div className="flex items-start gap-2 text-foreground">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p className="text-sm">{errorMessage || "Si è verificato un errore."}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            Per supporto contattaci a{" "}
            <a href="mailto:team@bravoapp.it" className="underline">
              team@bravoapp.it
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
