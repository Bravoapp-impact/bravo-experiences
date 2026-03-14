import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarEvent, getEventColor } from "./calendar-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trash2, Users, Clock, X, Pencil } from "lucide-react";
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
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const color = getEventColor(event.experience_id);

  const start = new Date(event.start_datetime);
  const end = new Date(event.end_datetime);

  const [startTime, setStartTime] = useState(format(start, "HH:mm"));
  const [endTime, setEndTime] = useState(format(end, "HH:mm"));
  const [maxParts, setMaxParts] = useState(event.max_participants);

  const diffHours = ((end.getTime() - start.getTime()) / 3600000).toFixed(1);

  const resetEdit = () => {
    setStartTime(format(start, "HH:mm"));
    setEndTime(format(end, "HH:mm"));
    setMaxParts(event.max_participants);
    setIsEditing(false);
  };

  const handleUpdate = async () => {
    const dateStr = format(start, "yyyy-MM-dd");
    const newStart = new Date(`${dateStr}T${startTime}:00`);
    const newEnd = new Date(`${dateStr}T${endTime}:00`);

    if (newEnd <= newStart) {
      toast({ variant: "destructive", title: "L'orario di fine deve essere dopo l'inizio" });
      return;
    }
    if (maxParts < 1) {
      toast({ variant: "destructive", title: "Minimo 1 partecipante" });
      return;
    }

    setSaving(true);
    try {
      const volunteerHours = (newEnd.getTime() - newStart.getTime()) / 3600000;
      const { error } = await supabase
        .from("experience_dates")
        .update({
          start_datetime: newStart.toISOString(),
          end_datetime: newEnd.toISOString(),
          max_participants: maxParts,
          volunteer_hours: volunteerHours,
        })
        .eq("id", event.id);

      if (error) throw error;
      toast({ title: "Data aggiornata" });
      setIsEditing(false);
      onOpenChange(false);
      onDeleted(); // triggers refetch
    } catch (e: any) {
      toast({ variant: "destructive", title: "Errore", description: e.message });
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <>
      <Popover open={open} onOpenChange={(v) => { if (!v) resetEdit(); onOpenChange(v); }}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start" sideOffset={4} onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <div className="p-3 space-y-3">
            {/* Header */}
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
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={(e) => { e.stopPropagation(); onOpenChange(false); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {isEditing ? (
              /* Edit mode */
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Inizio</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fine</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max partecipanti</Label>
                  <Input
                    type="number"
                    min={1}
                    value={maxParts}
                    onChange={(e) => setMaxParts(Number(e.target.value) || 1)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 h-8 text-xs" onClick={handleUpdate} disabled={saving}>
                    {saving ? "Salvataggio..." : "Salva"}
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={resetEdit} disabled={saving}>
                    Annulla
                  </Button>
                </div>
              </div>
            ) : (
              /* View mode */
              <>
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

                <div className="border-t pt-2 space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 text-xs"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Modifica data
                  </Button>
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
              </>
            )}
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
