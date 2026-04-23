import { useQuery } from "@tanstack/react-query";
import { UsersRound, Plus, Clock, CheckCircle2, Send, FileText, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { HRLayout } from "@/components/layout/HRLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: typeof Clock }> = {
  draft: { label: "Bozza", variant: "secondary", icon: FileText },
  submitted: { label: "Inviata", variant: "default", icon: Send },
  in_progress: { label: "In lavorazione", variant: "default", icon: Clock },
  proposals_ready: { label: "Proposte pronte", variant: "default", icon: CheckCircle2 },
  confirmed: { label: "Confermata", variant: "default", icon: CheckCircle2 },
  completed: { label: "Completata", variant: "secondary", icon: CheckCircle2 },
  cancelled: { label: "Annullata", variant: "destructive", icon: FileText },
};

export default function HRTeamBuildingPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["tb-requests", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tb_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const hasRequests = requests && requests.length > 0;

  return (
    <HRLayout>
      <div className="space-y-6">
        {hasRequests ? (
          <>
            <PageHeader
              title="Team building sociali"
              actions={
                <Button size="sm" onClick={() => navigate("/hr/team-building/nuova-richiesta")}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Nuova richiesta
                </Button>
              }
            />

            <div className="grid gap-3">
              {requests.map((req) => {
                const cfg = statusConfig[req.status] || statusConfig.draft;
                const StatusIcon = cfg.icon;
                return (
                  <Card
                    key={req.id}
                    className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/hr/team-building/${req.id}`)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                        <UsersRound className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{req.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(req.created_at), "d MMM yyyy", { locale: it })}
                          {req.participants_min && req.participants_max && (
                            <> · {req.participants_min}–{req.participants_max} partecipanti</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={cfg.variant} className="text-xs">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {cfg.label}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        ) : isLoading ? (
          <LoadingState />
        ) : (
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
        )}
      </div>
    </HRLayout>
  );
}
