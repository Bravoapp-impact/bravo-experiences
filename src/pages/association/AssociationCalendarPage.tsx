import { useState, useEffect, useCallback } from "react";
import { AssociationLayout } from "@/components/layout/AssociationLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { CalendarHeader } from "@/components/association/calendar/CalendarHeader";
import { MonthView } from "@/components/association/calendar/MonthView";
import { WeekView } from "@/components/association/calendar/WeekView";
import { DayView } from "@/components/association/calendar/DayView";
import { CalendarEvent, ViewMode } from "@/components/association/calendar/calendar-types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfMonth, endOfMonth, addDays, subDays, format } from "date-fns";
import { LoadingState } from "@/components/common/LoadingState";
import { ManageDatesDialog } from "@/components/association/ManageDatesDialog";
import { devLog } from "@/lib/logger";
import { devLog } from "@/lib/logger";

export default function AssociationCalendarPage() {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [addDateOpen, setAddDateOpen] = useState(false);
  const [addDateExperience, setAddDateExperience] = useState<{ id: string; title: string } | null>(null);
  const [experiences, setExperiences] = useState<{ id: string; title: string; max_participants: number | null }[]>([]);
  const [showExperiencePicker, setShowExperiencePicker] = useState(false);

  const associationId = profile?.association_id;

  const fetchEvents = useCallback(async () => {
    if (!associationId) return;
    setLoading(true);

    const rangeStart = subDays(startOfMonth(currentDate), 7);
    const rangeEnd = addDays(endOfMonth(currentDate), 7);

    try {
      const { data, error } = await supabase
        .from("experience_dates")
        .select(`
          id, start_datetime, end_datetime, max_participants,
          experiences!inner(id, title, association_id)
        `)
        .eq("experiences.association_id", associationId)
        .gte("start_datetime", rangeStart.toISOString())
        .lte("start_datetime", rangeEnd.toISOString())
        .order("start_datetime", { ascending: true });

      if (error) throw error;

      const dateIds = (data || []).map(d => d.id);
      let countsMap = new Map<string, number>();

      if (dateIds.length > 0) {
        const { data: bookings } = await supabase
          .from("bookings")
          .select("experience_date_id")
          .in("experience_date_id", dateIds)
          .eq("status", "confirmed");

        (bookings || []).forEach(b => {
          countsMap.set(b.experience_date_id, (countsMap.get(b.experience_date_id) || 0) + 1);
        });
      }

      const mapped: CalendarEvent[] = (data || []).map(d => ({
        id: d.id,
        experience_id: (d.experiences as any).id,
        experience_title: (d.experiences as any).title,
        start_datetime: d.start_datetime,
        end_datetime: d.end_datetime,
        max_participants: d.max_participants,
        confirmed_count: countsMap.get(d.id) || 0,
      }));

      setEvents(mapped);
    } catch (err) {
      devLog.error("Error fetching calendar events:", err);
    } finally {
      setLoading(false);
    }
  }, [associationId, currentDate]);

  const fetchExperiences = useCallback(async () => {
    if (!associationId) return;
    const { data } = await supabase
      .from("experiences")
      .select("id, title, max_participants")
      .eq("association_id", associationId)
      .eq("status", "published");
    setExperiences(data || []);
  }, [associationId]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { fetchExperiences(); }, [fetchExperiences]);

  const handleAddDate = () => {
    if (experiences.length === 1) {
      setAddDateExperience({ id: experiences[0].id, title: experiences[0].title });
      setAddDateOpen(true);
    }
  };

  const handleExperiencePicked = (exp: { id: string; title: string }) => {
    setAddDateExperience(exp);
    setAddDateOpen(true);
  };

  return (
    <AssociationLayout>
      <div className="space-y-4">
        <PageHeader title="Calendario" description="Visualizza e gestisci tutte le date programmate" />

        <CalendarHeader
          currentDate={currentDate}
          viewMode={viewMode}
          onDateChange={setCurrentDate}
          onViewModeChange={setViewMode}
          onAddDate={experiences.length > 0 ? handleAddDate : undefined}
          experiences={experiences}
          onExperiencePicked={experiences.length > 1 ? handleExperiencePicked : undefined}
        />

        {loading ? (
          <LoadingState />
        ) : (
          <>
            {viewMode === "month" && (
              <MonthView
                currentDate={currentDate}
                events={events}
                onViewModeChange={setViewMode}
                onDateChange={setCurrentDate}
                onEventDeleted={fetchEvents}
              />
            )}
            {viewMode === "week" && (
              <WeekView
                currentDate={currentDate}
                events={events}
                onEventDeleted={fetchEvents}
              />
            )}
            {viewMode === "day" && (
              <DayView
                currentDate={currentDate}
                events={events}
                onEventDeleted={fetchEvents}
              />
            )}
          </>
        )}
      </div>

      {/* Experience picker dialog */}
      <Dialog open={showExperiencePicker} onOpenChange={setShowExperiencePicker}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Seleziona esperienza</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Per quale esperienza vuoi aggiungere una data?
          </p>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {experiences.map(exp => (
              <button
                key={exp.id}
                className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
                onClick={() => handleExperiencePicked(exp)}
              >
                {exp.title}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {addDateExperience && (
        <ManageDatesDialog
          open={addDateOpen}
          onOpenChange={(open) => {
            setAddDateOpen(open);
            if (!open) {
              setAddDateExperience(null);
              fetchEvents();
            }
          }}
          experienceId={addDateExperience.id}
          experienceTitle={addDateExperience.title}
          defaultMaxParticipants={experiences.find(e => e.id === addDateExperience.id)?.max_participants ?? null}
        />
      )}
    </AssociationLayout>
  );
}
