import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Users,
  MapPin,
  Calendar,
  CheckCircle,
  Heart,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HRLayout } from "@/components/layout/HRLayout";
import { LoadingState } from "@/components/common/LoadingState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { TagsSection } from "@/components/experience-detail/TagsSection";
import { SdgSection } from "@/components/experience-detail/SdgSection";
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

const LOCATION_LABELS: Record<string, string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  both: "Indoor / Outdoor",
};

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

  return (
    <HRLayout>
      <div className="max-w-5xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate(`/hr/team-building/${id}`)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 py-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna alle proposte
        </button>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lg:flex lg:gap-10 lg:items-stretch"
        >
          <div className="lg:w-[55%] flex-shrink-0">
            {proposal.format_image_url ? (
              <img
                src={proposal.format_image_url}
                alt={proposal.format_title}
                className="w-full aspect-[16/10] object-cover rounded-xl"
              />
            ) : (
              <div className="w-full aspect-[16/10] rounded-xl bg-muted/30 flex items-center justify-center">
                <Calendar className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
          </div>

          <div className="mt-4 lg:mt-0 lg:w-[45%] lg:flex lg:flex-col lg:justify-center space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {proposal.format_category_name && (
                <Badge variant="outline">{proposal.format_category_name}</Badge>
              )}
              <Badge variant="outline">
                <MapPin className="h-3 w-3 mr-1" />
                {LOCATION_LABELS[proposal.format_location_type] || proposal.format_location_type}
              </Badge>
              {isInterested && (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Heart className="h-3 w-3 mr-1 fill-current" />
                  Interessato
                </Badge>
              )}
              {isDeclined && (
                <Badge variant="secondary">Scartata</Badge>
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight">{proposal.format_title}</h1>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {(proposal.format_participants_min || proposal.format_participants_max) && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {proposal.format_participants_min || "—"} – {proposal.format_participants_max || "—"} persone
                </span>
              )}
              {proposal.format_duration_hours && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {proposal.format_duration_hours}h
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Content + sidebar */}
        <div className="lg:flex lg:gap-12 mt-10">
          <div className="flex-1 min-w-0">
            {proposal.format_description && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h2 className="text-lg font-semibold mb-3">Cosa farete</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {proposal.format_description}
                </p>
              </motion.div>
            )}

            {proposal.format_secondary_tags && proposal.format_secondary_tags.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Separator className="my-8" />
                <TagsSection tags={proposal.format_secondary_tags} />
              </motion.div>
            )}

            {proposal.format_sdgs && proposal.format_sdgs.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Separator className="my-8" />
                <SdgSection sdgs={proposal.format_sdgs} />
              </motion.div>
            )}

            {services.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                <Separator className="my-8" />
                <h2 className="text-lg font-semibold mb-3">Cosa include</h2>
                <ul className="space-y-2">
                  {services.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            <div className="h-12" />
          </div>

          {/* Sidebar */}
          <motion.div
            className="hidden lg:block w-[300px] flex-shrink-0 sticky top-24 self-start"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-3">
                <p className="text-sm font-medium">Cosa ne pensi?</p>
                <p className="text-xs text-muted-foreground">
                  Segna le proposte che ti interessano: potrai poi richiedere una quotazione dedicata.
                </p>
                <Button
                  className="w-full gap-2"
                  variant={isInterested ? "default" : "outline"}
                  onClick={() =>
                    updateStatus.mutate(isInterested ? "pending" : "interested")
                  }
                  disabled={updateStatus.isPending}
                >
                  <Heart className={cn("h-4 w-4", isInterested && "fill-current")} />
                  {isInterested ? "Interessato ✓" : "Mi interessa"}
                </Button>
                {!isDeclined ? (
                  <Button
                    className="w-full gap-2"
                    variant="ghost"
                    onClick={() => updateStatus.mutate("declined")}
                    disabled={updateStatus.isPending}
                  >
                    <X className="h-4 w-4" />
                    Non mi interessa
                  </Button>
                ) : (
                  <Button
                    className="w-full gap-2"
                    variant="ghost"
                    onClick={() => updateStatus.mutate("pending")}
                    disabled={updateStatus.isPending}
                  >
                    Annulla scelta
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Mobile sticky actions */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-3 flex gap-2 z-40">
          <Button
            className="flex-1 gap-2"
            variant={isInterested ? "default" : "outline"}
            onClick={() =>
              updateStatus.mutate(isInterested ? "pending" : "interested")
            }
            disabled={updateStatus.isPending}
          >
            <Heart className={cn("h-4 w-4", isInterested && "fill-current")} />
            {isInterested ? "Interessato" : "Mi interessa"}
          </Button>
          {!isDeclined && (
            <Button
              variant="ghost"
              onClick={() => updateStatus.mutate("declined")}
              disabled={updateStatus.isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </HRLayout>
  );
}
