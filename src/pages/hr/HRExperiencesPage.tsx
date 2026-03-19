import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { HRLayout } from "@/components/layout/HRLayout";
import { HRExperienceMetrics } from "@/components/hr/HRExperienceMetrics";
import { HRExperienceFilters } from "@/components/hr/HRExperienceFilters";
import { HRExperienceCard } from "@/components/hr/HRExperienceCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { devLog } from "@/lib/logger";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";

interface ExperienceDate {
  id: string;
  start_datetime: string;
  end_datetime: string;
  max_participants: number;
  volunteer_hours: number | null;
  bookings: {
    id: string;
    status: string;
    created_at: string;
    user: {
      first_name: string | null;
      last_name: string | null;
      email: string;
    };
  }[];
}

interface Experience {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  status: string;
  address: string | null;
  sdgs: string[] | null;
  category_id: string | null;
  city_id: string | null;
  association: { name: string } | null;
  city: { name: string } | null;
  category: { name: string } | null;
  dates: ExperienceDate[];
}

interface Metrics {
  activeExperiences: number;
  futureEvents: number;
  totalParticipations: number;
  averageFillRate: number;
}

export default function HRExperiencesPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [showPastEvents, setShowPastEvents] = useState(false);

  useEffect(() => {
    if (profile?.company_id) {
      fetchData();
    }
  }, [profile?.company_id]);

  const fetchData = async () => {
    if (!profile?.company_id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch categories and cities for filters
      const [categoriesRes, citiesRes] = await Promise.all([
        supabase.from("categories").select("id, name").order("name"),
        supabase.from("cities").select("id, name").order("name"),
      ]);

      setCategories(categoriesRes.data || []);
      setCities(citiesRes.data || []);

      // Fetch experiences assigned to this company
      const { data: experienceCompanies, error: ecError } = await supabase
        .from("experience_companies")
        .select("experience_id")
        .eq("company_id", profile.company_id);

      if (ecError) throw ecError;

      const experienceIds = experienceCompanies?.map((ec) => ec.experience_id) || [];

      if (experienceIds.length === 0) {
        setExperiences([]);
        setLoading(false);
        return;
      }

      // Fetch experiences with related data
      const { data: experiencesData, error: expError } = await supabase
        .from("experiences")
        .select(`
          id,
          title,
          description,
          image_url,
          status,
          address,
          sdgs,
          category_id,
          city_id,
          associations:association_id (name),
          cities:city_id (name),
          categories:category_id (name)
        `)
        .in("id", experienceIds)
        .order("created_at", { ascending: false });

      if (expError) throw expError;

      // Fetch company employees for filtering bookings
      const { data: companyProfiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("company_id", profile.company_id);

      const profileMap = new Map(
        companyProfiles?.map((p) => [p.id, p]) || []
      );
      const companyUserIds = Array.from(profileMap.keys());

      // Fetch experience dates with bookings
      const { data: datesData } = await supabase
        .from("experience_dates")
        .select(`
          id,
          experience_id,
          start_datetime,
          end_datetime,
          max_participants,
          volunteer_hours,
          bookings (
            id,
            status,
            created_at,
            user_id
          )
        `)
        .in("experience_id", experienceIds)
        .order("start_datetime", { ascending: true });

      // Map dates to experiences and filter bookings to company employees
      const datesMap = new Map<string, ExperienceDate[]>();
      (datesData || []).forEach((date) => {
        const companyBookings = date.bookings
          .filter((b) => companyUserIds.includes(b.user_id))
          .map((b) => ({
            id: b.id,
            status: b.status,
            created_at: b.created_at,
            user: profileMap.get(b.user_id) || {
              first_name: null,
              last_name: null,
              email: "",
            },
          }));

        const experienceDates = datesMap.get(date.experience_id) || [];
        experienceDates.push({
          id: date.id,
          start_datetime: date.start_datetime,
          end_datetime: date.end_datetime,
          max_participants: date.max_participants,
          volunteer_hours: date.volunteer_hours ? Number(date.volunteer_hours) : null,
          bookings: companyBookings,
        });
        datesMap.set(date.experience_id, experienceDates);
      });

      // Combine data
      const formattedExperiences: Experience[] = (experiencesData || []).map((exp) => ({
        id: exp.id,
        title: exp.title,
        description: exp.description,
        image_url: exp.image_url,
        status: exp.status,
        address: exp.address,
        sdgs: exp.sdgs,
        category_id: exp.category_id,
        city_id: exp.city_id,
        association: exp.associations as { name: string } | null,
        city: exp.cities as { name: string } | null,
        category: exp.categories as { name: string } | null,
        dates: datesMap.get(exp.id) || [],
      }));

      setExperiences(formattedExperiences);
    } catch (err) {
      devLog.error("Error fetching experiences:", err);
      setError("Errore nel caricamento delle esperienze");
    } finally {
      setLoading(false);
    }
  };

  // Filtered experiences
  const filteredExperiences = useMemo(() => {
    const now = new Date();

    return experiences.filter((exp) => {
      // Search filter
      if (
        searchTerm &&
        !exp.title.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Category filter
      if (categoryFilter !== "all" && exp.category_id !== categoryFilter) {
        return false;
      }

      // City filter
      if (cityFilter !== "all" && exp.city_id !== cityFilter) {
        return false;
      }

      // Past events filter - if not showing past, only show experiences with future dates
      if (!showPastEvents) {
        const hasFutureDates = exp.dates.some(
          (d) => new Date(d.start_datetime) > now
        );
        if (!hasFutureDates && exp.dates.length > 0) {
          return false;
        }
      }

      return true;
    });
  }, [experiences, searchTerm, categoryFilter, cityFilter, showPastEvents]);

  // Calculate metrics
  const metrics = useMemo<Metrics>(() => {
    const now = new Date();
    const activeExperiences = experiences.filter(
      (e) => e.status === "published"
    ).length;

    let futureEvents = 0;
    let totalParticipations = 0;
    let totalFillRate = 0;
    let futureEventsWithBookings = 0;

    experiences.forEach((exp) => {
      exp.dates.forEach((date) => {
        const confirmedBookings = date.bookings.filter(
          (b) => b.status === "confirmed"
        ).length;
        totalParticipations += confirmedBookings;

        if (new Date(date.start_datetime) > now) {
          futureEvents++;
          if (date.max_participants > 0) {
            totalFillRate += (confirmedBookings / date.max_participants) * 100;
            futureEventsWithBookings++;
          }
        }
      });
    });

    const averageFillRate =
      futureEventsWithBookings > 0
        ? Math.round(totalFillRate / futureEventsWithBookings)
        : 0;

    return {
      activeExperiences,
      futureEvents,
      totalParticipations,
      averageFillRate,
    };
  }, [experiences]);


  if (loading) {
    return (
      <HRLayout>
        <LoadingState message="Caricamento esperienze..." />
      </HRLayout>
    );
  }

  if (error) {
    return (
      <HRLayout>
        <EmptyState
          icon={Calendar}
          title="Errore di caricamento"
          description={error}
          className="min-h-[60vh]"
        />
      </HRLayout>
    );
  }

  // Empty state
  if (experiences.length === 0) {
    return (
      <HRLayout>
        <div className="space-y-6">
          <PageHeader
            title="Esperienze"
            description="Esperienze assegnate alla tua azienda"
          />
          <EmptyState
            icon={Calendar}
            title="Nessuna esperienza assegnata"
            description="La tua azienda non ha ancora esperienze di volontariato assegnate. Contatta il Super Admin per richiedere l'assegnazione di nuove esperienze."
          />
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      <div className="space-y-6">
        <PageHeader
          title="Esperienze"
          description="Monitora le esperienze e le partecipazioni dei dipendenti"
        />

        {/* Metrics */}
        <HRExperienceMetrics
          activeExperiences={metrics.activeExperiences}
          futureEvents={metrics.futureEvents}
          totalParticipations={metrics.totalParticipations}
          averageFillRate={metrics.averageFillRate}
        />

        {/* Filters */}
        <Card className="border bg-card">
          <CardContent className="p-4 sm:p-6">
            <HRExperienceFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              cityFilter={cityFilter}
              onCityChange={setCityFilter}
              showPastEvents={showPastEvents}
              onShowPastEventsChange={setShowPastEvents}
              categories={categories}
              cities={cities}
              resultCount={filteredExperiences.length}
            />
          </CardContent>
        </Card>

        {/* Experiences list */}
        <div className="space-y-4">
          {filteredExperiences.length === 0 ? (
            <Card className="border-border/50 bg-card/80">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Nessuna esperienza corrisponde ai filtri selezionati
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredExperiences.map((experience, index) => (
              <motion.div
                key={experience.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <HRExperienceCard experience={experience} />
              </motion.div>
            ))
          )}
        </div>

      </div>
    </HRLayout>
  );
}
