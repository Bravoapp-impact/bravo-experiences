import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UsersRound,
  Plus,
  ArrowRight,
  Calendar,
  Clock,
  Archive,
  ChevronDown,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { HRLayout } from "@/components/layout/HRLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { BravoCard, BravoCardMetaItem } from "@/components/common/BravoCard";
import {
  getTbCategoryIcon,
  getTbPrimaryCategoryId,
} from "@/lib/tb-category-icons";

/* ───────────────────────── Types ───────────────────────── */

type RequestState = "open" | "confirmed" | "completed" | "cancelled";

interface TBRequestRow {
  id: string;
  title: string;
  status: string;
  state: RequestState | string | null;
  created_at: string;
  updated_at: string;
  participants_min: number | null;
  participants_max: number | null;
  preferred_period_from: string | null;
  preferred_period_to: string | null;
  extra_services: Record<string, unknown> | null;
}

interface TBProposalRow {
  request_id: string;
  is_active: boolean;
  client_status: string;
}

interface TBQuoteRow {
  request_id: string;
  status: string;
}

interface TBEventRow {
  request_id: string;
  title: string | null;
  scheduled_datetime: string | null;
}

interface TBAcceptedProposalRow {
  request_id: string;
  format: { image_url: string | null } | null;
}

type PillTone = "amber" | "neutral";

interface PillState {
  label: string;
  tone: PillTone;
}

/* ──────────────── Pill calculation ──────────────── */

function computePill(
  req: TBRequestRow,
  proposals: TBProposalRow[],
  quotes: TBQuoteRow[],
): PillState {
  // 1. Brief incompleto (precede tutto)
  if (req.status === "draft") {
    return { label: "Brief incompleto", tone: "amber" };
  }
  // 2. Preventivo da decidere
  if (quotes.some((q) => q.status === "sent" || q.status === "viewed")) {
    return { label: "Preventivo da decidere", tone: "amber" };
  }
  // 3. N proposte da valutare
  const pendingProposals = proposals.filter(
    (p) => p.is_active && p.client_status === "pending",
  );
  if (pendingProposals.length > 0) {
    const n = pendingProposals.length;
    return {
      label: n === 1 ? "1 proposta da valutare" : `${n} proposte da valutare`,
      tone: "amber",
    };
  }
  // 4. Preventivo in lavorazione
  if (
    quotes.some(
      (q) => q.status === "draft" || q.status === "modification_requested",
    )
  ) {
    return { label: "Preventivo in lavorazione", tone: "neutral" };
  }
  // 5. Fallback
  return { label: "Proposte in arrivo", tone: "neutral" };
}

const PILL_TONE_CLASSES: Record<PillTone, string> = {
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  neutral: "bg-muted text-muted-foreground border-transparent",
};

/* ──────────────── Routing ──────────────── */

function detailRoute(req: TBRequestRow): string {
  if (req.status === "draft") return `/hr/team-building/brief/${req.id}`;
  return `/hr/team-building/${req.id}`;
}

/* ──────────────── Cards ──────────────── */

function ScheduledEventCard({
  req,
  event,
  imageUrl,
  index,
  onOpen,
}: {
  req: TBRequestRow;
  event: TBEventRow | undefined;
  imageUrl: string | null;
  index: number;
  onOpen: () => void;
}) {
  const eventDate = event?.scheduled_datetime
    ? new Date(event.scheduled_datetime)
    : null;

  const dateBadge = eventDate ? (
    <div className="absolute top-3 left-3 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 text-center shadow-sm">
      <p className="text-xs font-medium text-muted-foreground uppercase leading-none">
        {format(eventDate, "MMM", { locale: it })}
      </p>
      <p className="text-xl font-bold text-foreground leading-none mt-0.5">
        {format(eventDate, "d")}
      </p>
    </div>
  ) : undefined;

  const metaItems: BravoCardMetaItem[] = [];
  if (event?.title) metaItems.push({ text: event.title });
  if (req.participants_min && req.participants_max) {
    metaItems.push({
      icon: UsersRound,
      text: `${req.participants_min}–${req.participants_max} part.`,
    });
  }

  return (
    <BravoCard
      imageUrl={imageUrl}
      imageAlt={req.title}
      aspectRatio="square"
      imageOverlay={dateBadge}
      title={req.title}
      metaItems={metaItems}
      onOpen={onOpen}
      index={index}
    />
  );
}

