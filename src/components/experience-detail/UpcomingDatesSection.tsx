import { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export interface UpcomingDateItem {
  id: string;
  start_datetime: string;
  end_datetime: string;
  volunteer_hours?: number | null;
}

interface UpcomingDatesSectionProps {
  dates: UpcomingDateItem[];
}

/**
 * Read-only section that lists upcoming dates for an experience.
 * Used in contexts where the user is not booking (HR, association preview).
 * No participant counts, no actions — purely informational.
 */
export function UpcomingDatesSection({ dates }: UpcomingDatesSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL = 5;
  const displayed = showAll ? dates : dates.slice(0, INITIAL);
  const hasMore = dates.length > INITIAL;

  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-4">Quando si svolge</h2>

      {dates.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          Nessuna data programmata al momento
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {displayed.map((d) => {
              const start = new Date(d.start_datetime);
              const end = new Date(d.end_datetime);
              const dayLabel = format(start, "EEEE d MMMM yyyy", { locale: it });
              const timeLabel = `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`;
              const hours = d.volunteer_hours ? Number(d.volunteer_hours) : null;

              return (
                <li
                  key={d.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50"
                >
                  <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground capitalize">
                      {dayLabel}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{timeLabel}</span>
                      {hours && hours > 0 && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {hours}h
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {hasMore && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-3 text-sm font-semibold text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              Mostra tutte le {dates.length} date
            </button>
          )}
        </>
      )}
    </section>
  );
}
