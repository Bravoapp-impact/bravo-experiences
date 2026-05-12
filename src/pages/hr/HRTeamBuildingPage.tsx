import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UsersRound,
  Plus,
  Clock,
  CheckCircle2,
  FileText,
  ArrowRight,
  Sparkles,
  X,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { HRLayout } from "@/components/layout/HRLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { devLog } from "@/lib/logger";

type ColorTone = "neutral" | "amber" | "blue" | "green" | "red";
type Bucket = "draft" | "active" | "history";

interface StatusPresentation {
  label: string;
  nextAction: string;
  icon: LucideIcon;
  colorTone: ColorTone;
  bucket: Bucket;
}

const FALLBACK: StatusPresentation = {
  label: "Stato sconosciuto",
  nextAction: "Vedi dettagli",
  icon: FileText,
  colorTone: "neutral",
  bucket: "active",
};

const statusPresentationConfig: Record<string, StatusPresentation> = {
  draft: { label: "Brief incompleto", nextAction: "Continua brief", icon: FileText, colorTone: "neutral", bucket: "draft" },
  submitted: { label: "Richiesta in lavorazione", nextAction: "Vedi dettagli", icon: Clock, colorTone: "neutral", bucket: "active" },
  in_matching: { label: "Richiesta in lavorazione", nextAction: "Vedi dettagli", icon: Clock, colorTone: "neutral", bucket: "active" },
  proposals_ready: { label: "Proposte in arrivo", nextAction: "Vedi dettagli", icon: Clock, colorTone: "neutral", bucket: "active" },
  proposals_sent: { label: "Proposte da rivedere", nextAction: "Vedi proposte", icon: Sparkles, colorTone: "amber", bucket: "active" },
  quote_requested: { label: "Preventivo richiesto", nextAction: "Vedi dettagli", icon: Clock, colorTone: "neutral", bucket: "active" },
  quote_in_composition: { label: "Preventivo in preparazione", nextAction: "Vedi dettagli", icon: Clock, colorTone: "neutral", bucket: "active" },
  quote_sent: { label: "Preventivo pronto", nextAction: "Visualizza preventivo", icon: FileText, colorTone: "blue", bucket: "active" },
  modification_requested: { label: "Modifiche richieste", nextAction: "Vedi dettagli", icon: Clock, colorTone: "amber", bucket: "active" },
  quote_accepted: { label: "Preventivo accettato", nextAction: "Apri evento", icon: CheckCircle2, colorTone: "green", bucket: "active" },
  signed: { label: "Evento confermato", nextAction: "Apri evento", icon: CheckCircle2, colorTone: "green", bucket: "active" },
  event_scheduled: { label: "Evento confermato", nextAction: "Apri evento", icon: CheckCircle2, colorTone: "green", bucket: "active" },
  completed: { label: "Completato", nextAction: "Vedi dettagli", icon: CheckCircle2, colorTone: "green", bucket: "history" },
  cancelled: { label: "Annullato", nextAction: "Vedi dettagli", icon: X, colorTone: "red", bucket: "history" },
  quote_rejected: { label: "Annullato", nextAction: "Vedi dettagli", icon: X, colorTone: "red", bucket: "history" },
};

function getPresentation(status: string): StatusPresentation {
  return statusPresentationConfig[status] ?? FALLBACK;
}

const TONE_CLASSES: Record<ColorTone, { bg: string; fg: string; pill: string }> = {
  neutral: { bg: "bg-muted", fg: "text-muted-foreground", pill: "bg-muted text-muted-foreground" },
  amber: { bg: "bg-amber-50", fg: "text-amber-600", pill: "bg-amber-50 text-amber-700" },
  blue: { bg: "bg-blue-50", fg: "text-blue-600", pill: "bg-blue-50 text-blue-700" },
  green: { bg: "bg-emerald-50", fg: "text-emerald-600", pill: "bg-emerald-50 text-emerald-700" },
  red: { bg: "bg-red-50", fg: "text-red-600", pill: "bg-red-50 text-red-700" },
};

interface TBRequestRow {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  participants_min: number | null;
  participants_max: number | null;
}

function detailRoute(req: TBRequestRow): string {
  if (req.status === "draft") return `/hr/team-building/brief/${req.id}`;
  return `/hr/team-building/${req.id}`;
}

