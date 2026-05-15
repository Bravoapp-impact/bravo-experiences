import { Link } from "react-router-dom";
import { Users } from "lucide-react";

export interface HRSidebarDate {
  id: string;
  start_datetime: string;
  end_datetime: string | null;
  bookings_count: number;
}

interface HRSidebarProps {
  dates: HRSidebarDate[];
  defaultHours?: number | null;
}

const dateFmt = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const timeFmt = new Intl.DateTimeFormat("it-IT", {
  hour: "2-digit",
  minute: "2-digit",
});

function pluralIscritti(n: number): string {
  if (n === 1) return "1 iscritto";
  return `${n} iscritti`;
}

const MAX_VISIBLE = 6;

/**
 * Sidebar informativa stile Airbnb per la pagina dettaglio HR.
 * Mostra le prossime date dell'esperienza con il numero di iscritti.
 * Nessuna azione di curation: l'HR vede, il team Bravo! gestisce.
 */
export function HRSidebar({ dates, defaultHours }: HRSidebarProps) {
  const visible = dates.slice(0, MAX_VISIBLE);
  const hidden = Math.max(0, dates.length - MAX_VISIBLE);

  return (
    <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <h3 className="text-base font-semibold text-foreground">Prossime date</h3>
        {defaultHours && defaultHours > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Durata {defaultHours} {defaultHours === 1 ? "ora" : "ore"}
          </p>
        )}
      </div>

      {dates.length === 0 ? (
        <div className="border-t border-border/60 px-6 py-8 text-center text-sm text-muted-foreground">
          Nessuna data programmata
        </div>
      ) : (
        <div className="border-t border-border/60 divide-y divide-border/60">
          {visible.map((d) => {
            const start = new Date(d.start_datetime);
            const end = d.end_datetime ? new Date(d.end_datetime) : null;
            const dateLabel = dateFmt.format(start);
            const timeLabel = end
              ? `${timeFmt.format(start)}–${timeFmt.format(end)}`
              : timeFmt.format(start);
            const count = d.bookings_count;

            return (
              <div
                key={d.id}
                className="px-6 py-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-foreground capitalize truncate">
                    {dateLabel}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {timeLabel}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1.5 text-sm shrink-0 ${
                    count > 0 ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>{pluralIscritti(count)}</span>
                </div>
              </div>
            );
          })}

          {hidden > 0 && (
            <Link
              to="/hr/calendario"
              className="block px-6 py-3 text-sm text-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
              Vedi tutte ({dates.length})
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
