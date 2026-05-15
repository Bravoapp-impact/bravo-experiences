import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { PageSkeleton } from "@/components/common/skeletons/PageSkeleton";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, Check, Loader2, AlertCircle } from "lucide-react";
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

type SaveStatus = "idle" | "saving" | "saved" | "error";

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
  const { id: routeDraftId } = useParams<{ id?: string }>();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [bootstrapping, setBootstrapping] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutosaveRef = useRef(true);
  const requestIdRef = useRef<string | null>(null);
  useEffect(() => { requestIdRef.current = requestId; }, [requestId]);

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

  const buildPayload = useCallback((f: FormState, status: "draft" | "submitted") => {
    const pNum = Number(f.participantsCount);
    const pMin = pNum > 0 ? Math.round(pNum * 0.9) : null;
    const pMax = pNum > 0 ? Math.round(pNum * 1.1) : null;

    let periodFromStr: string | null = null;
    let periodToStr: string | null = null;
    if (f.selectedMonths.length > 0) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const sortedMonths = [...f.selectedMonths].sort((a, b) => a - b);
      const firstMonth = sortedMonths[0];
      const lastMonth = sortedMonths[sortedMonths.length - 1];
      const year = firstMonth < now.getMonth() ? currentYear + 1 : currentYear;
      const periodFrom = new Date(year, firstMonth, 1);
      const periodToYear = lastMonth < firstMonth ? year + 1 : year;
      const periodTo = new Date(periodToYear, lastMonth + 1, 0);
      periodFromStr = format(periodFrom, "yyyy-MM-dd");
      periodToStr = format(periodTo, "yyyy-MM-dd");
    }

    const extraServices = {
      ...f.extraServices,
      goals: f.goals,
      preferred_activities: f.noActivityInMind ? ["none"] : f.preferredActivities,
      places: f.places,
    };

    return {
      title: f.title.trim() || "Senza titolo",
      participants_min: pMin,
      participants_max: pMax,
      preferred_period_from: periodFromStr,
      preferred_period_to: periodToStr,
      preferred_city_id: null,
      preferred_location_type: null,
      budget_estimate: f.budgetEstimate ? Number(f.budgetEstimate) : null,
      extra_services: extraServices,
      notes: f.notes.trim() || null,
      status,
    };
  }, []);

  // Bootstrap: load existing draft (by route id or by HR existing draft) or fresh form
  useEffect(() => {
    if (!user || !profile?.company_id) return;
    let cancelled = false;
    (async () => {
      setBootstrapping(true);
      try {
        if (routeDraftId) {
          const { data, error } = await supabase
            .from("tb_requests")
            .select("*")
            .eq("id", routeDraftId)
            .maybeSingle();
          if (cancelled) return;
          if (error || !data) {
            toast.error("Bozza non trovata");
            navigate("/hr/team-building");
            return;
          }
          if (data.status !== "draft") {
            toast.error("Questa richiesta non è più modificabile");
            navigate("/hr/team-building");
            return;
          }
          const { data: existing } = await supabase
            .from("tb_requests")
            .select("id")
            .eq("requested_by", user.id)
            .eq("status", "draft")
            .maybeSingle();
          if (cancelled) return;
          if (existing && existing.id !== data.id) {
            navigate(`/hr/team-building/brief/${existing.id}`, { replace: true });
            return;
          }
          const es = (data.extra_services ?? {}) as Record<string, unknown>;
          const goals = Array.isArray(es.goals) ? (es.goals as string[]) : [];
          const prefAct = Array.isArray(es.preferred_activities) ? (es.preferred_activities as string[]) : [];
          const places = Array.isArray(es.places) ? (es.places as string[]) : [];
          const noAct = prefAct.length === 1 && prefAct[0] === "none";
          const knownKeys = new Set(["goals", "preferred_activities", "places"]);
          const extraServices: Record<string, boolean> = {};
          for (const [k, v] of Object.entries(es)) {
            if (!knownKeys.has(k) && typeof v === "boolean") extraServices[k] = v;
          }
          const selectedMonths: number[] = [];
          if (data.preferred_period_from && data.preferred_period_to) {
            const from = new Date(data.preferred_period_from);
            const to = new Date(data.preferred_period_to);
            const startM = from.getMonth();
            const endM = to.getMonth();
            const months = endM >= startM ? endM - startM + 1 : 12 - startM + endM + 1;
            for (let i = 0; i < months; i++) selectedMonths.push((startM + i) % 12);
          }
          skipNextAutosaveRef.current = true;
          setForm({
            title: data.title ?? "",
            goals,
            preferredActivities: noAct ? [] : prefAct,
            noActivityInMind: noAct,
            participantsCount: data.participants_max
              ? String(Math.round((data.participants_max as number) / 1.1))
              : "",
            selectedMonths,
            places,
            budgetEstimate: data.budget_estimate != null ? String(data.budget_estimate) : "",
            extraServices,
            notes: data.notes ?? "",
          });
          setRequestId(data.id);
          setSaveStatus("saved");
        } else {
          const { data: existing } = await supabase
            .from("tb_requests")
            .select("id")
            .eq("requested_by", user.id)
            .eq("status", "draft")
            .maybeSingle();
          if (cancelled) return;
          if (existing) {
            toast.info("Hai una bozza in corso, la riprendi qui");
            navigate(`/hr/team-building/brief/${existing.id}`, { replace: true });
            return;
          }
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.company_id, routeDraftId]);

  // Debounced autosave when requestId is set
  useEffect(() => {
    if (!requestId) return;
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus("saving");
    debounceRef.current = setTimeout(async () => {
      const payload = buildPayload(form, "draft");
      const { error } = await supabase
        .from("tb_requests")
        .update(payload)
        .eq("id", requestId);
      if (error) {
        setSaveStatus("error");
      } else {
        setSaveStatus("saved");
      }
    }, 1500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form, requestId, buildPayload]);

  const ensureDraftCreated = async (): Promise<string | null> => {
    if (requestIdRef.current) return requestIdRef.current;
    if (!user || !profile?.company_id) return null;
    if (form.title.trim().length === 0) return null;
    const payload = buildPayload(form, "draft");
    setSaveStatus("saving");
    const { data, error } = await supabase
      .from("tb_requests")
      .insert({
        ...payload,
        company_id: profile.company_id,
        requested_by: user.id,
      })
      .select("id")
      .single();
    if (error || !data) {
      setSaveStatus("error");
      toast.error("Errore nel salvataggio della bozza");
      return null;
    }
    skipNextAutosaveRef.current = true;
    setRequestId(data.id);
    setSaveStatus("saved");
    window.history.replaceState(null, "", `/hr/team-building/brief/${data.id}`);
    return data.id;
  };

  const handleSubmit = async () => {
    if (!user || !profile?.company_id) return;
    setSubmitting(true);
    try {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      let id = requestIdRef.current;
      if (!id) {
        id = await ensureDraftCreated();
        if (!id) throw new Error("no-draft");
      }
      const payload = buildPayload(form, "submitted");
      const { error } = await supabase
        .from("tb_requests")
        .update(payload)
        .eq("id", id);
      if (error) throw error;

      try {
        await supabase.rpc("match_tb_formats_for_request", { p_request_id: id });
      } catch {
        // best-effort
      }

      toast.success("Richiesta inviata con successo!");
      navigate(`/hr/team-building/${id}`);
    } catch {
      toast.error("Errore nell'invio della richiesta");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (step === TOTAL_STEPS) {
      handleSubmit();
      return;
    }
    if (step === 1 && !requestIdRef.current) {
      const id = await ensureDraftCreated();
      if (!id) return;
    }
    setStep(step + 1);
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

  const showSaveIndicator = !!requestId;
  const saveIndicator = (() => {
    if (!showSaveIndicator) return null;
    if (saveStatus === "saving") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Salvataggio…
        </span>
      );
    }
    if (saveStatus === "error") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          Errore di salvataggio
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-primary" />
        Salvato
      </span>
    );
  })();

  if (bootstrapping) {
    return (
      <HRLayout>
        <PageSkeleton variant="form" />
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      <div className="max-w-xl mx-auto pt-6">
        <div className="flex justify-end h-5">
          {saveIndicator}
        </div>
      </div>
      <StepWizard
        totalSteps={TOTAL_STEPS}
        currentStep={step}
        onNext={handleNext}
        onBack={() => (step === 1 ? navigate("/hr/team-building") : setStep(step - 1))}
        canNext={canNext()}
        submitting={submitting}
        backLabel={step === 1 ? "Annulla" : "Indietro"}
        nextLabel={step === TOTAL_STEPS ? "Invia richiesta" : "Avanti"}
      >
        {renderStep()}
      </StepWizard>
    </HRLayout>
  );
}
