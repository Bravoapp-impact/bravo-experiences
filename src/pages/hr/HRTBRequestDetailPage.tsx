import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock, Heart, MoreVertical, Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HRLayout } from "@/components/layout/HRLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { type TBRequestStatus } from "@/lib/tb-status";
import { BravoCard, type BravoCardMetaItem } from "@/components/common/BravoCard";
import { cn } from "@/lib/utils";
import { TBRequestBriefSummary } from "@/components/hr/tb/TBRequestBriefSummary";
import { TBRequestStatusSection } from "@/components/hr/tb/TBRequestStatusSection";

interface ProposalDetail {
  proposal_id: string;
  client_status: string;
  format_id: string;
  format_title: string;
  format_description: string | null;
  format_short_description: string | null;
  format_image_url: string | null;
  format_category_name: string | null;
  format_duration_hours: number | null;
  format_participants_min: number | null;
  format_participants_max: number | null;
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

const CANCELLABLE_STATUSES = new Set([
  "draft",
  "submitted",
  "in_matching",
  "proposals_ready",
  "proposals_sent",
]);

export default function HRTBRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

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

  const cancelRequest = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("tb_requests")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Richiesta annullata");
      queryClient.invalidateQueries({ queryKey: ["tb-request", id] });
      navigate("/hr/team-building/nuova-richiesta");
    },
    onError: () => {
      toast.error("Impossibile annullare la richiesta", {
        description: "Riprova tra qualche istante.",
      });
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

  const interestedCount =
    proposals?.filter((p) => p.client_status === "interested").length || 0;
  const isReadOnly = READ_ONLY_STATUSES.has(request.status);
  const canCancel = CANCELLABLE_STATUSES.has(request.status);
  const hasProposals = proposals && proposals.length > 0;

  function buildMetaItems(p: ProposalDetail): BravoCardMetaItem[] {
    const items: BravoCardMetaItem[] = [];
    if (p.format_category_name) {
      items.push({ text: p.format_category_name });
    }
    if (p.format_duration_hours) {
      items.push({ icon: Clock, text: `${p.format_duration_hours}h` });
    }
    if (p.format_participants_min && p.format_participants_max) {
      items.push({
        icon: Users,
        text: `${p.format_participants_min}–${p.format_participants_max}`,
      });
    }
    return items;
  }

  function renderProposalActions(p: ProposalDetail) {
    const isInterested = p.client_status === "interested";
    const isDeclined = p.client_status === "declined";
    return (
      <div className="flex items-center gap-1.5 pt-1.5">
        <Button
          size="sm"
          variant={isInterested ? "default" : "outline"}
          disabled={isReadOnly}
          onClick={() =>
            updateProposalStatus.mutate({
              proposalId: p.proposal_id,
              status: isInterested ? "pending" : "interested",
            })
          }
          className="text-xs h-7 flex-1"
        >
          <Heart className={cn("h-3.5 w-3.5 mr-1", isInterested && "fill-current")} />
          {isInterested ? "Interessato" : "Mi interessa"}
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={isDeclined ? "outline" : "ghost"}
                disabled={isReadOnly}
                onClick={() =>
                  updateProposalStatus.mutate({
                    proposalId: p.proposal_id,
                    status: isDeclined ? "pending" : "declined",
                  })
                }
                className={cn("h-7 w-7", isDeclined && "bg-muted")}
                aria-label="Non interessato"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Non interessato</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

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
            {canCancel && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Altre azioni"
                    className="shrink-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setCancelDialogOpen(true);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    Elimina e ricomincia
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Brief summary */}
        <TBRequestBriefSummary request={request} />

        {/* Proposals grid */}
        {hasProposals && (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Le tue proposte</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {proposals!.map((p, i) => (
                <BravoCard
                  key={p.proposal_id}
                  imageUrl={p.format_image_url}
                  imageAlt={p.format_title}
                  fallbackEmoji="✨"
                  title={p.format_title}
                  metaItems={buildMetaItems(p)}
                  onOpen={() =>
                    navigate(`/hr/team-building/${id}/proposte/${p.proposal_id}`)
                  }
                  index={i}
                  dimmed={p.client_status === "declined"}
                  actions={renderProposalActions(p)}
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

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annullare la richiesta?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per annullare questa richiesta, vuoi continuare?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, torna indietro</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelRequest.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sì, annulla
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </HRLayout>
  );
}
