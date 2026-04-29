import { Control, useWatch } from "react-hook-form";
import { computeQuoteTotals, eurFmt, formatPercent, QuoteFormValues } from "@/lib/tb-quote-schema";

interface QuoteTotalsSummaryProps {
  control: Control<QuoteFormValues>;
}

export function QuoteTotalsSummary({ control }: QuoteTotalsSummaryProps) {
  const items = useWatch({ control, name: "items" }) ?? [];
  const totals = computeQuoteTotals(items as any);

  return (
    <div className="rounded-md border bg-muted/30 p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
      <Stat label="Totale cliente" value={eurFmt.format(totals.total_final)} accent />
      <Stat label="Totale ETS" value={eurFmt.format(totals.total_ets)} />
      <Stat label="Margine Bravo!" value={eurFmt.format(totals.margin_amount)} />
      <Stat label="Margine %" value={formatPercent(totals.margin_percent)} />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`tabular-nums font-semibold ${accent ? "text-base text-primary" : "text-sm"}`}>{value}</p>
    </div>
  );
}
