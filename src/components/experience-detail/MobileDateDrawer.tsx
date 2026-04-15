import { Loader2, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { DateSlotCard } from "./DateSlotCard";
import type { ExperienceDate } from "@/types/experiences";

interface MobileDateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function MobileDateDrawer({
  open,
  onOpenChange,
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
}: MobileDateDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Date disponibili</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto space-y-4">
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
            <p className="text-sm text-muted-foreground text-center py-8">Caricamento date...</p>
          ) : dates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nessuna data disponibile al momento
            </p>
          ) : (
            <div className="space-y-2">
              {dates.map((date) => (
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
          )}
        </div>

        <DrawerFooter>
          <Button
            onClick={onBook}
            disabled={!selectedDateId || isBooking}
            className="w-full h-12 text-base font-medium rounded-xl"
          >
            {isBooking ? <Loader2 className="h-5 w-5 animate-spin" /> : "Prenota"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
