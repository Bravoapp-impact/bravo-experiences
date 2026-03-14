import { useState, useEffect, useCallback, useMemo } from "react";
import { BaseModal } from "@/components/common/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { devLog } from "@/lib/logger";
import { format, addWeeks, addMonths, isBefore, isAfter } from "date-fns";
import { it } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

type RecurrenceMode = "none" | "weekly" | "biweekly" | "monthly";
type EndMode = "never" | "date" | "count";

interface ManageDatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experienceId: string;
  experienceTitle: string;
  defaultMaxParticipants: number | null;
}

function generateRecurringDates(
  start: Date,
  recurrence: RecurrenceMode,
  endMode: EndMode,
  endDate: Date | undefined,
  endCount: number
): Date[] {
  if (recurrence === "none") return [start];

  const dates: Date[] = [];
  const maxIterations = 52;
  let current = start;

  const getNext = (d: Date): Date => {
    switch (recurrence) {
      case "weekly": return addWeeks(d, 1);
      case "biweekly": return addWeeks(d, 2);
      case "monthly": return addMonths(d, 1);
      default: return d;
    }
  };

  // Start from the NEXT occurrence (the start date itself is already selected)
  for (let i = 0; i < maxIterations; i++) {
    current = getNext(current);

    if (endMode === "date" && endDate && isAfter(current, endDate)) break;
    if (endMode === "count" && dates.length >= endCount) break;
    if (endMode === "never" && dates.length >= 52) break;

    dates.push(current);
  }

  return dates;
}

