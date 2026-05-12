/**
 * QuoteEditor — editor preventivi TB super-admin.
 *
 * IMPORTANTE: tutte le scritture passano dalle RPC SECURITY DEFINER
 * (admin_save_tb_quote_draft, admin_send_tb_quote). NON usare
 * .from('tb_quotes') o .from('tb_quote_items') direttamente: il REVOKE
 * sulle colonne ets bloccherebbe il client e le transizioni di stato
 * non avverrebbero correttamente.
 *
 * Race condition: due super-admin sulla stessa quote → "last writer wins"
 * (advisory lock + DELETE/INSERT items in transazione lato RPC). Accettato.
 *
 * Reload durante invio: la RPC è atomica, al reload la fonte di verità
 * (status request) determina cosa renderizzare.
 */
import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Send, RotateCcw, FileText } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { devLog } from "@/lib/logger";
import {
  computeRowTotals,
  computeQuoteTotals,
  quoteDraftSchema,
  quoteSendSchema,
  QuoteFormValues,
} from "@/lib/tb-quote-schema";
import { TERMS_DEFAULT_TB, getDefaultValidUntil } from "@/lib/tb-defaults";
import { QuoteItemRow } from "./QuoteItemRow";
import { QuoteTotalsSummary } from "./QuoteTotalsSummary";
import { ClientModificationsPanel } from "./ClientModificationsPanel";

interface InitialProposalItem {
  proposal_id: string;
  description: string;
  quantity: number;
}

interface QuoteEditorProps {
  requestId: string;
  quoteId: string | null;
  initialProposalItems?: InitialProposalItem[];
  previousClientNotes?: string | null;
  previousDecidedAt?: string | null;
  previousQuoteId?: string | null;
}

const emptyItem = () => ({
  description: "",
  quantity: 1 as any,
  unit_price_ets: 0 as any,
  unit_price_final: 0 as any,
  proposal_id: null,
  association_id: null,
  notes: null,
});

