import { useState, useEffect, useCallback, useMemo } from "react";
import { CalendarDays, SlidersHorizontal } from "lucide-react";
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
import { CalendarFiltersSidebar, CalendarFilterGroup } from "@/components/hr/calendar/CalendarFiltersSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const FILTERS_COLLAPSED_KEY = "hr-calendar-filters-collapsed";

export default function HRCalendarPage() {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [experiencesList, setExperiencesList] = useState<{ id: string; title: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filtersCollapsed, setFiltersCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(FILTERS_COLLAPSED_KEY) === "1";
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const companyId = profile?.company_id;

  const handleSetFiltersCollapsed = (c: boolean) => {
    setFiltersCollapsed(c);
    try {
      localStorage.setItem(FILTERS_COLLAPSED_KEY, c ? "1" : "0");
    } catch {}
  };

  // Fetch lista esperienze attivate per la company (una volta)
  const fetchExperiences = useCallback(async () => {
    if (!companyId) return;
    try {
      const { data: ec } = await supabase
        .from("experience_companies")
        .select("experience_id")
        .eq("company_id", companyId);
      const ids = (ec ?? []).map((r) => r.experience_id);
      if (ids.length === 0) {
        setExperiencesList([]);
        return;
      }
      const { data: exps } = await supabase
        .from("experiences")
        .select("id, title")
        .in("id", ids)
        .eq("status", "published")
        .order("title", { ascending: true });
      const list = (exps ?? []) as { id: string; title: string }[];
      setExperiencesList(list);
      // Default: tutte selezionate; mantieni quelle già selezionate e aggiungi le nuove
      setSelectedIds((prev) => {
        const next = new Set(prev);
        list.forEach((e) => {
          if (prev.size === 0 || !prev.has(e.id)) next.add(e.id);
        });
        return next;
      });
    } catch (err) {
      devLog.error("Error fetching HR calendar experiences:", err);
    }
  }, [companyId]);

  const fetchEvents = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);

    const rangeStart = subDays(startOfMonth(currentDate), 7);
    const rangeEnd = addDays(endOfMonth(currentDate), 7);

    try {
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
        const { data: emps } = await supabase
          .from("profiles")
          .select("id")
          .eq("company_id", companyId);
        const empIds = (emps || []).map((e) => e.id);

        if (empIds.length > 0) {
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

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  // TODO: aggiungere gruppo "Team Building" quando i tb_events saranno consolidati
  const filterGroups: CalendarFilterGroup[] = useMemo(
    () => [
      {
        id: "volunteering",
        label: "Volontariato aziendale",
        experiences: experiencesList,
      },
    ],
    [experiencesList]
  );

  const visibleEvents = useMemo(
    () => events.filter((e) => selectedIds.has(e.experience_id)),
    [events, selectedIds]
  );

  const calendarBody = (
    <div className="flex-1 min-w-0 flex flex-col h-full px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center gap-2 mb-4">
        {isMobile && (
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px]">
              <CalendarFiltersSidebar
                groups={filterGroups}
                selectedIds={selectedIds}
                onChange={setSelectedIds}
              />
            </SheetContent>
          </Sheet>
        )}
        <div className="flex-1 min-w-0">
          <CalendarHeader
            currentDate={currentDate}
            viewMode={viewMode}
            onDateChange={setCurrentDate}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {loading ? (
          <PageSkeleton variant="calendar" />
        ) : (
          <>
            {viewMode === "month" && (
              <MonthView
                currentDate={currentDate}
                events={visibleEvents}
                onViewModeChange={setViewMode}
                onDateChange={setCurrentDate}
                popoverMode="hr"
              />
            )}
            {viewMode === "week" && (
              <WeekView
                currentDate={currentDate}
                events={visibleEvents}
                popoverMode="hr"
              />
            )}
            {viewMode === "day" && (
              <DayView
                currentDate={currentDate}
                events={visibleEvents}
                popoverMode="hr"
              />
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <HRLayout>
      <PageHeader
        title="Calendario"
        icon={CalendarDays}
        iconColor="text-cyan-500"
      />

      <div className="flex -mx-4 sm:-mx-6 lg:-mx-6 -mb-4 sm:-mb-6 lg:-mb-8 h-[calc(100vh-180px)]">
        {!isMobile && (
          <CalendarFiltersSidebar
            groups={filterGroups}
            selectedIds={selectedIds}
            onChange={setSelectedIds}
            collapsed={filtersCollapsed}
            onCollapsedChange={handleSetFiltersCollapsed}
          />
        )}
        {calendarBody}
      </div>
    </HRLayout>
  );
}
