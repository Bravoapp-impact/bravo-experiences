import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from "date-fns";
import { it } from "date-fns/locale";
import { ViewMode } from "./calendar-types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: ViewMode;
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onAddDate?: () => void;
}

export function CalendarHeader({ currentDate, viewMode, onDateChange, onViewModeChange, onAddDate }: CalendarHeaderProps) {
  const handlePrev = () => {
    if (viewMode === "month") onDateChange(subMonths(currentDate, 1));
    else if (viewMode === "week") onDateChange(subWeeks(currentDate, 1));
    else onDateChange(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === "month") onDateChange(addMonths(currentDate, 1));
    else if (viewMode === "week") onDateChange(addWeeks(currentDate, 1));
    else onDateChange(addDays(currentDate, 1));
  };

  const handleToday = () => onDateChange(new Date());

  const getLabel = () => {
    if (viewMode === "month") {
      return format(currentDate, "MMMM yyyy", { locale: it }).replace(/^./, c => c.toUpperCase());
    }
    if (viewMode === "day") {
      return format(currentDate, "EEEE d MMMM yyyy", { locale: it }).replace(/^./, c => c.toUpperCase());
    }
    // week
    const start = getWeekStart(currentDate);
    const end = addDays(start, 6);
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, "d", { locale: it })} – ${format(end, "d MMMM yyyy", { locale: it })}`;
    }
    return `${format(start, "d MMM", { locale: it })} – ${format(end, "d MMM yyyy", { locale: it })}`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleToday}>
          Oggi
        </Button>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-lg font-semibold text-foreground">{getLabel()}</h2>
      </div>
      <ToggleGroup
        type="single"
        value={viewMode}
        onValueChange={(v) => v && onViewModeChange(v as ViewMode)}
        className="bg-muted rounded-lg p-0.5"
      >
        <ToggleGroupItem value="month" className="text-xs px-3 h-7 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm">
          Mese
        </ToggleGroupItem>
        <ToggleGroupItem value="week" className="text-xs px-3 h-7 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm">
          Settimana
        </ToggleGroupItem>
        <ToggleGroupItem value="day" className="text-xs px-3 h-7 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm">
          Giorno
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  return new Date(d.setDate(diff));
}
