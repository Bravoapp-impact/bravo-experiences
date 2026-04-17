import { Loader2, Clock } from "lucide-react";
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

          {defaultHours && defaultHours > 0 && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>Questa attività ha una durata di {defaultHours} ore</span>
              </div>
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button
            onClick={onToggle}
            disabled={isToggling}
            variant="outline"
            className={
              isActive
                ? "w-full h-12 text-base font-medium rounded-xl border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                : "w-full h-12 text-base font-medium rounded-xl border-success/30 bg-success/10 text-success hover:bg-success/15 hover:text-success"
            }
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
