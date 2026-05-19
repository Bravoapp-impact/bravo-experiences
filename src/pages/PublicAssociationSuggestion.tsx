import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

type Status = "loading" | "invalid" | "form" | "thanks";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-association-suggestion`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function PublicAssociationSuggestion() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<Status>("loading");
  const [companyName, setCompanyName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [suggestedName, setSuggestedName] = useState("");
  const [suggestedCity, setSuggestedCity] = useState("");
  const [suggesterName, setSuggesterName] = useState("");
  const [suggesterEmail, setSuggesterEmail] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${FUNCTIONS_URL}?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
            headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
          },
        );
        if (!res.ok) {
          setStatus("invalid");
          return;
        }
        const data = await res.json();
        setCompanyName(data.company_name ?? "");
        setStatus("form");
      } catch {
        setStatus("invalid");
      }
    })();
  }, [token]);

  function resetForm() {
    setSuggestedName("");
    setSuggestedCity("");
    setSuggesterName("");
    setSuggesterEmail("");
    setReason("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!suggestedName.trim() || !suggestedCity.trim() || !suggesterName.trim() || !suggesterEmail.trim()) {
      toast.error("Compila i campi obbligatori");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `${FUNCTIONS_URL}?token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: ANON_KEY,
            Authorization: `Bearer ${ANON_KEY}`,
          },
          body: JSON.stringify({
            suggested_name: suggestedName.trim(),
            suggested_city: suggestedCity.trim() || null,
            suggester_name: suggesterName.trim(),
            suggester_email: suggesterEmail.trim(),
            reason: reason.trim() || null,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "Errore durante l'invio");
        return;
      }
      resetForm();
      setStatus("thanks");
    } catch {
      toast.error("Errore di rete. Riprova.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl">
        {status === "loading" && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        )}

        {status === "invalid" && (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground" />
              <h1 className="text-xl font-semibold">Link non valido o scaduto</h1>
              <p className="text-muted-foreground text-sm">
                Questo link non è valido o è scaduto. Contatta il tuo
                referente HR per un nuovo link.
              </p>
            </CardContent>
          </Card>
        )}

        {status === "thanks" && (
          <Card>
            <CardContent className="p-8 text-center space-y-5">
              <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
              <h1 className="text-xl font-semibold">Grazie!</h1>
              <p className="text-muted-foreground">
                Il tuo suggerimento è stato inviato a{" "}
                <span className="font-medium text-foreground">{companyName}</span>.
              </p>
              <Button variant="outline" onClick={() => setStatus("form")}>
                Invia un altro suggerimento
              </Button>
            </CardContent>
          </Card>
        )}

        {status === "form" && (
          <Card>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold leading-tight">
                  Suggerisci un ente del terzo settore a{" "}
                  <span className="text-primary">{companyName}</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  La tua azienda raccoglierà i suggerimenti per supportare gli
                  enti non-profit indicati.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="suggested_name">
                    Nome dell'ente <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="suggested_name"
                    value={suggestedName}
                    onChange={(e) => setSuggestedName(e.target.value)}
                    maxLength={200}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="suggested_city">Città dell'ente</Label>
                  <Input
                    id="suggested_city"
                    value={suggestedCity}
                    onChange={(e) => setSuggestedCity(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="suggester_name">
                      Il tuo nome <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="suggester_name"
                      value={suggesterName}
                      onChange={(e) => setSuggesterName(e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="suggester_email">
                      La tua email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="suggester_email"
                      type="email"
                      value={suggesterEmail}
                      onChange={(e) => setSuggesterEmail(e.target.value)}
                      maxLength={255}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reason">Motivazione</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={1000}
                    rows={4}
                    placeholder="Perché pensi che la tua azienda dovrebbe supportare questo ente?"
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Invio in corso..." : "Invia suggerimento"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
