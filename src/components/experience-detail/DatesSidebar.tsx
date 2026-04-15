import { useState } from "react";
import { Loader2, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DateSlotCard } from "./DateSlotCard";
import type { ExperienceDate } from "@/types/experiences";

interface DatesSidebarProps {
  dates: ExperienceDate[];
  loading: boolean;
  selectedDateId: string | null;
  onSelectDate: (id: string) => void;
  onBook: () => void;
  isBooking: boolean;
  userBookedDateIds: Set<string>;
  remainingHours: number;
  isUnlimited: boolean;
  budgetHours: number;
}

export function DatesSidebar({
  dates,
  loading,
  selectedDateId,
  onSelectDate,
  onBook,
  isBooking,
  userBookedDateIds,
  remainingHours,
  isUnlimited,
  budgetHours,
}: DatesSidebarProps) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? dates : dates.slice(0, 5);
  const hasMore = dates.length > 5;

  return (
    <div className="sticky top-8 self-start">
      <div className="border border-border rounded-2xl p-6 shadow-sm bg-card space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Date disponibili</h3>

        {/* Budget banner */}
        {!isUnlimited && (
          <div>
            {remainingHours <= 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>Hai esaurito le {budgetHours} ore disponibili</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted text-sm text-muted-foreground">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>
                  Ore rimanenti: <strong className="text-foreground">{remainingHours}</strong> / {budgetHours}
                </span>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : dates.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nessuna data disponibile al momento
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {displayed.map((date) => (
                <DateSlotCard
                  key={date.id}
                  date={date}
                  isSelected={selectedDateId === date.id}
                  isBookedByUser={userBookedDateIds.has(date.id)}
                  exceedsBudget={
                    !isUnlimited && (Number(date.volunteer_hours) || 0) > remainingHours
                  }
                  onSelect={onSelectDate}
                />
              ))}
            </div>
            {hasMore && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="text-sm font-semibold text-foreground underline underline-offset-4 hover:text-primary transition-colors"
              >
                Mostra tutte le {dates.length} date
              </button>
            )}
          </>
        )}

        <Button
          onClick={onBook}
          disabled={!selectedDateId || isBooking}
          className="w-full h-12 text-base font-medium rounded-xl"
        >
          {isBooking ? <Loader2 className="h-5 w-5 animate-spin" /> : "Prenota"}
        </Button>
      </div>
    </div>
  );
}
