import { Trash2 } from "lucide-react";
import { Control, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { computeRowTotals, eurFmt, formatPercent, QuoteFormValues } from "@/lib/tb-quote-schema";

interface QuoteItemRowProps {
  control: Control<QuoteFormValues>;
  index: number;
  onRemove: () => void;
  disabled?: boolean;
}

export function QuoteItemRow({ control, index, onRemove, disabled }: QuoteItemRowProps) {
  const row = useWatch({ control, name: `items.${index}` });
  const totals = computeRowTotals(row?.quantity as number, row?.unit_price_ets as number, row?.unit_price_final as number);

  return (
    <div className="rounded-md border bg-card p-3 space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <FormField
            control={control}
            name={`items.${index}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">Descrizione</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Es. Workshop di team building outdoor"
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          className="text-muted-foreground hover:text-destructive mt-6"
          aria-label="Rimuovi voce"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <FormField
          control={control}
          name={`items.${index}.quantity`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">Quantità</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="decimal"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`items.${index}.unit_price_ets`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">Prezzo unit. ETS</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={disabled}
                    className="pl-6"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`items.${index}.unit_price_final`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">Prezzo unit. cliente</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={disabled}
                    className="pl-6"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <p className="text-xs text-muted-foreground mb-2">Totale cliente</p>
          <p className="text-sm font-medium tabular-nums h-9 flex items-center">{eurFmt.format(totals.total_final)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Margine</p>
          <p className="text-sm font-medium tabular-nums h-9 flex items-center">
            {eurFmt.format(totals.margin_amount)}
            <span className="ml-1 text-xs text-muted-foreground">({formatPercent(totals.margin_percent)})</span>
          </p>
        </div>
      </div>
    </div>
  );
}
