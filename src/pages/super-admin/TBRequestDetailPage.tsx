import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Inbox,
  MapPin,
  Sparkles,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getTBStatusMeta } from "@/lib/tb-status";
import { QuoteEditor } from "@/components/super-admin/tb-quote-editor/QuoteEditor";
import { QuoteReadOnlyView } from "@/components/super-admin/tb-quote-editor/QuoteReadOnlyView";
import { QuoteHistoryAccordion } from "@/components/super-admin/tb-quote-editor/QuoteHistoryAccordion";
import { devLog } from "@/lib/logger";

interface StatusLogEntry {
  id: string;
  from_status: string | null;
  to_status: string;
  changed_at: string;
  changed_by: string | null;
  changed_by_name: string | null;
  note: string | null;
}

interface QuoteHistoryEntry {
  id: string;
  version: number;
  status: string;
  total_amount_final: number | null;
  total_amount_ets: number | null;
  sent_at: string | null;
  decided_at: string | null;
  client_decision_notes: string | null;
  created_at: string;
  updated_at: string;
}

const placeholderToast = () =>
  toast.info("Funzionalità in arrivo", {
    description: "Disponibile nel prossimo aggiornamento.",
  });

export default function TBRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: request, isLoading: loadingRequest, error: requestError } = useQuery({
    queryKey: ["super-admin-tb-request", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tb_requests")
        .select("*, companies(name)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: statusLog } = useQuery({
    queryKey: ["super-admin-tb-status-log", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_tb_request_status_log_for_admin", {
        p_request_id: id!,
      });
      if (error) throw error;
      return (data ?? []) as StatusLogEntry[];
    },
    enabled: !!id,
  });

  const { data: proposals } = useQuery({
    queryKey: ["super-admin-tb-proposals", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tb_proposals")
        .select("id, priority, client_status, format_id, tb_formats(title)")
        .eq("request_id", id!)
        .order("priority");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: quoteHistory } = useQuery({
    queryKey: ["super-admin-tb-quote-history", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_tb_quote_history_for_admin", {
        p_request_id: id!,
      });
      if (error) throw error;
      return (data ?? []) as QuoteHistoryEntry[];
    },
    enabled: !!id,
  });

  if (loadingRequest) {
    return (
      <SuperAdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid lg:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64 lg:col-span-2" />
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  if (requestError || !request) {
    return (
      <SuperAdminLayout>
        <Card className="p-8 text-center text-muted-foreground">
          Richiesta non trovata o non accessibile.
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/super-admin/team-building/richieste")}
            >
              Torna all'elenco
            </Button>
          </div>
        </Card>
      </SuperAdminLayout>
    );
  }

  const meta = getTBStatusMeta(request.status);
  const companyName = (request as any).companies?.name ?? "Azienda";

  return (
    <SuperAdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="space-y-3">
          <button
            onClick={() => navigate("/super-admin/team-building/richieste")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Tutte le richieste
          </button>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">{request.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span>{companyName}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Creata il {format(new Date(request.created_at), "d MMM yyyy", { locale: it })} ·
                Aggiornata il {format(new Date(request.updated_at), "d MMM yyyy", { locale: it })}
              </p>
            </div>
            <Badge variant="outline" className={`${meta.badgeClass} text-sm px-3 py-1`}>
              {meta.label}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6 lg:self-start">
            <BriefCard request={request} />
            <TimelineCard log={statusLog ?? []} />
          </div>

          {/* Right column — dynamic by status */}
          <div className="lg:col-span-2">
            <StatusSection
              status={request.status}
              requestId={id!}
              request={request}
              proposals={proposals ?? []}
              quoteHistory={quoteHistory ?? []}
            />
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Brief Card
// ────────────────────────────────────────────────────────────────────────────
function BriefCard({ request }: { request: any }) {
  const places: string[] = Array.isArray(request.extra_services?.places)
    ? request.extra_services.places
    : [];
  const services: string[] = Array.isArray(request.extra_services?.preferred_activities)
    ? request.extra_services.preferred_activities
    : [];

  const fmtDate = (d: string | null) =>
    d ? format(new Date(d), "MMM yyyy", { locale: it }) : "—";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          Brief richiesta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <BriefRow icon={<Users className="h-3.5 w-3.5" />} label="Partecipanti">
          {request.participants_min && request.participants_max
            ? `${request.participants_min}–${request.participants_max}`
            : "—"}
        </BriefRow>
        <BriefRow icon={<Calendar className="h-3.5 w-3.5" />} label="Periodo">
          {fmtDate(request.preferred_period_from)} – {fmtDate(request.preferred_period_to)}
        </BriefRow>
        <BriefRow icon={<MapPin className="h-3.5 w-3.5" />} label="Luoghi">
          {places.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {places.map((p) => (
                <Badge key={p} variant="secondary" className="text-xs">
                  {p}
                </Badge>
              ))}
            </div>
          ) : (
            "—"
          )}
        </BriefRow>
        <BriefRow icon={<Wallet className="h-3.5 w-3.5" />} label="Budget">
          {request.budget_estimate
            ? `€ ${Number(request.budget_estimate).toLocaleString("it-IT")}`
            : "—"}
        </BriefRow>
        {services.length > 0 && (
          <BriefRow icon={<Sparkles className="h-3.5 w-3.5" />} label="Servizi extra">
            <div className="flex flex-wrap gap-1">
              {services.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          </BriefRow>
        )}
        {request.notes && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Note</p>
            <p className="text-sm whitespace-pre-line">{request.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BriefRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs min-w-[110px]">
        {icon}
        {label}
      </div>
      <div className="text-right">{children}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Timeline Card
// ────────────────────────────────────────────────────────────────────────────
function TimelineCard({ log }: { log: StatusLogEntry[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Cronologia
        </CardTitle>
      </CardHeader>
      <CardContent>
        {log.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun cambio di stato registrato.</p>
        ) : (
          <ol className="space-y-3 relative border-l border-border pl-4">
            {log.map((entry) => {
              const m = getTBStatusMeta(entry.to_status);
              return (
                <li key={entry.id} className="relative">
                  <span className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.changed_at), {
                        addSuffix: true,
                        locale: it,
                      })}
                      {entry.changed_by_name ? ` · ${entry.changed_by_name}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Status Section (dynamic by status)
// ────────────────────────────────────────────────────────────────────────────
function StatusSection({
  status,
  requestId,
  request,
  proposals,
  quoteHistory,
}: {
  status: string;
  requestId: string;
  request: any;
  proposals: any[];
  quoteHistory: QuoteHistoryEntry[];
}) {
  const queryClient = useQueryClient();
  const [composing, setComposing] = useState(false);

  const supersedeMutation = useMutation({
    mutationFn: async (oldQuoteId: string) => {
      const { data, error } = await supabase.rpc("admin_supersede_and_create_new_version", {
        p_old_quote_id: oldQuoteId,
      });
      if (error) throw error;
      return (data?.[0] ?? null) as any;
    },
    onSuccess: () => {
      toast.success("Nuova versione creata");
      queryClient.invalidateQueries({ queryKey: ["super-admin-tb-request", requestId] });
      queryClient.invalidateQueries({ queryKey: ["tb-quote-history", requestId] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-tb-quote-history", requestId] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-tb-status-log", requestId] });
    },
    onError: (err: any) => {
      devLog.error("supersede error", err);
      toast.error("Errore creazione nuova versione", { description: err?.message ?? "Riprova" });
    },
  });

  // Helpers per estrarre quote dallo storico (history è ordinata DESC per version)
  const draftQuote = quoteHistory.find((q) => q.status === "draft");
  const sentQuote = quoteHistory.find((q) => q.status === "sent" || q.status === "viewed");
  const acceptedQuote = quoteHistory.find((q) => q.status === "accepted");
  const rejectedQuote = quoteHistory.find((q) => q.status === "rejected");
  const modificationQuote = quoteHistory.find((q) => q.status === "modification_requested");

  switch (status) {
    case "draft":
      return (
        <InfoCard
          icon={<FileText />}
          title="Brief in compilazione"
          description="L'HR sta ancora compilando il brief della richiesta."
        />
      );

    case "submitted":
    case "in_matching":
      return (
        <InfoCard
          icon={<Sparkles />}
          title="Pronto per il matching"
          description="La richiesta è completa. Genera proposte automatiche dal catalogo."
          ctaLabel="Genera proposte automaticamente"
          onCta={placeholderToast}
        />
      );

    case "proposals_ready":
    case "proposals_sent":
      return <ProposalsCard proposals={proposals} title="Proposte inviate all'HR" />;

    case "proposals_reviewed":
      return (
        <ProposalsCard
          proposals={proposals}
          title="Proposte valutate dall'HR"
          highlightInterested
          ctaLabel="Richiedi quotazione ETS"
          onCta={placeholderToast}
        />
      );

    case "quote_requested": {
      if (composing) {
        const interested = proposals.filter((p) => p.client_status === "interested");
        const initialItems = interested.map((p) => ({
          proposal_id: p.id,
          description: p.tb_formats?.title ?? "Servizio",
          quantity: request.participants_min ?? 1,
        }));
        return (
          <div className="space-y-4">
            <QuoteEditor
              requestId={requestId}
              quoteId={null}
              initialProposalItems={initialItems.length > 0 ? initialItems : undefined}
            />
            <QuoteHistoryAccordion requestId={requestId} />
          </div>
        );
      }
      return (
        <InfoCard
          icon={<Inbox />}
          title="Quotazione ETS in corso"
          description="L'ETS ha ricevuto la richiesta. Quando hai i prezzi, componi il preventivo per il cliente."
          ctaLabel="Avvia composizione"
          onCta={() => setComposing(true)}
        />
      );
    }

    case "quote_in_composition": {
      if (!draftQuote) {
        return (
          <InfoCard
            icon={<FileText />}
            title="Bozza non trovata"
            description="Ricarica la pagina per riprendere la composizione."
            ctaLabel="Ricarica"
            onCta={() => window.location.reload()}
          />
        );
      }
      return (
        <div className="space-y-4">
          <QuoteEditor requestId={requestId} quoteId={draftQuote.id} />
          <QuoteHistoryAccordion requestId={requestId} />
        </div>
      );
    }

    case "modification_requested": {
      // Il workflow: dopo che HR chiede modifiche, super-admin clicca "Crea nuova versione"
      // → admin_supersede_and_create_new_version → request status diventa quote_in_composition.
      // Quindi questo branch in pratica è uno step intermedio dove ci si aspetta sia il quote
      // status='modification_requested' (request.status NON viene mai impostato a questo
      // valore lato HR — vedi hr_decide_on_quote che lo mappa a quote_in_composition).
      // Fallback difensivo: mostra il pannello modifiche + pulsante per creare nuova versione.
      const modQuote = modificationQuote;
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Modifiche richieste dal cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {modQuote?.client_decision_notes && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3 whitespace-pre-line">
                {modQuote.client_decision_notes}
              </div>
            )}
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => modQuote && supersedeMutation.mutate(modQuote.id)}
                disabled={!modQuote || supersedeMutation.isPending}
              >
                Crea nuova versione
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    case "quote_sent": {
      return (
        <div className="space-y-4">
          <QuoteSentReadOnly quoteId={sentQuote?.id ?? null} />
          <QuoteHistoryAccordion requestId={requestId} />
        </div>
      );
    }

    case "quote_accepted":
      return (
        <div className="space-y-4">
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardContent className="pt-5 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              <div>
                <p className="font-semibold text-emerald-900">Preventivo accettato</p>
                {acceptedQuote?.decided_at && (
                  <p className="text-xs text-emerald-800">
                    {format(new Date(acceptedQuote.decided_at), "d MMMM yyyy", { locale: it })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          <QuoteSentReadOnly quoteId={acceptedQuote?.id ?? null} />
          <QuoteHistoryAccordion requestId={requestId} />
        </div>
      );

    case "quote_rejected":
      return (
        <div className="space-y-4">
          <Card className="border-red-200 bg-red-50/40">
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-700" />
                <div>
                  <p className="font-semibold text-red-900">Preventivo rifiutato</p>
                  {rejectedQuote?.decided_at && (
                    <p className="text-xs text-red-800">
                      {format(new Date(rejectedQuote.decided_at), "d MMMM yyyy", { locale: it })}
                    </p>
                  )}
                </div>
              </div>
              {rejectedQuote?.client_decision_notes && (
                <div className="rounded-md bg-white/70 border border-red-200 p-3 text-sm whitespace-pre-line">
                  {rejectedQuote.client_decision_notes}
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => rejectedQuote && supersedeMutation.mutate(rejectedQuote.id)}
                  disabled={!rejectedQuote || supersedeMutation.isPending}
                >
                  Crea nuovo preventivo
                </Button>
              </div>
            </CardContent>
          </Card>
          <QuoteSentReadOnly quoteId={rejectedQuote?.id ?? null} />
          <QuoteHistoryAccordion requestId={requestId} />
        </div>
      );

    case "signed":
    case "event_scheduled":
    case "completed":
      return (
        <div className="space-y-4">
          <InfoCard
            icon={<Sparkles />}
            title="Stato avanzato"
            description="La gestione di questa fase sarà disponibile nei prossimi aggiornamenti."
            comingSoon
          />
          <QuoteHistoryAccordion requestId={requestId} />
        </div>
      );

    case "cancelled":
      return (
        <InfoCard
          icon={<FileText />}
          title="Richiesta cancellata"
          description="Questa richiesta è stata cancellata e non sarà più gestita."
        />
      );

    default:
      return (
        <InfoCard
          icon={<FileText />}
          title="Stato non riconosciuto"
          description={`Status: ${status}`}
        />
      );
  }
}

// Wrapper read-only che fetcha quote + items
function QuoteSentReadOnly({ quoteId }: { quoteId: string | null }) {
  const { data: quote, isLoading: lq } = useQuery({
    queryKey: ["tb-quote-full", quoteId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_tb_quote_full_for_admin", { p_quote_id: quoteId! });
      if (error) throw error;
      return (data?.[0] ?? null) as any;
    },
    enabled: !!quoteId,
  });
  const { data: items, isLoading: li } = useQuery({
    queryKey: ["tb-quote-items", quoteId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_tb_quote_items_full_for_admin", { p_quote_id: quoteId! });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!quoteId,
  });
  if (!quoteId) return null;
  if (lq || li) return <Skeleton className="h-48" />;
  if (!quote) return <p className="text-sm text-muted-foreground">Preventivo non trovato.</p>;
  return <QuoteReadOnlyView quote={quote} items={items ?? []} />;
}

// ────────────────────────────────────────────────────────────────────────────
// Helper sub-components
// ────────────────────────────────────────────────────────────────────────────
function InfoCard({
  icon,
  title,
  description,
  ctaLabel,
  onCta,
  comingSoon,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  comingSoon?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
            {icon}
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{title}</h3>
              {comingSoon && (
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                  In arrivo
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {ctaLabel && onCta && (
          <div className="flex justify-end">
            <Button size="sm" onClick={onCta}>
              {ctaLabel}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProposalsCard({
  proposals,
  title,
  highlightInterested,
  ctaLabel,
  onCta,
}: {
  proposals: any[];
  title: string;
  highlightInterested?: boolean;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {title} ({proposals.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {proposals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuna proposta ancora.</p>
        ) : (
          proposals.map((p) => {
            const isInterested = p.client_status === "interested";
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-md border ${
                  highlightInterested && isInterested
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-border bg-card"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {p.tb_formats?.title ?? "Format"}
                  </p>
                  <p className="text-xs text-muted-foreground">Priorità {p.priority}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {p.client_status}
                </Badge>
              </div>
            );
          })
        )}
        {ctaLabel && onCta && (
          <div className="pt-2 flex justify-end">
            <Button size="sm" onClick={onCta}>
              {ctaLabel}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

