import { Loader2, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HRSidebarProps {
  isActive: boolean;
  isToggling: boolean;
  onToggle: () => void;
  upcomingDatesCount: number;
  defaultHours?: number | null;
}

/**
 * Slim HR-side sidebar for the experience detail page.
 * Single primary action (add/remove from program) + light contextual info.
 * No booking management here — that lives in the future HR Calendar.
 */
export function HRSidebar({
  isActive,
  isToggling,
  onToggle,
  defaultHours,
}: HRSidebarProps) {
  return (
    <div className="border border-border rounded-2xl p-6 shadow-sm bg-card space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        {isActive ? "Nel tuo programma" : "Aggiungi al programma"}
      </h3>

      <p className="text-sm text-muted-foreground leading-relaxed">
        {isActive
          ? "Questa esperienza è attiva e visibile ai dipendenti della tua azienda."
          : "Attiva questa esperienza per renderla disponibile ai dipendenti della tua azienda."}
      </p>

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
          <>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi al programma
          </>
        )}
      </Button>

      {defaultHours && defaultHours > 0 && (
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>Questa attività ha una durata di {defaultHours} ore</span>
          </div>
        </div>
      )}
    </div>
  );
}
