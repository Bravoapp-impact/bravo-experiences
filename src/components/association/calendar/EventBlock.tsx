import { format } from "date-fns";
import { CalendarEvent, getEventColor, getEventBgColor } from "./calendar-types";

interface EventBlockProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: (event: CalendarEvent) => void;
  style?: React.CSSProperties;
  className?: string;
}

export function EventBlock({ event, compact = false, onClick, style, className = "" }: EventBlockProps) {
  const color = getEventColor(event.experience_id);
  const bgColor = getEventBgColor(event.experience_id);
  const startTime = format(new Date(event.start_datetime), "HH:mm");
  const endTime = format(new Date(event.end_datetime), "HH:mm");

  if (compact) {
    return (
      <button
        onClick={() => onClick?.(event)}
        className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] leading-tight truncate font-medium cursor-pointer hover:opacity-80 transition-opacity ${className}`}
        style={{ backgroundColor: bgColor, color, borderLeft: `3px solid ${color}`, ...style }}
        title={`${event.experience_title} (${startTime}–${endTime})`}
      >
        <span className="font-semibold">{startTime}</span>{" "}
        <span className="hidden sm:inline">{event.experience_title}</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => onClick?.(event)}
      className={`w-full text-left px-2 py-1.5 rounded-md cursor-pointer hover:opacity-90 transition-opacity overflow-hidden ${className}`}
      style={{ backgroundColor: bgColor, borderLeft: `3px solid ${color}`, ...style }}
    >
      <p className="text-xs font-semibold truncate" style={{ color }}>
        {event.experience_title}
      </p>
      <p className="text-[10px] text-muted-foreground">
        {startTime} – {endTime} · {event.confirmed_count}/{event.max_participants}
      </p>
    </button>
  );
}
