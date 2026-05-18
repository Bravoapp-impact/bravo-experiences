import { useState, useEffect, useCallback } from "react";
import { CalendarDays } from "lucide-react";
import { HRLayout } from "@/components/layout/HRLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import { CalendarEvent, ViewMode } from "@/components/calendar/calendar-types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfMonth, endOfMonth, addDays, subDays } from "date-fns";
import { PageSkeleton } from "@/components/common/skeletons/PageSkeleton";
import { devLog } from "@/lib/logger";

export default function HRCalendarPage() {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const companyId = profile?.company_id;

  const fetchEvents = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);

    const rangeStart = subDays(startOfMonth(currentDate), 7);
    const rangeEnd = addDays(endOfMonth(currentDate), 7);

    try {
      // 1. Esperienze attivate per la company
      const { data: ec, error: ecErr } = await supabase
        .from("experience_companies")
        .select("experience_id")
        .eq("company_id", companyId);
      if (ecErr) throw ecErr;

      const experienceIds = (ec ?? []).map((r) => r.experience_id);
      if (experienceIds.length === 0) {
        setEvents([]);
        return;
      }

      // 2. Date nel range (RLS filtra company_id IS NULL || = my_company)
      const { data: dates, error: datesErr } = await supabase
        .from("experience_dates")
        .select(`
          id, start_datetime, end_datetime, max_participants,
          experiences!inner(id, title)
        `)
        .in("experience_id", experienceIds)
        .gte("start_datetime", rangeStart.toISOString())
        .lte("start_datetime", rangeEnd.toISOString())
        .order("start_datetime", { ascending: true });
      if (datesErr) throw datesErr;

      const dateIds = (dates || []).map((d) => d.id);
      const countsMap = new Map<string, number>();

      if (dateIds.length > 0) {
        // 3. Dipendenti della company
        const { data: emps } = await supabase
          .from("profiles")
          .select("id")
          .eq("company_id", companyId);
        const empIds = (emps || []).map((e) => e.id);

        if (empIds.length > 0) {
          // 4. Bookings confermati limitati a colleghi della company
          const { data: bookings } = await supabase
            .from("bookings")
            .select("experience_date_id")
            .in("experience_date_id", dateIds)
            .in("user_id", empIds)
            .eq("status", "confirmed");

          (bookings || []).forEach((b) => {
            countsMap.set(
              b.experience_date_id,
              (countsMap.get(b.experience_date_id) || 0) + 1
            );
          });
        }
      }

      const mapped: CalendarEvent[] = (dates || []).map((d) => ({
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
      devLog.error("Error fetching HR calendar events:", err);
    } finally {
      setLoading(false);
    }
  }, [companyId, currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <HRLayout>
      <div className="space-y-4">
        <PageHeader
          title="Calendario"
          description="Tutte le date programmate del tuo programma di volontariato"
          icon={CalendarDays}
          iconColor="text-cyan-500"
        />

        <CalendarHeader
          currentDate={currentDate}
          viewMode={viewMode}
          onDateChange={setCurrentDate}
          onViewModeChange={setViewMode}
        />

        {loading ? (
          <PageSkeleton variant="list" />
        ) : (
          <>
            {viewMode === "month" && (
              <MonthView
                currentDate={currentDate}
                events={events}
                onViewModeChange={setViewMode}
                onDateChange={setCurrentDate}
                popoverMode="hr"
              />
            )}
            {viewMode === "week" && (
              <WeekView
                currentDate={currentDate}
                events={events}
                popoverMode="hr"
              />
            )}
            {viewMode === "day" && (
              <DayView
                currentDate={currentDate}
                events={events}
                popoverMode="hr"
              />
            )}
          </>
        )}
      </div>
    </HRLayout>
  );
}
