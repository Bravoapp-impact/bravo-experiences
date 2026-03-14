import { useState, useEffect, useCallback } from "react";
import { BaseModal } from "@/components/common/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { devLog } from "@/lib/logger";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarIcon, Loader2, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface ExperienceDate {
  id: string;
  start_datetime: string;
  end_datetime: string;
  max_participants: number;
  volunteer_hours: number | null;
}

interface ManageDatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experienceId: string;
  experienceTitle: string;
  defaultMaxParticipants: number | null;
}

export function ManageDatesDialog({
  open,
  onOpenChange,
  experienceId,
  experienceTitle,
  defaultMaxParticipants,
}: ManageDatesDialogProps) {
  const [dates, setDates] = useState<ExperienceDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExperienceDate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("13:00");

  const computeHours = useCallback(() => {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
    return diff > 0 ? Math.round(diff * 10) / 10 : 0;
  }, [startTime, endTime]);

  const fetchDates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("experience_dates")
        .select("id, start_datetime, end_datetime, max_participants, volunteer_hours")
        .eq("experience_id", experienceId)
        .gte("start_datetime", new Date().toISOString())
        .order("start_datetime", { ascending: true });

      if (error) {
        devLog.error("Error fetching experience dates:", error);
        return;
      }
      setDates(data || []);
    } catch (err) {
      devLog.error("Unexpected error fetching dates:", err);
    } finally {
      setLoading(false);
    }
  }, [experienceId]);

  useEffect(() => {
    if (open) {
      fetchDates();
      setSelectedDate(undefined);
      setStartTime("09:00");
      setEndTime("13:00");
    }
  }, [open, fetchDates]);

  const handleAdd = async () => {
    if (!selectedDate) {
      toast({ variant: "destructive", title: "Errore", description: "Seleziona una data" });
      return;
    }
    if (!startTime || !endTime) {
      toast({ variant: "destructive", title: "Errore", description: "Inserisci ora di inizio e fine" });
      return;
    }

    const hours = computeHours();
    if (hours <= 0) {
      toast({ variant: "destructive", title: "Errore", description: "L'ora di fine deve essere successiva all'inizio" });
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const startDatetime = new Date(`${dateStr}T${startTime}`);
    const endDatetime = new Date(`${dateStr}T${endTime}`);

    if (startDatetime <= new Date()) {
      toast({ variant: "destructive", title: "Errore", description: "La data deve essere nel futuro" });
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase.from("experience_dates").insert({
        experience_id: experienceId,
        start_datetime: startDatetime.toISOString(),
        end_datetime: endDatetime.toISOString(),
        max_participants: defaultMaxParticipants || 10,
        volunteer_hours: hours,
      });

      if (error) throw error;

      toast({ title: "Data aggiunta" });
      setSelectedDate(undefined);
      setStartTime("09:00");
      setEndTime("13:00");
      fetchDates();
    } catch (error: any) {
      devLog.error("Error adding experience date:", error);
      toast({ variant: "destructive", title: "Errore", description: error.message || "Impossibile aggiungere la data" });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("experience_dates")
        .delete()
        .eq("id", deleteTarget.id);

      if (error) throw error;

      toast({ title: "Data eliminata" });
      setDeleteTarget(null);
      fetchDates();
    } catch (error: any) {
      devLog.error("Error deleting experience date:", error);
      toast({ variant: "destructive", title: "Errore", description: error.message || "Impossibile eliminare la data" });
    } finally {
      setDeleting(false);
    }
  };

  const formatDateRow = (d: ExperienceDate) => {
    const start = new Date(d.start_datetime);
    const end = new Date(d.end_datetime);
    const dayStr = format(start, "EEEE d MMMM yyyy", { locale: it });
    const timeStr = `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;
    return { dayStr: dayStr.charAt(0).toUpperCase() + dayStr.slice(1), timeStr };
  };

  return (
    <>
      <BaseModal
        open={open}
        onClose={() => onOpenChange(false)}
        title="Gestisci date"
        subtitle={experienceTitle}
        showBackButton={false}
      >

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5">
          {/* Existing dates */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date programmate</Label>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : dates.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nessuna data futura programmata
              </p>
            ) : (
              <div className="space-y-1.5">
                {dates.map((d) => {
                  const { dayStr, timeStr } = formatDateRow(d);
                  return (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{dayStr}</p>
                        <p className="text-xs text-muted-foreground">
                          {timeStr} · {d.volunteer_hours ?? 0}h volontariato
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(d)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add form */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Aggiungi data</Label>

            {/* Inline calendar or selected date display */}
            <div className="space-y-1.5">
              <Label className="text-sm">Data *</Label>
              {selectedDate ? (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {format(selectedDate, "EEEE d MMMM yyyy", { locale: it }).replace(/^./, c => c.toUpperCase())}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={() => setSelectedDate(undefined)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex justify-center rounded-lg border">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date <= new Date()}
                    locale={it}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </div>
              )}
            </div>

            {/* Time pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start_time" className="text-sm">Ora inizio *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_time" className="text-sm">Ora fine *</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>


            <Button onClick={handleAdd} disabled={adding} className="w-full" size="sm">
              {adding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aggiunta...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Aggiungi
                </>
              )}
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina data</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa data? L'azione non è reversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
