import { useMemo, useState } from "react";
import { startOfWeek, addDays, format, isSameDay, isToday, isBefore, startOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarEvent, getEventColor, getEventBgColor } from "./calendar-types";
import { DayDetailPopover, DayDetailPopoverMode } from "./DayDetailPopover";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventDeleted?: () => void;
  popoverMode?: DayDetailPopoverMode;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00-22:00
const HOUR_HEIGHT = 60; // px per hour

export function WeekView({ currentDate, events, onEventDeleted, popoverMode }: WeekViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const now = startOfDay(new Date());

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const getEventsByDay = (day: Date) =>
    events.filter(ev => isSameDay(new Date(ev.start_datetime), day));

  const getEventPosition = (ev: CalendarEvent) => {
    const start = new Date(ev.start_datetime);
    const end = new Date(ev.end_datetime);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const top = ((startMinutes - 360) / 60) * HOUR_HEIGHT; // 360 = 6*60
    const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 24);
    return { top, height };
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card h-full flex flex-col">
      {/* Header */}
      <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b bg-muted/30">
        <div />
        {weekDays.map(day => (
          <div key={day.toISOString()} className="text-center py-2 border-l">
            <div className="text-[10px] text-muted-foreground uppercase">
              {format(day, "EEE", { locale: it })}
            </div>
            <div className={`text-sm font-semibold w-7 h-7 mx-auto flex items-center justify-center rounded-full ${
              isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"
            }`}>
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[50px_repeat(7,1fr)] overflow-y-auto max-h-[600px]">
        {/* Time labels */}
        <div className="relative">
          {HOURS.map(h => (
            <div key={h} className="border-b flex items-start justify-end pr-2 pt-0.5" style={{ height: HOUR_HEIGHT }}>
              <span className="text-[10px] text-muted-foreground">{`${h}:00`}</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map(day => {
          const dayEvents = getEventsByDay(day);
          const isPast = isBefore(day, now);

          return (
            <div
              key={day.toISOString()}
              className={`relative border-l ${isPast ? "opacity-40" : ""}`}
            >
              {HOURS.map(h => (
                <div key={h} className="border-b" style={{ height: HOUR_HEIGHT }} />
              ))}

              {/* Events */}
              {dayEvents.map(ev => {
                const { top, height } = getEventPosition(ev);
                const color = getEventColor(ev.experience_id);
                const bgColor = getEventBgColor(ev.experience_id);

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
                    mode={popoverMode}
                  >
                    <button
                      className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-left overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ top, height: Math.max(height, 24), backgroundColor: bgColor, borderLeft: `3px solid ${color}` }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-[10px] font-semibold truncate" style={{ color }}>{ev.experience_title}</p>
                      {height >= 40 && (
                        <p className="text-[9px] text-muted-foreground">
                          {format(new Date(ev.start_datetime), "HH:mm")}–{format(new Date(ev.end_datetime), "HH:mm")}
                        </p>
                      )}
                    </button>
                  </DayDetailPopover>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
