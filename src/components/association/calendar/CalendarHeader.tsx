import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from "date-fns";
import { it } from "date-fns/locale";
import { ViewMode } from "./calendar-types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: ViewMode;
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onAddDate?: () => void;
  experiences?: { id: string; title: string }[];
  onExperiencePicked?: (exp: { id: string; title: string }) => void;
}

export function CalendarHeader({ currentDate, viewMode, onDateChange, onViewModeChange, onAddDate, experiences = [], onExperiencePicked }: CalendarHeaderProps) {
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
      <div className="flex items-center gap-2">
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
        {onAddDate && experiences.length <= 1 && (
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={onAddDate}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
        {onExperiencePicked && experiences.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-7 w-7">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {experiences.map(exp => (
                <DropdownMenuItem key={exp.id} onClick={() => onExperiencePicked(exp)}>
                  {exp.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  return new Date(d.setDate(diff));
}
