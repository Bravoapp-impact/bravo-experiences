import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { QuoteReadOnlyView } from "./QuoteReadOnlyView";

interface PreviousVersionDialogProps {
  quoteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PreviousVersionDialog({ quoteId, open, onOpenChange }: PreviousVersionDialogProps) {
  const { data: quote, isLoading: loadingQuote } = useQuery({
    queryKey: ["tb-quote-full", quoteId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_tb_quote_full_for_admin", { p_quote_id: quoteId });
      if (error) throw error;
      return (data?.[0] ?? null) as any;
    },
    enabled: open && !!quoteId,
  });

  const { data: items, isLoading: loadingItems } = useQuery({
    queryKey: ["tb-quote-items", quoteId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_tb_quote_items_full_for_admin", { p_quote_id: quoteId });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: open && !!quoteId,
  });

  const loading = loadingQuote || loadingItems;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" style={{ zIndex: 200 }}>
        <DialogHeader>
          <DialogTitle>{quote ? `Preventivo v${quote.version}` : "Preventivo"}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        ) : quote ? (
          <QuoteReadOnlyView quote={quote} items={items ?? []} />
        ) : (
          <p className="text-sm text-muted-foreground">Preventivo non trovato.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
