import { Loader2, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";

interface HRMobileActionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isActive: boolean;
  isToggling: boolean;
  onToggle: () => void;
  upcomingDatesCount: number;
  defaultHours?: number | null;
}

/**
 * Mobile bottom-drawer for HR detail page.
 * Mirrors the visual pattern of MobileDateDrawer but contains only the
 * primary curation action + the same light info shown in the desktop sidebar.
 */
export function HRMobileActionDrawer({
  open,
  onOpenChange,
  isActive,
  isToggling,
  onToggle,
  upcomingDatesCount,
  defaultHours,
}: HRMobileActionDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[60vh]">
        <DrawerHeader>
          <DrawerTitle>
            {isActive ? "Nel tuo programma" : "Aggiungi al programma"}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isActive
              ? "Questa esperienza è attiva e visibile ai dipendenti della tua azienda."
              : "Attiva questa esperienza per renderla disponibile ai dipendenti della tua azienda."}
          </p>

          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>
                {upcomingDatesCount === 0
                  ? "Nessuna data programmata"
                  : upcomingDatesCount === 1
                  ? "1 data nei prossimi mesi"
                  : `${upcomingDatesCount} date nei prossimi mesi`}
              </span>
            </div>
            {defaultHours && defaultHours > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>Durata tipica: {defaultHours}h</span>
              </div>
            )}
          </div>
        </div>

        <DrawerFooter>
          <Button
            onClick={onToggle}
            disabled={isToggling}
            variant={isActive ? "outline" : "default"}
            className="w-full h-12 text-base font-medium rounded-xl"
          >
            {isToggling ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isActive ? (
              "Rimuovi dal programma"
            ) : (
              "Aggiungi al programma"
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
