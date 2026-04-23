import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { HRLayout } from "@/components/layout/HRLayout";
import { StepWizard } from "@/components/common/StepWizard";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

const TOTAL_STEPS = 6;

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

const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile",
  "Maggio", "Giugno", "Luglio", "Agosto",
  "Settembre", "Ottobre", "Novembre", "Dicembre",
];

const ITALIAN_PROVINCES = [
  "Agrigento","Alessandria","Ancona","Aosta","Arezzo","Ascoli Piceno","Asti",
  "Avellino","Bari","Barletta-Andria-Trani","Belluno","Benevento","Bergamo",
  "Biella","Bologna","Bolzano","Brescia","Brindisi","Cagliari","Caltanissetta",
  "Campobasso","Caserta","Catania","Catanzaro","Chieti","Como","Cosenza",
  "Cremona","Crotone","Cuneo","Enna","Fermo","Ferrara","Firenze","Foggia",
  "Forlì-Cesena","Frosinone","Genova","Gorizia","Grosseto","Imperia","Isernia",
  "L'Aquila","La Spezia","Latina","Lecce","Lecco","Livorno","Lodi","Lucca",
  "Macerata","Mantova","Massa-Carrara","Matera","Messina","Milano","Modena",
  "Monza e Brianza","Napoli","Novara","Nuoro","Oristano","Padova","Palermo",
  "Parma","Pavia","Perugia","Pesaro e Urbino","Pescara","Piacenza","Pisa",
  "Pistoia","Pordenone","Potenza","Prato","Ragusa","Ravenna","Reggio Calabria",
  "Reggio Emilia","Rieti","Rimini","Roma","Rovigo","Salerno","Sassari","Savona",
  "Siena","Siracusa","Sondrio","Sud Sardegna","Taranto","Teramo","Terni",
  "Torino","Trapani","Trento","Treviso","Trieste","Udine","Varese","Venezia",
  "Verbano-Cusio-Ossola","Vercelli","Verona","Vibo Valentia","Vicenza","Viterbo",
];

interface FormState {
  title: string;
  goals: string[];
  preferredActivities: string[];
  noActivityInMind: boolean;
  participantsCount: string;
  selectedMonths: number[];
  places: string[];
  budgetEstimate: string;
  extraServices: Record<string, boolean>;
  notes: string;
}

const initialForm: FormState = {
  title: "",
  goals: [],
  preferredActivities: [],
  noActivityInMind: false,
  participantsCount: "",
  selectedMonths: [],
  places: [],
  budgetEstimate: "",
  extraServices: {},
  notes: "",
};

