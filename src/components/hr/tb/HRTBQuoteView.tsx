import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { AlertCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { devLog } from "@/lib/logger";

interface QuoteData {
  id: string;
  request_id: string;
  version: number;
  status: string;
  total_amount_final: number | null;
  currency: string;
  valid_until: string | null;
  terms_text: string | null;
  sent_at: string | null;
  viewed_at: string | null;
}

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price_final: number | null;
  total_final: number | null;
  notes: string | null;
  display_order: number;
}

const eur = (n: number | null | undefined) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(Number(n ?? 0));

export function HRTBQuoteView({ requestId }: { requestId: string }) {
  const queryClient = useQueryClient();
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [modifyNotes, setModifyNotes] = useState("");

  const quoteQuery = useQuery({
    queryKey: ["hr-tb-quote", requestId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_tb_quote_for_hr", {
        p_request_id: requestId,
      });
      if (error) throw error;
      const arr = (data as unknown as QuoteData[]) || [];
      return arr[0] ?? null;
    },
  });

  const quote = quoteQuery.data;

  const itemsQuery = useQuery({
    queryKey: ["hr-tb-quote-items", quote?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_tb_quote_items_for_hr", {
        p_quote_id: quote!.id,
      });
      if (error) throw error;
      return (data as unknown as QuoteItem[]) || [];
    },
    enabled: !!quote?.id,
  });

  // Mark viewed on first open
  useEffect(() => {
    if (quote?.id && quote.status === "sent") {
      supabase
        .rpc("hr_mark_tb_quote_viewed", { p_quote_id: quote.id })
        .then(({ error }) => {
          if (error) {
            devLog.error("hr_mark_tb_quote_viewed error", error);
            return;
          }
          queryClient.invalidateQueries({
            queryKey: ["hr-tb-quote", requestId],
          });
          queryClient.invalidateQueries({ queryKey: ["tb-request", requestId] });
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote?.id, quote?.status]);

  const decide = useMutation({
    mutationFn: async (vars: {
      decision: "accepted" | "rejected" | "modification_requested";
      notes: string | null;
    }) => {
      if (!quote?.id) throw new Error("missing quote");
      const { error } = await supabase.rpc("hr_decide_on_quote", {
        p_quote_id: quote.id,
        p_decision: vars.decision,
        p_notes: vars.notes,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["tb-request", requestId] });
      queryClient.invalidateQueries({ queryKey: ["hr-tb-quote", requestId] });
      if (vars.decision === "accepted") toast.success("Preventivo accettato");
      else if (vars.decision === "rejected") toast.success("Preventivo rifiutato");
      else toast.success("Richiesta di modifiche inviata");
      setAcceptOpen(false);
      setRejectOpen(false);
      setModifyOpen(false);
      setRejectNotes("");
      setModifyNotes("");
    },
    onError: () => {
      toast.error("Operazione non riuscita", {
        description: "Riprova tra qualche istante.",
      });
    },
  });

  if (quoteQuery.isLoading) {
    return (
      <Card className="p-6 space-y-5">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </Card>
    );
  }

  if (quoteQuery.isError) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-semibold">
              Impossibile caricare il preventivo
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => quoteQuery.refetch()}
            >
              Riprova
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!quote) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
          <p className="text-sm text-muted-foreground">Preventivo non trovato</p>
        </div>
      </Card>
    );
  }

  const items = itemsQuery.data || [];
  const isPending = decide.isPending;

  const actions = (
    <>
      <Button
        onClick={() => setAcceptOpen(true)}
        disabled={isPending}
        className="w-full sm:w-auto"
      >
        Accetta preventivo
      </Button>
      <Button
        variant="outline"
        onClick={() => setModifyOpen(true)}
        disabled={isPending}
        className="w-full sm:w-auto"
      >
        Richiedi modifiche
      </Button>
      <Button
        variant="ghost"
        onClick={() => setRejectOpen(true)}
        disabled={isPending}
        className="w-full sm:w-auto text-destructive hover:text-destructive"
      >
        Rifiuta
      </Button>
    </>
  );

  return (
    <>
      <Card className="p-6 space-y-5 pb-32 sm:pb-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            Preventivo v{quote.version}
          </p>
          {quote.valid_until && (
            <p className="text-xs text-muted-foreground">
              Valido fino al{" "}
              {format(new Date(quote.valid_until), "d MMMM yyyy", { locale: it })}
            </p>
          )}
        </div>

        <div>
          <p className="text-3xl font-bold tracking-tight">
            {eur(quote.total_amount_final)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Totale</p>
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-semibold">Voci del preventivo</p>
          {itemsQuery.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna voce</p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((it) => (
                <li key={it.id} className="py-3 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                    <p className="text-sm flex-1">{it.description}</p>
                    <p className="text-sm text-muted-foreground sm:text-right whitespace-nowrap">
                      {Number(it.quantity)} × {eur(it.unit_price_final)} ={" "}
                      <span className="font-medium text-foreground">
                        {eur(it.total_final)}
                      </span>
                    </p>
                  </div>
                  {it.notes && (
                    <p className="text-[12px] text-muted-foreground italic">
                      {it.notes}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {quote.terms_text && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-semibold">Termini e condizioni</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {quote.terms_text}
              </p>
            </div>
          </>
        )}

        {/* Desktop actions */}
        <div className="hidden sm:flex gap-2 justify-end pt-2">{actions}</div>
      </Card>

      {/* Mobile sticky actions */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] z-40 space-y-2 flex flex-col">
        {actions}
      </div>

      {/* Accept */}
      <AlertDialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accettare il preventivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Ti contatteremo via email per finalizzare il contratto. Una volta
              firmato, organizziamo l'evento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                decide.mutate({ decision: "accepted", notes: null });
              }}
            >
              Sì, accetta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rifiutare il preventivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione è definitiva. Se vuoi puoi dirci perché — ci aiuta a
              migliorare le proposte future.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="Cosa non funzionava in questo preventivo?"
            className="min-h-20"
            maxLength={2000}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                const t = rejectNotes.trim();
                decide.mutate({
                  decision: "rejected",
                  notes: t.length > 0 ? t : null,
                });
              }}
            >
              Sì, rifiuta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modification requested */}
      <Dialog open={modifyOpen} onOpenChange={setModifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cosa vorresti modificare?</DialogTitle>
            <DialogDescription>
              Scrivici quali aspetti del preventivo vorresti rivedere. Il nostro
              team preparerà una nuova versione.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={modifyNotes}
            onChange={(e) => setModifyNotes(e.target.value)}
            placeholder="Es. il budget è troppo alto, vorrei una versione senza il workshop X, le date proposte non funzionano…"
            className="min-h-32"
            maxLength={2000}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModifyOpen(false)}
              disabled={isPending}
            >
              Annulla
            </Button>
            <Button
              disabled={isPending || modifyNotes.trim().length < 10}
              onClick={() =>
                decide.mutate({
                  decision: "modification_requested",
                  notes: modifyNotes.trim(),
                })
              }
            >
              Invia richiesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
