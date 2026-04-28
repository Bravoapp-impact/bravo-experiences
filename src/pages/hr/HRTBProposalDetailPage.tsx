import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HRLayout } from "@/components/layout/HRLayout";
import { LoadingState } from "@/components/common/LoadingState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TBFormatDetailContent } from "@/components/tb-format-detail/TBFormatDetailContent";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProposalDetail {
  proposal_id: string;
  format_id: string;
  priority: number;
  client_status: string;
  client_notes: string | null;
  format_title: string;
  format_description: string | null;
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

export default function HRTBProposalDetailPage() {
  const { id, proposalId } = useParams<{ id: string; proposalId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: proposals, isLoading } = useQuery({
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

  const proposal = proposals?.find((p) => p.proposal_id === proposalId);

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from("tb_proposals")
        .update({
          client_status: status,
          client_decision_at: new Date().toISOString(),
        })
        .eq("id", proposalId!);
      if (error) throw error;
    },
    onSuccess: (_data, status) => {
      queryClient.invalidateQueries({ queryKey: ["tb-proposals", id] });
      toast.success(
        status === "interested"
          ? "Salvato tra i preferiti"
          : status === "declined"
          ? "Proposta scartata"
          : "Scelta annullata"
      );
    },
  });

  if (isLoading) {
    return (
      <HRLayout>
        <LoadingState />
      </HRLayout>
    );
  }

  if (!proposal) {
    return (
      <HRLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <h2 className="text-lg font-semibold mb-2">Proposta non trovata</h2>
          <Button variant="outline" onClick={() => navigate(`/hr/team-building/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alle proposte
          </Button>
        </div>
      </HRLayout>
    );
  }

  const isInterested = proposal.client_status === "interested";
  const isDeclined = proposal.client_status === "declined";
  const services = proposal.format_services?.items || [];

  const onInterested = () =>
    updateStatus.mutate(isInterested ? "pending" : "interested");
  const onDeclined = () =>
    updateStatus.mutate(isDeclined ? "pending" : "declined");

  const headerExtras = (isInterested || isDeclined) ? (
    <div className="flex items-center gap-2 flex-wrap">
      {isInterested && (
        <Badge className="bg-primary/10 text-primary border-primary/20">
          <Heart className="h-3 w-3 mr-1 fill-current" />
          Interessato
        </Badge>
      )}
      {isDeclined && <Badge variant="secondary">Scartata</Badge>}
    </div>
  ) : null;

  return (
    <HRLayout>
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pb-32 lg:pb-12">
        <button
          onClick={() => navigate(`/hr/team-building/${id}`)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 py-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna alle proposte
        </button>

        <TBFormatDetailContent
          format={{
            id: proposal.format_id,
            title: proposal.format_title,
            description: proposal.format_description,
            image_url: proposal.format_image_url,
            category_name: proposal.format_category_name,
            location_type: proposal.format_location_type,
            duration_hours: proposal.format_duration_hours,
            participants_min: proposal.format_participants_min,
            participants_max: proposal.format_participants_max,
            sdgs: proposal.format_sdgs,
            secondary_tags: proposal.format_secondary_tags,
          }}
          services={services}
          headerExtras={headerExtras}
          sidebarSlot={
            <motion.div
              className="hidden lg:block w-[380px] flex-shrink-0 sticky top-24 self-start"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-5 space-y-3">
                  <p className="text-sm font-semibold">Cosa ne pensi?</p>
                  <p className="text-xs text-muted-foreground">
                    Segna le proposte che ti interessano: potrai poi richiedere una quotazione dedicata.
                  </p>
                  <Button
                    className="w-full gap-2"
                    variant={isInterested ? "default" : "outline"}
                    onClick={onInterested}
                    disabled={updateStatus.isPending}
                  >
                    <Heart className={cn("h-4 w-4", isInterested && "fill-current")} />
                    {isInterested ? "Interessato ✓" : "Mi interessa"}
                  </Button>
                  <Button
                    className="w-full gap-2"
                    variant="ghost"
                    onClick={onDeclined}
                    disabled={updateStatus.isPending}
                  >
                    {isDeclined ? (
                      "Annulla scelta"
                    ) : (
                      <>
                        <X className="h-4 w-4" />
                        Non mi interessa
                      </>
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => navigate(`/hr/team-building/${id}`)}
                    className="block w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors pt-2"
                  >
                    Torna alle proposte
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          }
          mobileDrawerSlot={
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] z-40 space-y-2">
              <Button
                className="w-full gap-2 h-12"
                variant={isInterested ? "default" : "outline"}
                onClick={onInterested}
                disabled={updateStatus.isPending}
              >
                <Heart className={cn("h-4 w-4", isInterested && "fill-current")} />
                {isInterested ? "Interessato ✓" : "Mi interessa"}
              </Button>
              <Button
                className="w-full gap-2"
                variant="ghost"
                onClick={onDeclined}
                disabled={updateStatus.isPending}
              >
                {isDeclined ? (
                  "Annulla scelta"
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    Non mi interessa
                  </>
                )}
              </Button>
            </div>
          }
        />
      </div>
    </HRLayout>
  );
}
