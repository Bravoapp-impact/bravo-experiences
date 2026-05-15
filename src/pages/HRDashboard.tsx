import { useEffect, useState } from "react";
import { Home } from "lucide-react";
import { HRLayout } from "@/components/layout/HRLayout";
import { MetricsCards } from "@/components/hr/MetricsCards";
import { SDGImpactGrid } from "@/components/hr/SDGImpactGrid";
import { UpcomingEvents } from "@/components/hr/UpcomingEvents";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { devLog } from "@/lib/logger";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";

interface DashboardData {
  employeesCount: number;
  participationRate: number;
  totalVolunteerHours: number;
  totalBeneficiaries: number;
  totalParticipations: number;
  budgetHoursPerEmployee: number | null;
  sdgImpacts: { code: string; hours: number }[];
  upcomingEvents: {
    id: string;
    experience_title: string;
    city: string | null;
    start_datetime: string;
    company_participants: number;
    max_participants: number;
  }[];
}

export default function HRDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    employeesCount: 0,
    participationRate: 0,
    totalVolunteerHours: 0,
    totalBeneficiaries: 0,
    totalParticipations: 0,
    budgetHoursPerEmployee: null,
    sdgImpacts: [],
    upcomingEvents: [],
  });

  useEffect(() => {
    if (profile?.company_id) {
      fetchDashboardData();
    }
  }, [profile?.company_id]);

  const fetchDashboardData = async () => {
    if (!profile?.company_id) return;

    try {
      setLoading(true);

      // Fetch employees count and profiles
      const { data: companyProfiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("company_id", profile.company_id);

      const employeesCount = companyProfiles?.length || 0;
      const companyUserIds = new Set(companyProfiles?.map((p) => p.id) || []);

      // Fetch hour budget for company
      const { data: budgetData } = await supabase
        .from("hour_budgets")
        .select("hours_per_employee_year")
        .eq("company_id", profile.company_id!)
        .order("created_at", { ascending: false })
        .limit(1);

      const budgetHoursPerEmployee = budgetData?.[0]?.hours_per_employee_year
        ? Number(budgetData[0].hours_per_employee_year)
        : null;

      // Fetch all bookings with related data for this company
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          created_at,
          user_id,
          experience_dates (
            id,
            start_datetime,
            end_datetime,
            volunteer_hours,
            beneficiaries_count,
            max_participants,
            experiences (
              id,
              title,
              city,
              sdgs
            )
          )
        `)
        .order("created_at", { ascending: false })
        .limit(1000);

      // Filter bookings by company employees
      const companyBookings = bookingsData?.filter((b) => companyUserIds.has(b.user_id)) || [];

      // Calculate completed bookings (status completed OR confirmed+past)
      const now = new Date();
      const completedBookings = companyBookings.filter(
        (b) =>
          (b.status === "completed" || (b.status === "confirmed" &&
          b.experience_dates &&
          new Date(b.experience_dates.end_datetime) < now))
      );

      // Calculate unique employees who participated
      const participatingEmployees = new Set(completedBookings.map((b) => b.user_id));
      const participationRate = employeesCount > 0 
        ? Math.round((participatingEmployees.size / employeesCount) * 100) 
        : 0;

      // Calculate metrics
      let totalVolunteerHours = 0;
      let totalBeneficiaries = 0;
      const sdgHoursMap: Record<string, number> = {};

      completedBookings.forEach((booking) => {
        const hours = Number(booking.experience_dates?.volunteer_hours) || 0;
        const beneficiaries = booking.experience_dates?.beneficiaries_count || 0;
        const sdgs = booking.experience_dates?.experiences?.sdgs || [];

        totalVolunteerHours += hours;
        totalBeneficiaries += beneficiaries;

        // Aggregate SDG hours
        sdgs.forEach((sdg: string) => {
          sdgHoursMap[sdg] = (sdgHoursMap[sdg] || 0) + hours;
        });
      });

      const sdgImpacts = Object.entries(sdgHoursMap)
        .map(([code, hours]) => ({ code, hours }))
        .sort((a, b) => b.hours - a.hours);

      // Fetch upcoming events with company participants count
      const { data: upcomingDates } = await supabase
        .from("experience_dates")
        .select(`
          id,
          start_datetime,
          max_participants,
          experiences (
            id,
            title,
            city
          )
        `)
        .gt("start_datetime", now.toISOString())
        .order("start_datetime", { ascending: true })
        .limit(10);

      // Batch: fetch all company participant counts for upcoming events in a single query
      const upcomingDateIds = (upcomingDates || []).map((d) => d.id);
      const companyUserIdsArray = Array.from(companyUserIds);
      const participantsMap = new Map<string, number>();

      if (upcomingDateIds.length > 0 && companyUserIdsArray.length > 0) {
        const { data: upcomingBookings } = await supabase
          .from("bookings")
          .select("experience_date_id")
          .in("experience_date_id", upcomingDateIds)
          .eq("status", "confirmed")
          .in("user_id", companyUserIdsArray);

        (upcomingBookings || []).forEach((b) => {
          const prev = participantsMap.get(b.experience_date_id) || 0;
          participantsMap.set(b.experience_date_id, prev + 1);
        });
      }

      const upcomingEvents = (upcomingDates || []).map((date) => ({
        id: date.id,
        experience_title: date.experiences?.title || "",
        city: date.experiences?.city || null,
        start_datetime: date.start_datetime,
        company_participants: participantsMap.get(date.id) || 0,
        max_participants: date.max_participants,
      }));

      // Filter to only show events with at least one company participant, limit to 4
      const eventsWithParticipants = upcomingEvents
        .filter((e) => e.company_participants > 0)
        .slice(0, 4);

      setData({
        employeesCount,
        participationRate,
        totalVolunteerHours,
        totalBeneficiaries,
        totalParticipations: completedBookings.length,
        budgetHoursPerEmployee,
        sdgImpacts,
        upcomingEvents: eventsWithParticipants,
      });
    } catch (error) {
      devLog.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <HRLayout>
        <LoadingState message="Caricamento dashboard..." />
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Panoramica dell'impatto sociale della tua azienda"
        />

        {/* Metrics Cards - 5 cards */}
        <MetricsCards
          employeesCount={data.employeesCount}
          participationRate={data.participationRate}
          totalVolunteerHours={data.totalVolunteerHours}
          totalBeneficiaries={data.totalBeneficiaries}
          totalParticipations={data.totalParticipations}
          budgetHoursPerEmployee={data.budgetHoursPerEmployee}
        />

        {/* Two column layout: SDG Impact + Upcoming Events */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <SDGImpactGrid sdgImpacts={data.sdgImpacts} />
          </div>
          <div>
            <UpcomingEvents events={data.upcomingEvents} />
          </div>
        </div>
      </div>
    </HRLayout>
  );
}