function RecurrenceSection({
  selectedDate,
  recurrence,
  setRecurrence,
  endMode,
  setEndMode,
  endDate,
  setEndDate,
  endCount,
  setEndCount,
  generatedDates,
}: {
  selectedDate: Date;
  recurrence: RecurrenceMode;
  setRecurrence: (v: RecurrenceMode) => void;
  endMode: EndMode;
  setEndMode: (v: EndMode) => void;
  endDate: Date | undefined;
  setEndDate: (v: Date | undefined) => void;
  endCount: number;
  setEndCount: (v: number) => void;
  generatedDates: Date[];
}) {
  const dayName = format(selectedDate, "EEEE", { locale: it });
  const dayOfMonth = format(selectedDate, "d");

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-sm">Ricorrenza</Label>
        <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrenceMode)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Non si ripete</SelectItem>
            <SelectItem value="weekly">Ogni settimana di {dayName}</SelectItem>
            <SelectItem value="biweekly">Ogni 2 settimane di {dayName}</SelectItem>
            <SelectItem value="monthly">Ogni mese il {dayOfMonth}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {recurrence !== "none" && (
        <>
          <div className="space-y-2">
            <Label className="text-sm">Fine</Label>
            <RadioGroup
              value={endMode}
              onValueChange={(v) => setEndMode(v as EndMode)}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="never" id="end-never" />
                <Label htmlFor="end-never" className="text-sm font-normal cursor-pointer">Mai</Label>
              </div>

              <div className="flex items-center gap-2">
                <RadioGroupItem value="date" id="end-date" />
                <Label htmlFor="end-date" className="text-sm font-normal cursor-pointer">Data</Label>
                {endMode === "date" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-auto h-8 text-sm justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {endDate ? format(endDate, "d MMM yyyy", { locale: it }) : "Seleziona"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[200]" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => date <= addWeeks(selectedDate, 0)}
                        locale={it}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              <div className="flex items-center gap-2">
                <RadioGroupItem value="count" id="end-count" />
                <Label htmlFor="end-count" className="text-sm font-normal cursor-pointer">Dopo</Label>
                {endMode === "count" && (
                  <>
                    <Input
                      type="number"
                      className="w-16 h-8 text-sm text-center"
                      min={1}
                      max={52}
                      value={endCount}
                      onChange={(e) => setEndCount(Math.min(52, Math.max(1, parseInt(e.target.value) || 1)))}
                    />
                    <span className="text-sm text-muted-foreground">occorrenze</span>
                  </>
                )}
              </div>
            </RadioGroup>
          </div>

          {generatedDates.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Anteprima ({generatedDates.length} date aggiuntive)
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {generatedDates.map((d, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {format(d, "d MMM", { locale: it })}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
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

  // Recurrence state
  const [recurrence, setRecurrence] = useState<RecurrenceMode>("none");
  const [endMode, setEndMode] = useState<EndMode>("count");
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endCount, setEndCount] = useState(4);

  const computeHours = useCallback(() => {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
    return diff > 0 ? Math.round(diff * 10) / 10 : 0;
  }, [startTime, endTime]);

  const generatedDates = useMemo(() => {
    if (!selectedDate || recurrence === "none") return [];
    return generateRecurringDates(selectedDate, recurrence, endMode, endDate, endCount);
  }, [selectedDate, recurrence, endMode, endDate, endCount]);

  const totalDatesCount = recurrence === "none" ? 1 : 1 + generatedDates.length;

  const resetForm = useCallback(() => {
    setSelectedDate(undefined);
    setStartTime("09:00");
    setEndTime("13:00");
    setRecurrence("none");
    setEndMode("count");
    setEndDate(undefined);
    setEndCount(4);
  }, []);

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
      resetForm();
    }
  }, [open, fetchDates, resetForm]);

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

    const allDates = [selectedDate, ...generatedDates];
    const now = new Date();

    const records = allDates
      .filter((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        return new Date(`${dateStr}T${startTime}`) > now;
      })
      .map((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        return {
          experience_id: experienceId,
          start_datetime: new Date(`${dateStr}T${startTime}`).toISOString(),
          end_datetime: new Date(`${dateStr}T${endTime}`).toISOString(),
          max_participants: defaultMaxParticipants || 10,
          volunteer_hours: hours,
        };
      });

    if (records.length === 0) {
      toast({ variant: "destructive", title: "Errore", description: "Tutte le date sono nel passato" });
      return;
    }

    // Check for existing duplicate slots
    const { data: existingDates } = await supabase
      .from("experience_dates")
      .select("start_datetime, end_datetime")
      .eq("experience_id", experienceId);

    const duplicates = records.filter((r) =>
      existingDates?.some(
        (ed) => ed.start_datetime === r.start_datetime && ed.end_datetime === r.end_datetime
      )
    );

    const uniqueRecords = records.filter((r) =>
      !existingDates?.some(
        (ed) => ed.start_datetime === r.start_datetime && ed.end_datetime === r.end_datetime
      )
    );

    if (uniqueRecords.length === 0) {
      toast({
        variant: "destructive",
        title: "Date già esistenti",
        description: duplicates.length === 1
          ? "Questa data e orario esistono già per questa esperienza"
          : `Tutte le ${duplicates.length} date esistono già per questa esperienza`,
      });
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase.from("experience_dates").insert(records);
      if (error) throw error;

      toast({
        title: records.length === 1
          ? "Data aggiunta"
          : `${records.length} date aggiunte`,
      });
      resetForm();
      fetchDates();
    } catch (error: any) {
      devLog.error("Error adding experience date(s):", error);
      toast({ variant: "destructive", title: "Errore", description: error.message || "Impossibile aggiungere le date" });
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
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Aggiungi date</Label>

            {/* Calendar or selected date display */}
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
                    onClick={resetForm}
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

            {/* Recurrence section */}
            {selectedDate && (
              <RecurrenceSection
                selectedDate={selectedDate}
                recurrence={recurrence}
                setRecurrence={setRecurrence}
                endMode={endMode}
                setEndMode={setEndMode}
                endDate={endDate}
                setEndDate={setEndDate}
                endCount={endCount}
                setEndCount={setEndCount}
                generatedDates={generatedDates}
              />
            )}

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
                  {totalDatesCount === 1
                    ? "Aggiungi"
                    : `Aggiungi ${totalDatesCount} date`}
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
