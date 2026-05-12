import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HRLayout } from "@/components/layout/HRLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { getTBStatusMeta, type TBRequestStatus } from "@/lib/tb-status";
import {
  TBProposalCard,
  type TBProposalCardData,
} from "@/components/hr/tb/TBProposalCard";
import { TBRequestBriefSummary } from "@/components/hr/tb/TBRequestBriefSummary";
import { TBRequestStatusSection } from "@/components/hr/tb/TBRequestStatusSection";

interface ProposalDetail extends TBProposalCardData {
  format_id: string;
  priority: number;
  client_notes: string | null;
  format_category_id: string | null;
  format_location_type: string;
  format_sdgs: string[] | null;
  format_secondary_tags: string[] | null;
  format_services: { items?: string[] } | null;
}

const READ_ONLY_STATUSES = new Set([
  "quote_requested",
  "quote_in_composition",
  "modification_requested",
  "quote_sent",
  "quote_accepted",
  "quote_rejected",
  "signed",
  "event_scheduled",
  "completed",
  "cancelled",
]);

export default function HRTBRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
      toast.success("Richiesta inviata, prepariamo il preventivo");
    },
  });

  if (loadingRequest || loadingProposals) {
    return (
      <HRLayout>
        <div className="max-w-6xl mx-auto py-6 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Card className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        </div>
      </HRLayout>
    );
  }

  if (!request) {
    return (
      <HRLayout>
        <div className="max-w-6xl mx-auto py-20 text-center">
          <p className="text-muted-foreground">Richiesta non trovata</p>
        </div>
      </HRLayout>
    );
  }

  const statusMeta = getTBStatusMeta(request.status);
  const interestedCount =
    proposals?.filter((p) => p.client_status === "interested").length || 0;
  const isReadOnly = READ_ONLY_STATUSES.has(request.status);
  const hasProposals = proposals && proposals.length > 0;

  return (
    <HRLayout>
      <div className="max-w-6xl mx-auto py-6 space-y-6">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 -mx-4 px-4 sm:-mx-6 sm:px-6 bg-background/95 backdrop-blur-sm border-b border-border/50 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/hr/team-building")}
            className="-ml-2 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Tutte le richieste
          </Button>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold tracking-tight">{request.title}</h1>
            <Badge variant="outline" className={statusMeta.badgeClass}>
              {statusMeta.label}
            </Badge>
          </div>
        </div>

        {/* Brief summary */}
        <TBRequestBriefSummary request={request} />

        {/* Proposals grid */}
        {hasProposals && (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Le tue proposte</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {proposals!.map((p, index) => (
                <TBProposalCard
                  key={p.proposal_id}
                  proposal={p}
                  index={index}
                  readOnly={isReadOnly}
                  onOpenDetail={() =>
                    navigate(`/hr/team-building/${id}/proposte/${p.proposal_id}`)
                  }
                  onToggleInterest={() => {
                    const newStatus =
                      p.client_status === "interested" ? "pending" : "interested";
                    updateProposalStatus.mutate({
                      proposalId: p.proposal_id,
                      status: newStatus,
                    });
                  }}
                  onToggleDecline={() => {
                    const newStatus =
                      p.client_status === "declined" ? "pending" : "declined";
                    updateProposalStatus.mutate({
                      proposalId: p.proposal_id,
                      status: newStatus,
                    });
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Dynamic status section */}
        <TBRequestStatusSection
          status={request.status as TBRequestStatus}
          interestedCount={interestedCount}
          onContinueDraft={() =>
            navigate(`/hr/team-building/nuova-richiesta?id=${id}`)
          }
          onRequestQuote={() => requestQuote.mutate()}
          isRequestingQuote={requestQuote.isPending}
        />
      </div>
    </HRLayout>
  );
}
