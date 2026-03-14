import { useMemo, useState } from "react";
import { format, isSameDay, isBefore, startOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarEvent, getEventColor, getEventBgColor } from "./calendar-types";
import { DayDetailPopover } from "./DayDetailPopover";

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventDeleted: () => void;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00-22:00
const HOUR_HEIGHT = 64;

export function DayView({ currentDate, events, onEventDeleted }: DayViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const isPast = isBefore(currentDate, startOfDay(new Date()));

  const dayEvents = useMemo(
    () => events.filter(ev => isSameDay(new Date(ev.start_datetime), currentDate)),
    [events, currentDate]
  );

  const getEventPosition = (ev: CalendarEvent) => {
    const start = new Date(ev.start_datetime);
    const end = new Date(ev.end_datetime);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const top = ((startMinutes - 360) / 60) * HOUR_HEIGHT;
    const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 32);
    return { top, height };
  };

  // Simple overlap layout
  const positioned = useMemo(() => {
    const sorted = [...dayEvents].sort((a, b) => 
      new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    );
    const columns: CalendarEvent[][] = [];
    const colMap = new Map<string, number>();

    sorted.forEach(ev => {
      const evStart = new Date(ev.start_datetime).getTime();
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const lastInCol = columns[c][columns[c].length - 1];
        if (new Date(lastInCol.end_datetime).getTime() <= evStart) {
          columns[c].push(ev);
          colMap.set(ev.id, c);
          placed = true;
          break;
        }
      }
      if (!placed) {
        colMap.set(ev.id, columns.length);
        columns.push([ev]);
      }
    });

    return { columns: columns.length, colMap };
  }, [dayEvents]);

  return (
    <div className={`border rounded-lg overflow-hidden bg-card ${isPast ? "opacity-50" : ""}`}>
      <div className="grid grid-cols-[60px_1fr] overflow-y-auto max-h-[600px]">
        {/* Time labels */}
        <div className="relative">
          {HOURS.map(h => (
            <div key={h} className="border-b flex items-start justify-end pr-2 pt-1" style={{ height: HOUR_HEIGHT }}>
              <span className="text-xs text-muted-foreground">{`${h}:00`}</span>
            </div>
          ))}
        </div>

        {/* Events column */}
        <div className="relative border-l">
          {HOURS.map(h => (
            <div key={h} className="border-b" style={{ height: HOUR_HEIGHT }} />
          ))}

          {dayEvents.map(ev => {
            const { top, height } = getEventPosition(ev);
            const color = getEventColor(ev.experience_id);
            const bgColor = getEventBgColor(ev.experience_id);
            const col = positioned.colMap.get(ev.id) || 0;
            const totalCols = positioned.columns;
            const width = `${100 / totalCols}%`;
            const left = `${(col * 100) / totalCols}%`;

            return (
              <DayDetailPopover
                key={ev.id}
                event={ev}
                open={popoverOpen && selectedEvent?.id === ev.id}
                onOpenChange={(open) => {
                  setPopoverOpen(open);
                  if (open) setSelectedEvent(ev);
                }}
                onDeleted={onEventDeleted}
              >
                <button
                  className="absolute rounded-md px-2 py-1 text-left overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  style={{
                    top, height, width, left,
                    backgroundColor: bgColor,
                    borderLeft: `3px solid ${color}`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs font-semibold truncate" style={{ color }}>{ev.experience_title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(ev.start_datetime), "HH:mm")} – {format(new Date(ev.end_datetime), "HH:mm")}
                  </p>
                  {height >= 50 && (
                    <p className="text-[10px] text-muted-foreground">
                      {ev.confirmed_count}/{ev.max_participants} partecipanti
                    </p>
                  )}
                </button>
              </DayDetailPopover>
            );
          })}
        </div>
      </div>
    </div>
  );
}
