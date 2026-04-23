import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TOTAL_STEPS = 7;

const GOALS = [
  "Sviluppare competenze e soft skills",
  "Promuovere l'impegno per la sostenibilità ambientale",
  "Rafforzare lo spirito di squadra e il team",
  "Migliorare il clima aziendale e il senso di appartenenza",
  "Lavorare sui valori dell'inclusione e diversità",
  "Ridurre le barriere e le gerarchie aziendali",
  "Facilitare l'incontro e la conoscenza reciproca",
  "Vivere un momento di benessere e svago",
  "Potenziare l'immagine dell'azienda",
];

const EXTRA_SERVICES_OPTIONS = [
  { key: "lunch", label: "Pranzo" },
  { key: "transport", label: "Trasporto" },
  { key: "venue_rental", label: "Noleggio location" },
  { key: "social_catering", label: "Catering sociale" },
];

interface TBBriefWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormState {
  title: string;
  goals: string[];
  preferredActivities: string[];
  noActivityInMind: boolean;
  participantsMin: string;
  participantsMax: string;
  periodFrom: Date | undefined;
  periodTo: Date | undefined;
  cityId: string;
  locationType: string;
  budgetEstimate: string;
  extraServices: Record<string, boolean>;
  notes: string;
}

const initialForm: FormState = {
  title: "",
  goals: [],
  preferredActivities: [],
  noActivityInMind: false,
  participantsMin: "",
  participantsMax: "",
  periodFrom: undefined,
  periodTo: undefined,
  cityId: "",
  locationType: "",
  budgetEstimate: "",
  extraServices: {},
  notes: "",
};