export function QuoteEditor({
  requestId,
  quoteId,
  initialProposalItems,
  previousClientNotes,
  previousDecidedAt,
  previousQuoteId,
}: QuoteEditorProps) {
  const queryClient = useQueryClient();
  const [localQuoteId, setLocalQuoteId] = useState<string | null>(quoteId);
  useEffect(() => {
    if (quoteId) setLocalQuoteId(quoteId);
  }, [quoteId]);

  // Carica quote esistente (modalità modifica draft)
  const { data: existingQuote } = useQuery({
    queryKey: ["tb-quote-full", quoteId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_tb_quote_full_for_admin", { p_quote_id: quoteId! });
      if (error) throw error;
      return (data?.[0] ?? null) as any;
    },
    enabled: !!quoteId,
  });

  const { data: existingItems } = useQuery({
    queryKey: ["tb-quote-items", quoteId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_tb_quote_items_full_for_admin", { p_quote_id: quoteId! });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!quoteId,
  });

  const initialValues = useMemo<QuoteFormValues>(() => {
    if (quoteId && existingQuote) {
      return {
        valid_until: existingQuote.valid_until ?? getDefaultValidUntil(),
        terms_text: existingQuote.terms_text ?? TERMS_DEFAULT_TB,
        items:
          (existingItems ?? []).map((it) => ({
            id: it.id,
            proposal_id: it.proposal_id,
            association_id: it.association_id,
            description: it.description ?? "",
            quantity: it.quantity ?? 0,
            unit_price_ets: it.unit_price_ets ?? 0,
            unit_price_final: it.unit_price_final ?? 0,
            notes: it.notes,
          })) ?? [],
      };
    }
    if (!quoteId && initialProposalItems && initialProposalItems.length > 0) {
      return {
        valid_until: getDefaultValidUntil(),
        terms_text: TERMS_DEFAULT_TB,
        items: initialProposalItems.map((p) => ({
          description: p.description,
          quantity: p.quantity as any,
          unit_price_ets: 0 as any,
          unit_price_final: 0 as any,
          proposal_id: p.proposal_id,
          association_id: null,
          notes: null,
        })),
      };
    }
    return {
      valid_until: getDefaultValidUntil(),
      terms_text: TERMS_DEFAULT_TB,
      items: [emptyItem()],
    };
  }, [quoteId, existingQuote, existingItems, initialProposalItems]);

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteDraftSchema) as any,
    defaultValues: initialValues,
    mode: "onChange",
  });

  // Re-init quando arrivano i dati async
  useEffect(() => {
    form.reset(initialValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingQuote, existingItems]);

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // beforeunload guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [form.formState.isDirty]);

  const buildPayload = (values: QuoteFormValues) => {
    const totals = computeQuoteTotals(values.items);
    const items = values.items.map((it, idx) => {
      const r = computeRowTotals(it.quantity as number, it.unit_price_ets as number, it.unit_price_final as number);
      return {
        proposal_id: it.proposal_id ?? null,
        association_id: it.association_id ?? null,
        description: it.description ?? "",
        quantity: Number(it.quantity) || 0,
        unit_price_ets: Number(it.unit_price_ets) || 0,
        unit_price_final: Number(it.unit_price_final) || 0,
        total_ets: r.total_ets,
        total_final: r.total_final,
        notes: it.notes ?? null,
        display_order: idx,
      };
    });
    return {
      p_quote_id: localQuoteId,
      p_request_id: requestId,
      p_total_amount_final: totals.total_final,
      p_total_amount_ets: totals.total_ets,
      p_bravo_margin_amount: totals.margin_amount,
      p_bravo_margin_percent: totals.margin_percent,
      p_valid_until: values.valid_until,
      p_terms_text: values.terms_text,
      p_items: items,
    };
  };

  const saveDraftMutation = useMutation({
    mutationFn: async (values: QuoteFormValues) => {
      // Validazione minima: serve almeno una riga con description per evitare RPC failure
      const hasValidRow = values.items.some(
        (i) => (i.description ?? "").trim().length > 0 && Number(i.quantity) > 0,
      );
      if (!hasValidRow) {
        throw new Error("Serve almeno una voce con descrizione e quantità > 0 per salvare la bozza");
      }
      const payload = buildPayload(values);
      const { data, error } = await supabase.rpc("admin_save_tb_quote_draft", payload as any);
      if (error) throw error;
      return data as string;
    },
    onSuccess: (newQuoteId) => {
      setLocalQuoteId(newQuoteId);
      toast.success("Bozza salvata");
      form.reset(form.getValues(), { keepDirty: false });
      queryClient.invalidateQueries({ queryKey: ["super-admin-tb-request", requestId] });
      queryClient.invalidateQueries({ queryKey: ["tb-quote-full", newQuoteId] });
      queryClient.invalidateQueries({ queryKey: ["tb-quote-items", newQuoteId] });
      queryClient.invalidateQueries({ queryKey: ["tb-quote-history", requestId] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-tb-status-log", requestId] });
    },
    onError: (err: any) => {
      devLog.error("saveDraft error", err);
      toast.error("Errore salvataggio bozza", { description: err?.message ?? "Riprova" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (values: QuoteFormValues) => {
      // Validazione stretta
      const result = quoteSendSchema.safeParse(values);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          form.setError(issue.path.join(".") as any, { message: issue.message });
        });
        throw new Error(result.error.issues[0]?.message ?? "Validazione fallita");
      }
      // 1. Salva
      const payload = buildPayload(values);
      const { data: savedId, error: saveError } = await supabase.rpc("admin_save_tb_quote_draft", payload as any);
      if (saveError) throw saveError;
      if (savedId) setLocalQuoteId(savedId as string);
      // 2. Invia
      const { error: sendError } = await supabase.rpc("admin_send_tb_quote", { p_quote_id: savedId });
      if (sendError) throw sendError;
      return savedId as string;
    },
    onSuccess: () => {
      toast.success("Preventivo inviato al cliente");
      form.reset(form.getValues(), { keepDirty: false });
      queryClient.invalidateQueries({ queryKey: ["super-admin-tb-request", requestId] });
      queryClient.invalidateQueries({ queryKey: ["tb-quote-history", requestId] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-tb-status-log", requestId] });
    },
    onError: (err: any) => {
      devLog.error("send error", err);
      toast.error("Errore invio preventivo", { description: err?.message ?? "Riprova" });
    },
  });

  const isPending = saveDraftMutation.isPending || sendMutation.isPending;

  const handleClear = () => {
    replace([emptyItem()]);
    toast.info("Voci azzerate");
  };

  return (
    <div className="space-y-4">
      {previousClientNotes && (
        <ClientModificationsPanel
          notes={previousClientNotes}
          decidedAt={previousDecidedAt ?? null}
          previousQuoteId={previousQuoteId ?? null}
        />
      )}

      <Form {...form}>
        <form className="space-y-4">
          {/* Header info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {quoteId
                  ? `Preventivo v${existingQuote?.version ?? "…"}`
                  : "Nuovo preventivo"}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valid_until"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validità preventivo</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Voci del preventivo</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append(emptyItem())}
                disabled={isPending}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Aggiungi voce
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nessuna voce. Clicca "Aggiungi voce" per iniziare.
                </p>
              ) : (
                fields.map((f, idx) => (
                  <QuoteItemRow
                    key={f.id}
                    control={form.control}
                    index={idx}
                    onRemove={() => remove(idx)}
                    disabled={isPending}
                  />
                ))
              )}
              <QuoteTotalsSummary control={form.control} />
            </CardContent>
          </Card>

          {/* Terms */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Termini e condizioni</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="terms_text"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        rows={8}
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                        className="font-mono text-xs"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" size="sm" disabled={isPending}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Svuota e ricomincia
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent style={{ zIndex: 200 }}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tutte le voci verranno rimosse e sostituite con una riga vuota. Le modifiche non salvate andranno perse.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClear}>Conferma</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => saveDraftMutation.mutate(form.getValues())}
                disabled={isPending}
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {saveDraftMutation.isPending ? "Salvataggio…" : "Salva bozza"}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" disabled={isPending}>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Invia al cliente
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent style={{ zIndex: 200 }}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Inviare il preventivo al cliente?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Stai per inviare il preventivo al cliente. Dopo l'invio non potrai più modificarlo: per cambiare qualcosa dovrai creare una nuova versione.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction onClick={() => sendMutation.mutate(form.getValues())}>
                      {sendMutation.isPending ? "Invio…" : "Conferma e invia"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
