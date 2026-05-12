import { Calendar, MapPin, Users, Wallet } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Card } from "@/components/ui/card";

interface TBRequest {
  participants_min?: number | null;
  participants_max?: number | null;
  preferred_period_from?: string | null;
  preferred_period_to?: string | null;
  budget_estimate?: number | string | null;
  notes?: string | null;
  extra_services?: unknown;
}

interface Props {
  request: TBRequest;
}

export function TBRequestBriefSummary({ request }: Props) {
  const extra = (request.extra_services as Record<string, unknown>) || {};
  const places = (extra.places as string[] | undefined) || [];

  const items: { icon: typeof Users; label: string; value: string }[] = [];
  if (request.participants_min && request.participants_max) {
    items.push({
      icon: Users,
      label: "Partecipanti",
      value: `${request.participants_min}–${request.participants_max}`,
    });
  }
  if (request.preferred_period_from && request.preferred_period_to) {
    items.push({
      icon: Calendar,
      label: "Periodo",
      value: `${format(new Date(request.preferred_period_from), "MMM", { locale: it })} – ${format(
        new Date(request.preferred_period_to),
        "MMM yyyy",
        { locale: it }
      )}`,
    });
  }
  if (places.length > 0) {
    items.push({ icon: MapPin, label: "Luoghi", value: places.join(", ") });
  }
  if (request.budget_estimate) {
    items.push({
      icon: Wallet,
      label: "Budget",
      value: `€${Number(request.budget_estimate).toLocaleString("it-IT")}`,
    });
  }

  if (items.length === 0 && !request.notes) return null;

  return (
    <Card className="p-5">
      <h3 className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wide">
        Riepilogo brief
      </h3>
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {items.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-2">
              <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-sm font-medium truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {request.notes && (
        <p className="text-[13px] text-muted-foreground italic mt-4 pt-4 border-t border-border/50">
          {request.notes}
        </p>
      )}
    </Card>
  );
}