function ActiveCard({ req, onOpen }: { req: TBRequestRow; onOpen: () => void }) {
  const p = getPresentation(req.status);
  const Icon = p.icon;
  const tone = TONE_CLASSES[p.colorTone];

  return (
    <Card
      onClick={onOpen}
      className="p-5 cursor-pointer hover:border-primary/30 transition-colors group"
    >
      <div className="flex items-start gap-4">
        <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", tone.bg)}>
          <Icon className={cn("h-5 w-5", tone.fg)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{req.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aggiornato il {format(new Date(req.updated_at), "d MMM yyyy", { locale: it })}
                {req.participants_min && req.participants_max && (
                  <> · {req.participants_min}–{req.participants_max} partecipanti</>
                )}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 mt-0.5" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={cn("inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full", tone.pill)}>
              {p.label}
            </span>
            <span className="text-xs text-muted-foreground">— {p.nextAction}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function HistoryCard({ req, onOpen }: { req: TBRequestRow; onOpen: () => void }) {
  const p = getPresentation(req.status);
  const Icon = p.icon;
  const tone = TONE_CLASSES[p.colorTone];

  return (
    <Card
      onClick={onOpen}
      className="p-3 cursor-pointer hover:bg-muted/30 transition-colors flex items-center gap-3"
    >
      <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", tone.bg)}>
        <Icon className={cn("h-3.5 w-3.5", tone.fg)} />
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <p className="text-sm font-medium truncate">{req.title}</p>
        <span className="text-xs text-muted-foreground truncate">
          — {p.label} il {format(new Date(req.updated_at), "d MMMM", { locale: it })}
        </span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </Card>
  );
}

export default function HRTeamBuildingPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const [deletingDraft, setDeletingDraft] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["tb-requests", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tb_requests")
        .select("id,title,status,created_at,updated_at,participants_min,participants_max")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TBRequestRow[];
    },
    enabled: !!profile?.company_id,
  });

  const { drafts, actives, history } = useMemo(() => {
    const drafts: TBRequestRow[] = [];
    const actives: TBRequestRow[] = [];
    const history: TBRequestRow[] = [];
    for (const r of requests ?? []) {
      const bucket = getPresentation(r.status).bucket;
      if (bucket === "draft") drafts.push(r);
      else if (bucket === "history") history.push(r);
      else actives.push(r);
    }
    return { drafts, actives, history };
  }, [requests]);

  const hasAny = (requests?.length ?? 0) > 0;
  const existingDraft = drafts[0] ?? null;

  const handleNewRequest = () => {
    if (existingDraft) {
      setDraftDialogOpen(true);
    } else {
      navigate("/hr/team-building/nuova-richiesta");
    }
  };

  const handleDeleteDraftAndStart = async () => {
    if (!existingDraft) return;
    setDeletingDraft(true);
    try {
      const { error } = await supabase.from("tb_requests").delete().eq("id", existingDraft.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["tb-requests", profile?.company_id] });
      setDraftDialogOpen(false);
      navigate("/hr/team-building/nuova-richiesta");
    } catch (e) {
      devLog.error("Failed to delete draft", e);
      toast({ title: "Errore", description: "Non è stato possibile eliminare la bozza.", variant: "destructive" });
    } finally {
      setDeletingDraft(false);
    }
  };

  if (isLoading) {
    return (
      <HRLayout>
        <LoadingState />
      </HRLayout>
    );
  }

  if (!hasAny) {
    return (
      <HRLayout>
        <div className="flex flex-col items-center justify-center text-center py-20 px-4 max-w-md mx-auto">
          <div className="h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-6">
            <UsersRound className="h-8 w-8 text-orange-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Organizza il team building sociale perfetto per il tuo team
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Raccontaci cosa cerchi e ti proporremo le idee migliori per il tuo team
          </p>
          <Button onClick={() => navigate("/hr/team-building/nuova-richiesta")} size="lg">
            Inizia ora
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      <div className="space-y-8">
        <PageHeader
          title="Team building sociali"
          actions={
            <Button size="sm" onClick={handleNewRequest}>
              <Plus className="h-4 w-4 mr-1.5" />
              Nuova richiesta
            </Button>
          }
        />

        {drafts.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Bozze</h2>
            <div className="grid gap-3">
              {drafts.map((req) => (
                <ActiveCard key={req.id} req={req} onOpen={() => navigate(detailRoute(req))} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Attive</h2>
          {actives.length > 0 ? (
            <div className="grid gap-3">
              {actives.map((req) => (
                <ActiveCard key={req.id} req={req} onOpen={() => navigate(detailRoute(req))} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nessuna richiesta attiva al momento.
            </p>
          )}
        </section>

        {history.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="history" className="border-none">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2">
                Storico ({history.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-2 pt-2">
                  {history.map((req) => (
                    <HistoryCard key={req.id} req={req} onOpen={() => navigate(detailRoute(req))} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>

      <AlertDialog open={draftDialogOpen} onOpenChange={setDraftDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hai una bozza in sospeso</AlertDialogTitle>
            <AlertDialogDescription>
              Hai una richiesta che non hai ancora completato. Vuoi continuarla o
              ricominciarne una nuova? Iniziandone una nuova, la bozza attuale verrà eliminata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingDraft}>Chiudi</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deletingDraft}
              onClick={handleDeleteDraftAndStart}
            >
              Inizia nuova (elimina bozza)
            </Button>
            <AlertDialogAction
              disabled={deletingDraft}
              onClick={() => {
                if (existingDraft) {
                  setDraftDialogOpen(false);
                  navigate(`/hr/team-building/brief/${existingDraft.id}`);
                }
              }}
            >
              Continua bozza
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </HRLayout>
  );
}
