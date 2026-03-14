import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarEvent, getEventColor } from "./calendar-types";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trash2, Users, Clock, X } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DayDetailPopoverProps {
  event: CalendarEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
  children: React.ReactNode;
}

export function DayDetailPopover({ event, open, onOpenChange, onDeleted, children }: DayDetailPopoverProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const color = getEventColor(event.experience_id);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("experience_dates").delete().eq("id", event.id);
      if (error) throw error;
      toast({ title: "Data eliminata" });
      onOpenChange(false);
      onDeleted();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Errore", description: e.message });
    } finally {
      setDeleting(false);
    }
  };

  const start = new Date(event.start_datetime);
  const end = new Date(event.end_datetime);
  const diffHours = ((end.getTime() - start.getTime()) / 3600000).toFixed(1);

  return (
    <>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start" sideOffset={4}>
          <div className="p-3 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <div className="w-3 h-3 rounded-sm mt-0.5 flex-shrink-0" style={{ backgroundColor: color }} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{event.experience_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(start, "EEEE d MMMM", { locale: it }).replace(/^./, c => c.toUpperCase())}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => onOpenChange(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{format(start, "HH:mm")} – {format(end, "HH:mm")} ({diffHours}h)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{event.confirmed_count}/{event.max_participants} partecipanti</span>
              </div>
            </div>

            <div className="border-t pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Elimina data
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa data?</AlertDialogTitle>
            <AlertDialogDescription>
              {event.confirmed_count > 0
                ? `Ci sono ${event.confirmed_count} prenotazioni confermate. L'eliminazione non può essere annullata.`
                : "Questa azione non può essere annullata."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
