import { useMemo, useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday, isBefore, startOfDay
} from "date-fns";
import { it } from "date-fns/locale";
import { CalendarEvent, ViewMode } from "./calendar-types";
import { EventBlock } from "./EventBlock";
import { DayDetailPopover, DayDetailPopoverMode } from "./DayDetailPopover";

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onViewModeChange: (mode: ViewMode) => void;
  onDateChange: (date: Date) => void;
  onEventDeleted?: () => void;
  popoverMode?: DayDetailPopoverMode;
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const MAX_VISIBLE = 2;

export function MonthView({ currentDate, events, onViewModeChange, onDateChange, onEventDeleted, popoverMode }: MonthViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(ev => {
      const key = format(new Date(ev.start_datetime), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    });
    return map;
  }, [events]);

  const now = startOfDay(new Date());

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) || [];
          const inMonth = isSameMonth(day, currentDate);
          const isPast = isBefore(day, now);
          const today = isToday(day);

          return (
            <div
              key={key}
              className={`min-h-[90px] sm:min-h-[110px] border-b border-r p-1 ${
                !inMonth ? "bg-muted/10" : ""
              } ${isPast ? "opacity-50" : ""}`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                  today ? "bg-primary text-primary-foreground" : inMonth ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {format(day, "d")}
                </span>
              </div>

              <div className="space-y-0.5">
                {dayEvents.slice(0, MAX_VISIBLE).map(ev => (
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
                    <div>
                      <EventBlock event={ev} compact />
                    </div>
                  </DayDetailPopover>
                ))}
                {dayEvents.length > MAX_VISIBLE && (
                  <button
                    className="text-[10px] text-muted-foreground font-medium px-1.5 hover:text-foreground"
                    onClick={() => {
                      onDateChange(day);
                      onViewModeChange("day");
                    }}
                  >
                    +{dayEvents.length - MAX_VISIBLE} in più
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
