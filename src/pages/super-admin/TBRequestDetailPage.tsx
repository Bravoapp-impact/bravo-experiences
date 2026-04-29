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
  proposals,
  quoteHistory,
}: {
  status: string;
  proposals: any[];
  quoteHistory: QuoteHistoryEntry[];
}) {
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

    case "quote_requested":
      return (
        <InfoCard
          icon={<Inbox />}
          title="Quotazione ETS in corso"
          description="Stai aspettando il prezzo dell'ETS via email. Quando arriva, componi il preventivo per il cliente."
          ctaLabel="Componi preventivo"
          onCta={placeholderToast}
        />
      );

    case "quote_in_composition":
    case "quote_sent":
      return (
        <div className="space-y-4">
          <InfoCard
            icon={<FileText />}
            title="Editor preventivo"
            description="L'editor del preventivo sarà disponibile nel prossimo aggiornamento."
            comingSoon
          />
          {quoteHistory.length > 0 && <QuoteHistoryCard quoteHistory={quoteHistory} />}
        </div>
      );

    case "quote_accepted":
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
          {quoteHistory.length > 0 && <QuoteHistoryCard quoteHistory={quoteHistory} />}
        </div>
      );

    case "quote_rejected": {
      const lastRejected = quoteHistory.find((q) => q.status === "rejected");
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Richiesta chiusa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">Il cliente ha rifiutato il preventivo.</p>
            {lastRejected?.client_decision_notes && (
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Motivo dichiarato</p>
                <p className="whitespace-pre-line">{lastRejected.client_decision_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

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

function QuoteHistoryCard({ quoteHistory }: { quoteHistory: QuoteHistoryEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Storia preventivi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {quoteHistory.map((q) => (
          <div
            key={q.id}
            className="flex items-center justify-between p-3 rounded-md border bg-card"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">Versione {q.version}</p>
              <p className="text-xs text-muted-foreground">
                {q.total_amount_final
                  ? `€ ${Number(q.total_amount_final).toLocaleString("it-IT")}`
                  : "—"}
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {q.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
