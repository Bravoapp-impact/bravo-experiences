import { z } from "zod";

/**
 * Schemi di validazione per l'editor preventivi TB.
 *
 * Due schemi: draft (permissivo) e send (stretto).
 * Il form usa zodResolver(quoteDraftSchema); l'invio chiama esplicitamente
 * quoteSendSchema.safeParse() prima di lanciare la mutation.
 */

// Coerce numerico che accetta virgola italiana
const numericStringToNumber = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const normalized = v.replace(",", ".").trim();
    const n = Number(normalized);
    return Number.isFinite(n) ? n : v;
  }
  return v;
}, z.number());

export const quoteItemDraftSchema = z.object({
  id: z.string().uuid().optional(),
  proposal_id: z.string().uuid().nullable().optional(),
  association_id: z.string().uuid().nullable().optional(),
  description: z.string().trim().max(500, "Massimo 500 caratteri"),
  quantity: numericStringToNumber.refine((n) => n >= 0, "Deve essere >= 0").default(1),
  unit_price_ets: numericStringToNumber.refine((n) => n >= 0, "Deve essere >= 0").default(0),
  unit_price_final: numericStringToNumber.refine((n) => n >= 0, "Deve essere >= 0").default(0),
  notes: z.string().max(1000).nullable().optional(),
});

export const quoteDraftSchema = z.object({
  valid_until: z.string().nullable(),
  terms_text: z.string().max(10000),
  items: z.array(quoteItemDraftSchema),
});

export type QuoteFormValues = z.infer<typeof quoteDraftSchema>;
export type QuoteItemFormValue = z.infer<typeof quoteItemDraftSchema>;

// Schema stretto per "Invia al cliente"
export const quoteItemSendSchema = quoteItemDraftSchema.extend({
  description: z.string().trim().min(1, "Descrizione obbligatoria").max(500),
  quantity: numericStringToNumber.refine((n) => n > 0, "Quantità deve essere > 0"),
  unit_price_final: numericStringToNumber.refine((n) => n >= 0, "Deve essere >= 0"),
  unit_price_ets: numericStringToNumber.refine((n) => n >= 0, "Deve essere >= 0"),
});

export const quoteSendSchema = quoteDraftSchema
  .extend({
    valid_until: z
      .string()
      .min(1, "Data di validità obbligatoria")
      .refine((d) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(d) >= today;
      }, "Deve essere oggi o futura"),
    items: z.array(quoteItemSendSchema).min(1, "Aggiungi almeno una voce"),
  })
  .refine(
    (v) => v.items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unit_price_final) || 0), 0) > 0,
    { message: "Il totale finale deve essere maggiore di zero", path: ["items"] },
  );

// Helpers calcoli
export function computeRowTotals(qty: number | undefined, unitEts: number | undefined, unitFinal: number | undefined) {
  const q = Number(qty) || 0;
  const ets = Number(unitEts) || 0;
  const fin = Number(unitFinal) || 0;
  const total_ets = q * ets;
  const total_final = q * fin;
  const margin_amount = total_final - total_ets;
  const margin_percent = total_final > 0 ? (margin_amount / total_final) * 100 : null;
  return { total_ets, total_final, margin_amount, margin_percent };
}

export function computeQuoteTotals(items: Array<Partial<QuoteItemFormValue>>) {
  let total_final = 0;
  let total_ets = 0;
  for (const it of items) {
    const r = computeRowTotals(it.quantity as number, it.unit_price_ets as number, it.unit_price_final as number);
    total_final += r.total_final;
    total_ets += r.total_ets;
  }
  const margin_amount = total_final - total_ets;
  const margin_percent = total_final > 0 ? (margin_amount / total_final) * 100 : null;
  return { total_final, total_ets, margin_amount, margin_percent };
}

export const eurFmt = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPercent(p: number | null | undefined): string {
  if (p === null || p === undefined || !Number.isFinite(p)) return "—";
  return `${p.toFixed(1)}%`;
}