export default function HRNewTBRequestPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, description").order("name");
      if (error) throw error;
      return data;
    },
  });

  const filteredProvinces = useMemo(() => {
    if (!provinceSearch.trim()) return ITALIAN_PROVINCES;
    const q = provinceSearch.toLowerCase();
    return ITALIAN_PROVINCES.filter((p) => p.toLowerCase().includes(q));
  }, [provinceSearch]);

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

  const toggleMonth = (monthIdx: number) => {
    update(
      "selectedMonths",
      form.selectedMonths.includes(monthIdx)
        ? form.selectedMonths.filter((m) => m !== monthIdx)
        : [...form.selectedMonths, monthIdx].sort((a, b) => a - b)
    );
  };

  const togglePlace = (place: string) => {
    update(
      "places",
      form.places.includes(place)
        ? form.places.filter((p) => p !== place)
        : [...form.places, place]
    );
  };

  const participantsNum = Number(form.participantsCount);
  const participantsMin = participantsNum > 0 ? Math.round(participantsNum * 0.9) : 0;
  const participantsMax = participantsNum > 0 ? Math.round(participantsNum * 1.1) : 0;

  const canNext = (): boolean => {
    switch (step) {
      case 1: return form.title.trim().length > 0;
      case 2: return form.goals.length > 0;
      case 3: return form.noActivityInMind || form.preferredActivities.length > 0;
      case 4: return participantsNum > 0;
      case 5: return form.selectedMonths.length > 0 && form.places.length > 0;
      case 6: return form.budgetEstimate.trim().length > 0;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    if (!user || !profile?.company_id) return;
    setSubmitting(true);
    try {
      // Build period from/to from selected months
      const now = new Date();
      const currentYear = now.getFullYear();
      const sortedMonths = [...form.selectedMonths].sort((a, b) => a - b);
      const firstMonth = sortedMonths[0];
      const lastMonth = sortedMonths[sortedMonths.length - 1];
      // If earliest month is before current month, use next year
      const year = firstMonth < now.getMonth() ? currentYear + 1 : currentYear;
      const periodFrom = new Date(year, firstMonth, 1);
      const periodToYear = lastMonth < firstMonth ? year + 1 : year;
      const periodTo = new Date(periodToYear, lastMonth + 1, 0); // last day of month

      const extraServices = {
        ...form.extraServices,
        goals: form.goals,
        preferred_activities: form.noActivityInMind ? ["none"] : form.preferredActivities,
      };

      const { error } = await supabase.from("tb_requests").insert({
        title: form.title.trim(),
        company_id: profile.company_id,
        requested_by: user.id,
        participants_min: participantsNum > 0 ? participantsMin : null,
        participants_max: participantsNum > 0 ? participantsMax : null,
        preferred_period_from: format(periodFrom, "yyyy-MM-dd"),
        preferred_period_to: format(periodTo, "yyyy-MM-dd"),
        preferred_city_id: null,
        preferred_location_type: null,
        budget_estimate: form.budgetEstimate ? Number(form.budgetEstimate) : null,
        extra_services: { ...extraServices, places: form.places },
        notes: form.notes.trim() || null,
        status: "submitted",
      });

      if (error) throw error;
      toast.success("Richiesta inviata con successo!");
      navigate("/hr/team-building");
    } catch {
      toast.error("Errore nell'invio della richiesta");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === TOTAL_STEPS) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Il tuo evento</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Dai un nome all'evento che vorresti realizzare.
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
                    "flex items-center gap-3 px-3 py-3 rounded-lg border cursor-pointer transition-colors text-sm",
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
                    "flex items-center gap-3 px-3 py-3 rounded-lg border cursor-pointer transition-colors text-sm",
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
                  "flex items-center gap-3 px-3 py-3 rounded-lg border cursor-pointer transition-colors text-sm mt-1",
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
                Quante persone pensi parteciperanno all'evento?
              </p>
            </div>
            <div>
              <Label htmlFor="pcount">Numero indicativo di partecipanti</Label>
              <Input
                id="pcount"
                type="number"
                min={1}
                placeholder="Es: 50"
                value={form.participantsCount}
                onChange={(e) => update("participantsCount", e.target.value)}
                className="mt-1.5"
              />
              {participantsNum > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Range stimato: <span className="font-medium text-foreground">{participantsMin} – {participantsMax} partecipanti</span>
                </p>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold">Quando e dove</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Seleziona quando e dove vorresti realizzare l'evento
              </p>
            </div>

            {/* Month selector */}
            <div>
              <Label className="mb-2 block">In che mese/i vorresti organizzarlo?</Label>
              <div className="grid grid-cols-4 gap-2">
                {MONTHS.map((month, idx) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => toggleMonth(idx)}
                    className={cn(
                      "py-2 px-1 rounded-lg border text-sm font-medium transition-colors",
                      form.selectedMonths.includes(idx)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted/30"
                    )}
                  >
                    {month.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Place multi-select */}
            <div>
              <Label className="mb-1.5 block">In quale/i luogo/i vorresti organizzare l'evento?</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca luogo..."
                  value={provinceSearch}
                  onChange={(e) => setProvinceSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg">
                {filteredProvinces.map((prov) => (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => togglePlace(prov)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm transition-colors flex items-center gap-2",
                      form.places.includes(prov)
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <Checkbox
                      checked={form.places.includes(prov)}
                      onCheckedChange={() => togglePlace(prov)}
                      className="pointer-events-none"
                    />
                    {prov}
                  </button>
                ))}
                {filteredProvinces.length === 0 && (
                  <p className="px-3 py-2 text-sm text-muted-foreground">Nessun luogo trovato</p>
                )}
              </div>
              {form.places.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {form.places.map((place) => (
                    <Badge
                      key={place}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                      onClick={() => togglePlace(place)}
                    >
                      {place} ×
                    </Badge>
                  ))}
                </div>
              )}
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
                      "flex items-center gap-3 px-3 py-3 rounded-lg border cursor-pointer transition-colors text-sm",
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

      default:
        return null;
    }
  };

  return (
    <HRLayout>
      <div className="max-w-xl mx-auto py-6 space-y-6">
        {/* Stepper dots — no labels, equal spacing */}
        <div className="flex items-center justify-center">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
            const stepNum = i + 1;
            const isCompleted = stepNum < step;
            const isCurrent = stepNum === step;
            return (
              <div key={i} className="flex items-center">
                <div
                  className={cn(
                    "h-3 w-3 rounded-full transition-all duration-300",
                    isCompleted
                      ? "bg-primary"
                      : isCurrent
                      ? "bg-primary ring-4 ring-primary/20"
                      : "bg-muted-foreground/20"
                  )}
                />
                {i < TOTAL_STEPS - 1 && (
                  <div
                    className={cn(
                      "h-px w-10 mx-1 transition-colors duration-300",
                      stepNum < step ? "bg-primary" : "bg-muted-foreground/20"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="bg-background">{renderStep()}</div>

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (step === 1 ? navigate("/hr/team-building") : setStep(step - 1))}
            disabled={submitting}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {step === 1 ? "Annulla" : "Indietro"}
          </Button>
          <Button size="sm" onClick={handleNext} disabled={!canNext() || submitting}>
            {step === TOTAL_STEPS ? (
              submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null
            ) : null}
            Avanti
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </HRLayout>
  );
}
