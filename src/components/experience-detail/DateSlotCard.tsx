import { Users } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { ExperienceDate } from "@/types/experiences";

interface DateSlotCardProps {
  date: ExperienceDate;
  isSelected: boolean;
  isBookedByUser: boolean;
  exceedsBudget: boolean;
  onSelect: (id: string) => void;
}

export function DateSlotCard({
  date,
  isSelected,
  isBookedByUser,
  exceedsBudget,
  onSelect,
}: DateSlotCardProps) {
  const availableSpots = date.max_participants - (date.confirmed_count || 0);
  const isFull = availableSpots <= 0;
  const isDisabled = isFull || isBookedByUser || exceedsBudget;

  return (
    <button
      disabled={isDisabled}
      onClick={() => onSelect(date.id)}
      className={cn(
        "w-full p-4 rounded-xl border text-left transition-all",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:bg-muted/30",
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground capitalize">
            {format(new Date(date.start_datetime), "EEE d MMMM", { locale: it })}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(date.start_datetime), "HH:mm")} –{" "}
            {format(new Date(date.end_datetime), "HH:mm")}
          </p>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          {isBookedByUser ? (
            <span className="text-primary font-medium text-xs">✓ Prenotato</span>
          ) : exceedsBudget ? (
            <span className="text-destructive font-medium text-xs">Ore insufficienti</span>
          ) : isFull ? (
            <span className="text-muted-foreground font-medium text-xs">Tutto esaurito</span>
          ) : (
            <>
              <Users className="h-3.5 w-3.5" />
              <span className={cn("text-xs", availableSpots <= 3 && "text-destructive font-medium")}>
                {availableSpots} posti
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
