import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { History } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { eurFmt } from "@/lib/tb-quote-schema";
import { PreviousVersionDialog } from "./PreviousVersionDialog";

interface QuoteHistoryAccordionProps {
  requestId: string;
}

const statusLabel: Record<string, string> = {
  draft: "Bozza",
  sent: "Inviato",
  viewed: "Visualizzato",
  accepted: "Accettato",
  rejected: "Rifiutato",
  modification_requested: "Modifiche richieste",
  superseded: "Sostituito",
};

export function QuoteHistoryAccordion({ requestId }: QuoteHistoryAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: history, isLoading } = useQuery({
    queryKey: ["tb-quote-history", requestId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_tb_quote_history_for_admin", { p_request_id: requestId });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  if (isLoading) return <Skeleton className="h-12" />;
  if (!history || history.length === 0) return null;

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Accordion type="single" collapsible>
            <AccordionItem value="history" className="border-0">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2 text-sm">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span>Cronologia preventivi ({history.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2">
                  {history.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setOpenId(q.id)}
                      className="w-full text-left rounded-md border p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">v{q.version}</span>
                          <Badge variant="outline" className="text-xs">
                            {statusLabel[q.status] ?? q.status}
                          </Badge>
                        </div>
                        <div className="text-sm tabular-nums text-muted-foreground">
                          {eurFmt.format(Number(q.total_amount_final ?? 0))}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {q.sent_at && <>Inviato {format(new Date(q.sent_at), "d MMM yyyy", { locale: it })}</>}
                        {q.sent_at && q.decided_at && " · "}
                        {q.decided_at && <>Decisione {format(new Date(q.decided_at), "d MMM yyyy", { locale: it })}</>}
                        {!q.sent_at && !q.decided_at && (
                          <>Creato {format(new Date(q.created_at), "d MMM yyyy", { locale: it })}</>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {openId && (
        <PreviousVersionDialog
          quoteId={openId}
          open={!!openId}
          onOpenChange={(o) => !o && setOpenId(null)}
        />
      )}
    </>
  );
}