export function TBBriefWizard({ open, onOpenChange, onSuccess }: TBBriefWizardProps) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const { data: cities } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cities").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, description").order("name");
      if (error) throw error;
      return data;
    },
  });

  const reset = () => {
    setStep(1);
    setForm(initialForm);
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleGoal = (goal: string) =>
    update("goals", form.goals.includes(goal) ? form.goals.filter((g) => g !== goal) : [...form.goals, goal]);

  const toggleActivity = (catId: string) => {
    if (form.noActivityInMind) return;
    update(
      "preferredActivities",
      form.preferredActivities.includes(catId)
        ? form.preferredActivities.filter((a) => a !== catId)
        : [...form.preferredActivities, catId]
    );
  };

  const toggleNoActivity = () => {
    if (!form.noActivityInMind) {
      update("preferredActivities", []);
    }
    update("noActivityInMind", !form.noActivityInMind);
  };

  const canNext = (): boolean => {
    switch (step) {
      case 1: return form.title.trim().length > 0;
      case 2: return form.goals.length > 0;
      case 3: return form.noActivityInMind || form.preferredActivities.length > 0;
      case 4: return !!form.participantsMin && !!form.participantsMax && Number(form.participantsMin) > 0 && Number(form.participantsMax) >= Number(form.participantsMin);
      case 5: return true;
      case 6: return true;
      case 7: return true;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    if (!user || !profile?.company_id) return;
    setSubmitting(true);
    try {
      const extraServices = {
        ...form.extraServices,
        goals: form.goals,
        preferred_activities: form.noActivityInMind ? ["none"] : form.preferredActivities,
      };

      const { error } = await supabase.from("tb_requests").insert({
        title: form.title.trim(),
        company_id: profile.company_id,
        requested_by: user.id,
        participants_min: form.participantsMin ? Number(form.participantsMin) : null,
        participants_max: form.participantsMax ? Number(form.participantsMax) : null,
        preferred_period_from: form.periodFrom ? format(form.periodFrom, "yyyy-MM-dd") : null,
        preferred_period_to: form.periodTo ? format(form.periodTo, "yyyy-MM-dd") : null,
        preferred_city_id: form.cityId || null,
        preferred_location_type: form.locationType || null,
        budget_estimate: form.budgetEstimate ? Number(form.budgetEstimate) : null,
        extra_services: extraServices,
        notes: form.notes.trim() || null,
        status: "submitted",
      });

      if (error) throw error;
      toast.success("Richiesta inviata con successo!");
      reset();
      onSuccess();
    } catch (err: any) {
      toast.error("Errore nell'invio della richiesta");
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryName = (id: string) => categories?.find((c) => c.id === id)?.name ?? id;
  const getCityName = (id: string) => cities?.find((c) => c.id === id)?.name ?? id;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Il tuo evento</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Dai un nome a questo evento. Es: "TB Primavera - Team Marketing"
              </p>
            </div>
            <div>
              <Label htmlFor="title">Nome dell'evento</Label>
              <Input
                id="title"
                placeholder="Es: TB Primavera - Team Marketing"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                maxLength={100}
                className="mt-1.5"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Obiettivo da raggiungere</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Che obiettivo/i vuoi raggiungere con "{form.title}"?
              </p>
            </div>
            <div className="grid gap-2">
              {GOALS.map((goal) => (
                <label
                  key={goal}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm",
                    form.goals.includes(goal)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/30"
                  )}
                >
                  <Checkbox
                    checked={form.goals.includes(goal)}
                    onCheckedChange={() => toggleGoal(goal)}
                  />
                  {goal}
                </label>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Punto di partenza</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Hai già in mente qualche attività per il tuo team?
              </p>
            </div>
            <div className="grid gap-2">
              {categories?.map((cat) => (
                <label
                  key={cat.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm",
                    form.noActivityInMind
                      ? "opacity-40 pointer-events-none"
                      : form.preferredActivities.includes(cat.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/30"
                  )}
                >
                  <Checkbox
                    checked={form.preferredActivities.includes(cat.id)}
                    onCheckedChange={() => toggleActivity(cat.id)}
                    disabled={form.noActivityInMind}
                  />
                  <div>
                    <span className="font-medium">{cat.name}</span>
                    {cat.description && (
                      <span className="text-muted-foreground"> — {cat.description}</span>
                    )}
                  </div>
                </label>
              ))}
              <label
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm mt-2",
                  form.noActivityInMind
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/30"
                )}
              >
                <Checkbox
                  checked={form.noActivityInMind}
                  onCheckedChange={() => toggleNoActivity()}
                />
                <span className="font-medium">Non ho ancora nessuna attività in mente</span>
              </label>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Partecipanti</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Indica il range di persone che pensi parteciperanno all'evento
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pmin">Minimo</Label>
                <Input
                  id="pmin"
                  type="number"
                  min={1}
                  placeholder="Es: 10"
                  value={form.participantsMin}
                  onChange={(e) => update("participantsMin", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="pmax">Massimo</Label>
                <Input
                  id="pmax"
                  type="number"
                  min={1}
                  placeholder="Es: 30"
                  value={form.participantsMax}
                  onChange={(e) => update("participantsMax", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Quando e dove</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Seleziona quando e dove vorresti realizzare l'evento
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data inizio (indicativa)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal mt-1.5", !form.periodFrom && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.periodFrom ? format(form.periodFrom, "d MMM yyyy", { locale: it }) : "Seleziona"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.periodFrom}
                      onSelect={(d) => update("periodFrom", d)}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Data fine (indicativa)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal mt-1.5", !form.periodTo && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.periodTo ? format(form.periodTo, "d MMM yyyy", { locale: it }) : "Seleziona"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.periodTo}
                      onSelect={(d) => update("periodTo", d)}
                      disabled={(date) => date < (form.periodFrom || new Date())}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label>Città preferita</Label>
              <Select value={form.cityId} onValueChange={(v) => update("cityId", v)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Seleziona una città" />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  {cities?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipologia location</Label>
              <Select value={form.locationType} onValueChange={(v) => update("locationType", v)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Seleziona" />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  <SelectItem value="indoor">Indoor</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                  <SelectItem value="both">Indifferente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Budget e servizi</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Indicaci il budget a disposizione e i servizi aggiuntivi di cui hai bisogno
              </p>
            </div>
            <div>
              <Label htmlFor="budget">Budget indicativo (€)</Label>
              <Input
                id="budget"
                type="number"
                min={0}
                placeholder="Es: 5000"
                value={form.budgetEstimate}
                onChange={(e) => update("budgetEstimate", e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="mb-2 block">Servizi aggiuntivi</Label>
              <div className="grid gap-2">
                {EXTRA_SERVICES_OPTIONS.map((svc) => (
                  <label
                    key={svc.key}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm",
                      form.extraServices[svc.key]
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/30"
                    )}
                  >
                    <Checkbox
                      checked={!!form.extraServices[svc.key]}
                      onCheckedChange={(checked) =>
                        update("extraServices", { ...form.extraServices, [svc.key]: !!checked })
                      }
                    />
                    {svc.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Note aggiuntive</Label>
              <Textarea
                id="notes"
                placeholder="Qualcosa che vuoi farci sapere..."
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                maxLength={1000}
                className="mt-1.5"
                rows={3}
              />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Riepilogo</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Verifica i dati prima di inviare la richiesta
              </p>
            </div>
            <div className="space-y-3 text-sm">
              <RecapRow label="Evento" value={form.title} />
              <RecapRow label="Obiettivi" value={form.goals.join(", ")} />
              <RecapRow
                label="Attività"
                value={
                  form.noActivityInMind
                    ? "Nessuna preferenza"
                    : form.preferredActivities.map(getCategoryName).join(", ")
                }
              />
              <RecapRow label="Partecipanti" value={`${form.participantsMin} – ${form.participantsMax}`} />
              {form.periodFrom && (
                <RecapRow
                  label="Periodo"
                  value={`${format(form.periodFrom, "d MMM yyyy", { locale: it })}${form.periodTo ? ` – ${format(form.periodTo, "d MMM yyyy", { locale: it })}` : ""}`}
                />
              )}
              {form.cityId && <RecapRow label="Città" value={getCityName(form.cityId)} />}
              {form.locationType && (
                <RecapRow
                  label="Location"
                  value={form.locationType === "indoor" ? "Indoor" : form.locationType === "outdoor" ? "Outdoor" : "Indifferente"}
                />
              )}
              {form.budgetEstimate && <RecapRow label="Budget" value={`€ ${Number(form.budgetEstimate).toLocaleString("it-IT")}`} />}
              {Object.entries(form.extraServices).some(([, v]) => v) && (
                <RecapRow
                  label="Servizi"
                  value={EXTRA_SERVICES_OPTIONS.filter((s) => form.extraServices[s.key]).map((s) => s.label).join(", ")}
                />
              )}
              {form.notes && <RecapRow label="Note" value={form.notes} />}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Brief team building</DialogTitle>
          {/* Progress bar */}
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i < step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground pt-1">Passo {step} di {TOTAL_STEPS}</p>
        </DialogHeader>

        <div className="py-2">{renderStep()}</div>

        <div className="flex justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (step === 1 ? handleClose(false) : setStep(step - 1))}
            disabled={submitting}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {step === 1 ? "Annulla" : "Indietro"}
          </Button>
          {step < TOTAL_STEPS ? (
            <Button size="sm" onClick={() => setStep(step + 1)} disabled={!canNext()}>
              Avanti
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              Invia richiesta
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="font-medium text-muted-foreground w-24 shrink-0">{label}</span>
      <span>{value}</span>
    </div>
  );
}