function OpenRequestCard({
  req,
  pill,
  index,
  onOpen,
}: {
  req: TBRequestRow;
  pill: PillState;
  index: number;
  onOpen: () => void;
}) {
  const preferred = getTbPrimaryCategoryId(
    (req.extra_services as { preferred_activities?: unknown } | null)
      ?.preferred_activities,
  );
  const Icon: LucideIcon = getTbCategoryIcon(preferred);

  const metaItems: BravoCardMetaItem[] = [];
  if (req.preferred_period_from) {
    const from = new Date(req.preferred_period_from);
    const to = req.preferred_period_to
      ? new Date(req.preferred_period_to)
      : null;
    const text = to
      ? `${format(from, "MMM yyyy", { locale: it })} – ${format(to, "MMM yyyy", { locale: it })}`
      : format(from, "MMM yyyy", { locale: it });
    metaItems.push({ icon: CalendarClock, text });
  }
  if (req.participants_min && req.participants_max) {
    metaItems.push({
      icon: UsersRound,
      text: `${req.participants_min}–${req.participants_max} part.`,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
      className="group"
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-square rounded-xl bg-muted flex items-center justify-center overflow-hidden">
          <Icon className="h-12 w-12 text-muted-foreground/60" strokeWidth={1.5} />
          <div className="absolute top-3 left-3">
            <span
              className={cn(
                "inline-flex items-center text-[11px] font-medium px-2 py-1 rounded-full border",
                PILL_TONE_CLASSES[pill.tone],
              )}
            >
              {pill.label}
            </span>
          </div>
        </div>
        <div className="pt-2 space-y-1">
          <h3 className="text-[13px] font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {req.title || "Richiesta senza titolo"}
          </h3>
          {metaItems.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-light">
              {metaItems.map((item, i) => {
                const I = item.icon;
                return (
                  <span key={i} className="flex items-center gap-1 truncate">
                    {i > 0 && <span className="text-muted-foreground">·</span>}
                    {I && <I className="h-2.5 w-2.5 flex-shrink-0" />}
                    {item.text}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </button>
    </motion.div>
  );
}

function ArchivedCard({
  req,
  event,
  imageUrl,
  index,
  onOpen,
}: {
  req: TBRequestRow;
  event: TBEventRow | undefined;
  imageUrl: string | null;
  index: number;
  onOpen: () => void;
}) {
  const isCompleted = req.state === "completed";
  const eventDate = event?.scheduled_datetime
    ? new Date(event.scheduled_datetime)
    : null;
  const preferred = getTbPrimaryCategoryId(
    (req.extra_services as { preferred_activities?: unknown } | null)
      ?.preferred_activities,
  );
  const Icon = getTbCategoryIcon(preferred);

  const metaItems: BravoCardMetaItem[] = [];
  if (eventDate) {
    metaItems.push({
      icon: Calendar,
      text: format(eventDate, "d MMM yyyy", { locale: it }),
    });
  } else {
    metaItems.push({
      icon: Clock,
      text: format(new Date(req.updated_at), "d MMM yyyy", { locale: it }),
    });
  }

  const overlay = (
    <div className="absolute top-3 left-3">
      <Badge
        variant="secondary"
        className={cn(
          "text-[11px] font-medium",
          isCompleted
            ? "bg-emerald-50 text-emerald-700"
            : "bg-muted text-muted-foreground",
        )}
      >
        {isCompleted ? "Completato" : "Annullata"}
      </Badge>
    </div>
  );

  // Per i completati: usa immagine evento se c'è, altrimenti placeholder con icona.
  if (event?.format?.image_url || eventDate) {
    return (
      <BravoCard
        imageUrl={event?.format?.image_url ?? null}
        imageAlt={req.title}
        aspectRatio="square"
        imageOverlay={overlay}
        title={req.title}
        metaItems={metaItems}
        onOpen={onOpen}
        dimmed
        index={index}
      />
    );
  }

  // Cancellate senza format scelto: placeholder
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
      className="group opacity-60"
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-square rounded-xl bg-muted flex items-center justify-center overflow-hidden">
          <Icon className="h-12 w-12 text-muted-foreground/60" strokeWidth={1.5} />
          {overlay}
        </div>
        <div className="pt-2 space-y-1">
          <h3 className="text-[13px] font-medium text-foreground line-clamp-2 leading-snug">
            {req.title || "Richiesta senza titolo"}
          </h3>
          {metaItems.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-light">
              {metaItems.map((item, i) => {
                const I = item.icon;
                return (
                  <span key={i} className="flex items-center gap-1 truncate">
                    {I && <I className="h-2.5 w-2.5 flex-shrink-0" />}
                    {item.text}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </button>
    </motion.div>
  );
}

/* ──────────────── StatusSection wrapper ──────────────── */

function StatusSection({
  icon,
  title,
  count,
  iconClassName,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  iconClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2.5 px-1 py-2 mb-4">
        <span className={cn("flex-shrink-0", iconClassName)}>{icon}</span>
        <span className="text-sm font-medium text-foreground">
          {title} ({count})
        </span>
      </div>
      {children}
    </motion.div>
  );
}

/* ──────────────── Page ──────────────── */

export default function HRTeamBuildingPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const [deletingDraft, setDeletingDraft] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["tb-requests-list", profile?.company_id],
    enabled: !!profile?.company_id,
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from("tb_requests")
        .select(
          "id,title,status,state,created_at,updated_at,participants_min,participants_max,preferred_period_from,preferred_period_to,extra_services",
        )
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const reqs = (requests ?? []) as TBRequestRow[];

      const openIds = reqs.filter((r) => r.state === "open").map((r) => r.id);
      const confirmedIds = reqs
        .filter((r) => r.state === "confirmed")
        .map((r) => r.id);

      const [proposalsRes, quotesRes, eventsRes] = await Promise.all([
        openIds.length
          ? supabase
              .from("tb_proposals")
              .select("request_id,is_active,client_status")
              .in("request_id", openIds)
          : Promise.resolve({ data: [], error: null }),
        openIds.length
          ? supabase
              .from("tb_quotes")
              .select("request_id,status")
              .in("request_id", openIds)
          : Promise.resolve({ data: [], error: null }),
        confirmedIds.length || reqs.some((r) => r.state === "completed")
          ? supabase
              .from("tb_events")
              .select(
                "request_id,title,scheduled_datetime,format:tb_formats(image_url)",
              )
              .in(
                "request_id",
                reqs
                  .filter(
                    (r) => r.state === "confirmed" || r.state === "completed",
                  )
                  .map((r) => r.id),
              )
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (proposalsRes.error) throw proposalsRes.error;
      if (quotesRes.error) throw quotesRes.error;
      if (eventsRes.error) throw eventsRes.error;

      return {
        requests: reqs,
        proposals: (proposalsRes.data ?? []) as TBProposalRow[],
        quotes: (quotesRes.data ?? []) as TBQuoteRow[],
        events: (eventsRes.data ?? []) as TBEventRow[],
      };
    },
  });

  const { scheduled, open, archived, eventByReq, draftRequest } = useMemo(() => {
    const requests = data?.requests ?? [];
    const proposals = data?.proposals ?? [];
    const quotes = data?.quotes ?? [];
    const events = data?.events ?? [];

    const proposalsByReq = new Map<string, TBProposalRow[]>();
    for (const p of proposals) {
      const arr = proposalsByReq.get(p.request_id) ?? [];
      arr.push(p);
      proposalsByReq.set(p.request_id, arr);
    }
    const quotesByReq = new Map<string, TBQuoteRow[]>();
    for (const q of quotes) {
      const arr = quotesByReq.get(q.request_id) ?? [];
      arr.push(q);
      quotesByReq.set(q.request_id, arr);
    }
    const eventByReq = new Map<string, TBEventRow>();
    for (const e of events) {
      // più imminente per request
      const existing = eventByReq.get(e.request_id);
      if (!existing) {
        eventByReq.set(e.request_id, e);
        continue;
      }
      const a = e.scheduled_datetime
        ? new Date(e.scheduled_datetime).getTime()
        : Infinity;
      const b = existing.scheduled_datetime
        ? new Date(existing.scheduled_datetime).getTime()
        : Infinity;
      if (a < b) eventByReq.set(e.request_id, e);
    }

    const scheduled: TBRequestRow[] = [];
    const open: Array<TBRequestRow & { _pill: PillState }> = [];
    const archived: TBRequestRow[] = [];

    for (const r of requests) {
      const state = r.state ?? "open";
      if (state === "confirmed") {
        scheduled.push(r);
      } else if (state === "completed" || state === "cancelled") {
        archived.push(r);
      } else {
        const pill = computePill(
          r,
          proposalsByReq.get(r.id) ?? [],
          quotesByReq.get(r.id) ?? [],
        );
        open.push({ ...r, _pill: pill });
      }
    }

    // Sort
    scheduled.sort((a, b) => {
      const ea = eventByReq.get(a.id)?.scheduled_datetime;
      const eb = eventByReq.get(b.id)?.scheduled_datetime;
      const ta = ea ? new Date(ea).getTime() : Infinity;
      const tb = eb ? new Date(eb).getTime() : Infinity;
      return ta - tb;
    });
    open.sort((a, b) => {
      const ta = a.preferred_period_from
        ? new Date(a.preferred_period_from).getTime()
        : Infinity;
      const tb = b.preferred_period_from
        ? new Date(b.preferred_period_from).getTime()
        : Infinity;
      if (ta !== tb) return ta - tb;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    archived.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );

    const draftRequest = open.find((r) => r.status === "draft") ?? null;

    return { scheduled, open, archived, eventByReq, draftRequest };
  }, [data]);

  const hasAny =
    scheduled.length + open.length + archived.length > 0;

  const handleNewRequest = () => {
    if (draftRequest) {
      setDraftDialogOpen(true);
    } else {
      navigate("/hr/team-building/nuova-richiesta");
    }
  };

  const handleDeleteDraftAndStart = async () => {
    if (!draftRequest) return;
    setDeletingDraft(true);
    try {
      const { error } = await supabase
        .from("tb_requests")
        .delete()
        .eq("id", draftRequest.id);
      if (error) throw error;
      await queryClient.invalidateQueries({
        queryKey: ["tb-requests-list", profile?.company_id],
      });
      setDraftDialogOpen(false);
      navigate("/hr/team-building/nuova-richiesta");
    } catch (e) {
      devLog.error("Failed to delete draft", e);
      toast({
        title: "Errore",
        description: "Non è stato possibile eliminare la bozza.",
        variant: "destructive",
      });
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
          <Button
            onClick={() => navigate("/hr/team-building/nuova-richiesta")}
            size="lg"
          >
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

        {scheduled.length > 0 && (
          <StatusSection
            icon={<Calendar className="h-4 w-4" />}
            title="Eventi in programma"
            count={scheduled.length}
            iconClassName="text-emerald-500"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {scheduled.map((req, i) => (
                <ScheduledEventCard
                  key={req.id}
                  req={req}
                  event={eventByReq.get(req.id)}
                  index={i}
                  onOpen={() => navigate(detailRoute(req))}
                />
              ))}
            </div>
          </StatusSection>
        )}

        {open.length > 0 && (
          <StatusSection
            icon={<Clock className="h-4 w-4" />}
            title="Richieste in corso"
            count={open.length}
            iconClassName="text-amber-500"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {open.map((req, i) => (
                <OpenRequestCard
                  key={req.id}
                  req={req}
                  pill={req._pill}
                  index={i}
                  onOpen={() => navigate(detailRoute(req))}
                />
              ))}
            </div>
          </StatusSection>
        )}

        {archived.length > 0 && (
          <Collapsible open={archivedOpen} onOpenChange={setArchivedOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors">
                <Archive className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Archivio ({archived.length})
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 ml-auto transition-transform",
                    archivedOpen && "rotate-180",
                  )}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
                {archived.map((req, i) => (
                  <ArchivedCard
                    key={req.id}
                    req={req}
                    event={eventByReq.get(req.id)}
                    index={i}
                    onOpen={() => navigate(detailRoute(req))}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      <AlertDialog open={draftDialogOpen} onOpenChange={setDraftDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hai una bozza in sospeso</AlertDialogTitle>
            <AlertDialogDescription>
              Hai una richiesta che non hai ancora completato. Vuoi continuarla o
              ricominciarne una nuova? Iniziandone una nuova, la bozza attuale
              verrà eliminata.
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
                if (draftRequest) {
                  setDraftDialogOpen(false);
                  navigate(`/hr/team-building/brief/${draftRequest.id}`);
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
