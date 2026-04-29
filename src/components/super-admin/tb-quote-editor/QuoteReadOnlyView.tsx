import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { eurFmt, formatPercent } from "@/lib/tb-quote-schema";

interface QuoteRecord {
  id: string;
  version: number;
  status: string;
  total_amount_final: number | null;
  total_amount_ets: number | null;
  bravo_margin_amount?: number | null;
  bravo_margin_percent?: number | null;
  valid_until?: string | null;
  terms_text?: string | null;
  sent_at?: string | null;
  decided_at?: string | null;
  client_decision_notes?: string | null;
}

interface QuoteItemRecord {
  id: string;
  description: string;
  quantity: number;
  unit_price_ets: number | null;
  unit_price_final: number | null;
  total_ets: number | null;
  total_final: number | null;
  notes: string | null;
}

interface QuoteReadOnlyViewProps {
  quote: QuoteRecord;
  items: QuoteItemRecord[];
  hideHeader?: boolean;
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

export function QuoteReadOnlyView({ quote, items, hideHeader }: QuoteReadOnlyViewProps) {
  const fmtDate = (d: string | null | undefined) =>
    d ? format(new Date(d), "d MMM yyyy", { locale: it }) : "—";

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Preventivo v{quote.version}</CardTitle>
              <Badge variant="outline">{statusLabel[quote.status] ?? quote.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Field label="Totale cliente" value={eurFmt.format(Number(quote.total_amount_final ?? 0))} accent />
            <Field label="Totale ETS" value={eurFmt.format(Number(quote.total_amount_ets ?? 0))} />
            <Field
              label="Margine"
              value={`${eurFmt.format(Number(quote.bravo_margin_amount ?? 0))} (${formatPercent(quote.bravo_margin_percent ?? null)})`}
            />
            <Field label="Validità" value={fmtDate(quote.valid_until)} />
            <Field label="Inviato" value={fmtDate(quote.sent_at)} />
            <Field label="Decisione" value={fmtDate(quote.decided_at)} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Voci del preventivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna voce.</p>
          ) : (
            items.map((it) => (
              <div key={it.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{it.description}</p>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-muted-foreground">
                  <div>Q.tà: <span className="text-foreground">{it.quantity}</span></div>
                  <div>P. unit. ETS: <span className="text-foreground">{eurFmt.format(Number(it.unit_price_ets ?? 0))}</span></div>
                  <div>P. unit. cliente: <span className="text-foreground">{eurFmt.format(Number(it.unit_price_final ?? 0))}</span></div>
                  <div>Tot. ETS: <span className="text-foreground">{eurFmt.format(Number(it.total_ets ?? 0))}</span></div>
                  <div>Tot. cliente: <span className="text-foreground font-medium">{eurFmt.format(Number(it.total_final ?? 0))}</span></div>
                </div>
                {it.notes && <p className="mt-2 text-xs italic text-muted-foreground">{it.notes}</p>}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {quote.terms_text && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Termini e condizioni</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs whitespace-pre-line text-muted-foreground">{quote.terms_text}</p>
          </CardContent>
        </Card>
      )}

      {quote.client_decision_notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Note del cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">{quote.client_decision_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={`tabular-nums ${accent ? "font-semibold text-primary" : ""}`}>{value}</p>
    </div>
  );
}
