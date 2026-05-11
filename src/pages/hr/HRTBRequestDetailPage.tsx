import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Wallet,
  Clock,
  Heart,
  X,
  Check,
  Send,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { HRLayout } from "@/components/layout/HRLayout";
import { LoadingState } from "@/components/common/LoadingState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProposalDetail {
  proposal_id: string;
  format_id: string;
  priority: number;
  client_status: string;
  client_notes: string | null;
  format_title: string;
  format_description: string | null;
  format_short_description: string | null;
  format_image_url: string | null;
  format_category_id: string | null;
  format_category_name: string | null;
  format_duration_hours: number | null;
  format_participants_min: number | null;
  format_participants_max: number | null;
  format_location_type: string;
  format_sdgs: string[] | null;
  format_secondary_tags: string[] | null;
  format_services: { items?: string[] } | null;
}

export default function HRTBRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: request, isLoading: loadingRequest } = useQuery({
    queryKey: ["tb-request", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tb_requests")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: proposals, isLoading: loadingProposals } = useQuery({
    queryKey: ["tb-proposals", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_tb_proposal_details", {
        p_request_id: id!,
      });
      if (error) throw error;
      return (data as unknown as ProposalDetail[]) || [];
    },
    enabled: !!id,
  });

  const updateProposalStatus = useMutation({
    mutationFn: async ({ proposalId, status }: { proposalId: string; status: string }) => {
      const { error } = await supabase
        .from("tb_proposals")
        .update({
          client_status: status,
          client_decision_at: new Date().toISOString(),
        })
        .eq("id", proposalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tb-proposals", id] });
    },
  });

  const requestQuote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("tb_requests")
        .update({ status: "quote_requested", updated_at: new Date().toISOString() })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tb-request", id] });
      toast.success("Richiesta di quotazione inviata!");
    },
  });

  if (loadingRequest || loadingProposals) {
    return (
      <HRLayout>
        <LoadingState />
      </HRLayout>
    );
  }

  if (!request) {
    return (
      <HRLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Richiesta non trovata</p>
        </div>
      </HRLayout>
    );
  }

  const extraServices = (request.extra_services as Record<string, unknown>) || {};
  const places = (extraServices.places as string[]) || [];
  const interestedCount = proposals?.filter((p) => p.client_status === "interested").length || 0;
  const allDecided = proposals?.every((p) => p.client_status !== "pending") || false;
  const canRequestQuote = interestedCount > 0 && request.status !== "quote_requested";

  return (
    <HRLayout>
      <div className="max-w-3xl mx-auto py-6 space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/hr/team-building")}
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Tutte le richieste
        </Button>

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold">{request.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Creata il {format(new Date(request.created_at), "d MMMM yyyy", { locale: it })}
          </p>
        </div>

        {/* Brief summary */}
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">Riepilogo brief</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {request.participants_min && request.participants_max && (
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Partecipanti</p>
                  <p className="text-sm font-medium">
                    {request.participants_min}–{request.participants_max}
                  </p>
                </div>
              </div>
            )}
            {request.preferred_period_from && request.preferred_period_to && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Periodo</p>
                  <p className="text-sm font-medium">
                    {format(new Date(request.preferred_period_from), "MMM", { locale: it })} –{" "}
                    {format(new Date(request.preferred_period_to), "MMM yyyy", { locale: it })}
                  </p>
                </div>
              </div>
            )}
            {places.length > 0 && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Luoghi</p>
                  <p className="text-sm font-medium">{places.join(", ")}</p>
                </div>
              </div>
            )}
            {request.budget_estimate && (
              <div className="flex items-start gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="text-sm font-medium">€{Number(request.budget_estimate).toLocaleString("it-IT")}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Proposals section */}
        {proposals && proposals.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              Le migliori proposte per «{request.title}»
            </h2>
            <div className="grid gap-4">
              {proposals.map((p) => (
                <ProposalCard
                  key={p.proposal_id}
                  proposal={p}
                  onOpenDetail={() => navigate(`/hr/team-building/${id}/proposte/${p.proposal_id}`)}
                  onToggleInterest={() => {
                    const newStatus = p.client_status === "interested" ? "pending" : "interested";
                    updateProposalStatus.mutate({ proposalId: p.proposal_id, status: newStatus });
                  }}
                  onDecline={() => {
                    updateProposalStatus.mutate({ proposalId: p.proposal_id, status: "declined" });
                  }}
                />
              ))}
            </div>

            {/* Request quote CTA */}
            {canRequestQuote && (
              <div className="pt-4 border-t">
                <Button
                  onClick={() => requestQuote.mutate()}
                  disabled={requestQuote.isPending}
                  className="w-full sm:w-auto"
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  Richiedi quotazione ({interestedCount} {interestedCount === 1 ? "proposta" : "proposte"})
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Riceverai un preventivo dettagliato per le proposte selezionate
                </p>
              </div>
            )}

            {request.status === "quote_requested" && (
              <Card className="p-4 bg-muted/30 border-primary/20">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Quotazione richiesta</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Stiamo preparando il preventivo. Ti contatteremo presto!
                </p>
              </Card>
            )}
          </div>
        ) : (
          <Card className="p-8 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Stiamo lavorando alla tua selezione</p>
              <p className="text-sm text-muted-foreground mt-1">
                Il nostro team sta valutando le migliori proposte per il tuo evento. Ti contatteremo a breve.
              </p>
            </div>
          </Card>
        )}
      </div>
    </HRLayout>
  );
}

function ProposalCard({
  proposal,
  onOpenDetail,
  onToggleInterest,
  onDecline,
}: {
  proposal: ProposalDetail;
  onOpenDetail: () => void;
  onToggleInterest: () => void;
  onDecline: () => void;
}) {
  const isInterested = proposal.client_status === "interested";
  const isDeclined = proposal.client_status === "declined";

  return (
    <Card
      className={cn(
        "overflow-hidden transition-colors",
        isInterested && "ring-1 ring-primary/40",
        isDeclined && "opacity-50"
      )}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div
          className="sm:w-40 h-36 sm:h-auto bg-muted shrink-0 cursor-pointer"
          onClick={onOpenDetail}
        >
          {proposal.format_image_url ? (
            <img
              src={proposal.format_image_url}
              alt={proposal.format_title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              Nessuna immagine
            </div>
          )}
        </div>
        {/* Content */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 cursor-pointer" onClick={onOpenDetail}>
              <h3 className="font-medium text-sm truncate">{proposal.format_title}</h3>
              {(proposal.format_short_description ?? proposal.format_description) && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {proposal.format_short_description ?? proposal.format_description}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {proposal.format_category_name && (
              <Badge variant="secondary" className="text-xs">
                {proposal.format_category_name}
              </Badge>
            )}
            {proposal.format_duration_hours && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-0.5" />
                {proposal.format_duration_hours}h
              </Badge>
            )}
            {proposal.format_participants_min && proposal.format_participants_max && (
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-0.5" />
                {proposal.format_participants_min}–{proposal.format_participants_max}
              </Badge>
            )}
          </div>
          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              variant={isInterested ? "default" : "outline"}
              onClick={onToggleInterest}
              className="text-xs h-8"
            >
              <Heart className={cn("h-3.5 w-3.5 mr-1", isInterested && "fill-current")} />
              {isInterested ? "Interessato" : "Mi interessa"}
            </Button>
            {!isDeclined && !isInterested && (
              <Button size="sm" variant="ghost" onClick={onDecline} className="text-xs h-8 text-muted-foreground">
                <X className="h-3.5 w-3.5 mr-1" />
                Non interessato
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
