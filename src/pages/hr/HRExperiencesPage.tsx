import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar, CheckCircle2, MapPin, PackageOpen, Plus, Search, Trash2,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BaseCardImage } from "@/components/common/BaseCardImage";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

/* ── Types ── */

interface CatalogExperience {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  city: string | null;
  address: string | null;
  status: string;
  sdgs: string[] | null;
  category: string | null;
  category_id: string | null;
  city_id: string | null;
  participant_info: string | null;
  categories?: { id: string; name: string } | null;
  cities?: { id: string; name: string } | null;
  associations?: { name: string } | null;
}

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
    user: { first_name: string | null; last_name: string | null; email: string };
  }[];
}

interface StatsExperience {
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

  // Shared
  const [experiences, setExperiences] = useState<CatalogExperience[]>([]);
  const [activatedIds, setActivatedIds] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);

  // Catalog filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  const navigate = useNavigate();

  // Stats tab
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsExperiences, setStatsExperiences] = useState<StatsExperience[]>([]);
  const [statsSearch, setStatsSearch] = useState("");
  const [statsCategoryFilter, setStatsCategoryFilter] = useState("all");
  const [statsCityFilter, setStatsCityFilter] = useState("all");
  const [showPastEvents, setShowPastEvents] = useState(false);

  const [activeTab, setActiveTab] = useState("catalogo");

  useEffect(() => {
    if (profile?.company_id) fetchInitialData();
  }, [profile?.company_id]);

  // Lazy-load stats when tab opens
  useEffect(() => {
    if (activeTab === "statistiche" && !statsLoaded && profile?.company_id) {
      fetchStatsData();
    }
  }, [activeTab, statsLoaded, profile?.company_id]);

  const fetchInitialData = async () => {
    if (!profile?.company_id) return;
    try {
      setLoading(true);
      setError(null);

      const [catRes, cityRes, expRes, ecRes] = await Promise.all([
        supabase.from("categories").select("id, name").order("name"),
        supabase.from("cities").select("id, name").order("name"),
        supabase
          .from("experiences")
          .select(`id, title, description, image_url, city, address, status, sdgs, category, category_id, city_id, participant_info, categories:category_id (id, name), cities:city_id (id, name), associations:association_id (name)`)
          .eq("status", "published")
          .eq("visibility", "public")
          .order("created_at", { ascending: false }),
        supabase
          .from("experience_companies")
          .select("experience_id")
          .eq("company_id", profile.company_id),
      ]);

      setCategories(catRes.data || []);
      setCities(cityRes.data || []);
      setExperiences((expRes.data || []) as CatalogExperience[]);
      setActivatedIds(new Set((ecRes.data || []).map((r) => r.experience_id)));
    } catch (err) {
      devLog.error("Error fetching initial data:", err);
      setError("Errore nel caricamento");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsData = async () => {
    if (!profile?.company_id) return;
    setStatsLoading(true);
    try {
      // 1. Get all company employee profiles
      const { data: companyProfiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("company_id", profile.company_id);

      const profileMap = new Map((companyProfiles || []).map((p) => [p.id, p]));
      const companyUserIds = Array.from(profileMap.keys());

      if (companyUserIds.length === 0) {
        setStatsExperiences([]);
        setStatsLoaded(true);
        setStatsLoading(false);
        return;
      }

      // 2. Get all non-cancelled bookings from company employees
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("id, status, created_at, user_id, experience_date_id")
        .in("user_id", companyUserIds)
        .neq("status", "cancelled");

      if (!bookingsData || bookingsData.length === 0) {
        setStatsExperiences([]);
        setStatsLoaded(true);
        setStatsLoading(false);
        return;
      }

      // 3. Get unique experience_date_ids, then fetch dates to get experience_ids
      const dateIds = [...new Set(bookingsData.map((b) => b.experience_date_id))];
      const { data: datesRaw, error: datesError } = await supabase
        .from("experience_dates")
        .select("id, experience_id, start_datetime, end_datetime, max_participants, volunteer_hours")
        .in("id", dateIds)
        .order("start_datetime", { ascending: true });

      if (datesError) {
        devLog.error("[Stats] experience_dates query failed:", datesError.message);
      }

      const uniqueExpIds = [...new Set((datesRaw || []).map((d) => d.experience_id))];

      if (uniqueExpIds.length === 0) {
        devLog.warn("[Stats] Found", bookingsData.length, "bookings but 0 experience_dates resolved — possible RLS issue on experience_dates");
        setStatsExperiences([]);
        setStatsLoaded(true);
        setStatsLoading(false);
        return;
      }

      // 4. Fetch full experience details (use RPC-free direct query — HR RLS allows seeing published/public)
      const { data: expData } = await supabase
        .from("experiences")
        .select("id, title, description, image_url, status, address, sdgs, category_id, city_id, categories:category_id (id, name), cities:city_id (id, name), associations:association_id (name)")
        .in("id", uniqueExpIds);

      // Also fetch ALL dates for these experiences (not just the ones with bookings)
      const { data: allDatesData } = await supabase
        .from("experience_dates")
        .select("id, experience_id, start_datetime, end_datetime, max_participants, volunteer_hours")
        .in("experience_id", uniqueExpIds)
        .order("start_datetime", { ascending: true });

      // 5. Build bookings lookup by date_id
      const bookingsByDate = new Map<string, typeof bookingsData>();
      bookingsData.forEach((b) => {
        const list = bookingsByDate.get(b.experience_date_id) || [];
        list.push(b);
        bookingsByDate.set(b.experience_date_id, list);
      });

      // 6. Build dates map grouped by experience_id
      const datesMap = new Map<string, ExperienceDate[]>();
      (allDatesData || []).forEach((date) => {
        const dateBookings = (bookingsByDate.get(date.id) || []).map((b) => ({
          id: b.id,
          status: b.status,
          created_at: b.created_at,
          user: profileMap.get(b.user_id) || { first_name: null, last_name: null, email: "" },
        }));

        const list = datesMap.get(date.experience_id) || [];
        list.push({
          id: date.id,
          start_datetime: date.start_datetime,
          end_datetime: date.end_datetime,
          max_participants: date.max_participants,
          volunteer_hours: date.volunteer_hours ? Number(date.volunteer_hours) : null,
          bookings: dateBookings,
        });
        datesMap.set(date.experience_id, list);
      });

      // 7. Format final stats experiences
      const formatted: StatsExperience[] = (expData || []).map((exp) => ({
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

      setStatsExperiences(formatted);
      setStatsLoaded(true);
    } catch (err) {
      devLog.error("Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  /* ── Activate / Deactivate ── */

  const handleActivate = async (expId: string) => {
    if (!profile?.company_id) return;
    // Optimistic
    setActivatedIds((prev) => new Set(prev).add(expId));
    const { error } = await supabase
      .from("experience_companies")
      .insert({ experience_id: expId, company_id: profile.company_id });
    if (error) {
      devLog.error("Error activating:", error);
      setActivatedIds((prev) => {
        const next = new Set(prev);
        next.delete(expId);
        return next;
      });
      toast({ title: "Errore nell'aggiunta al programma", variant: "destructive" });
    } else {
      toast({ title: "Aggiunta al programma" });
      // Reset stats so they reload
      setStatsLoaded(false);
    }
  };

  const handleDeactivate = async (expId: string) => {
    if (!profile?.company_id) return;
    setActivatedIds((prev) => {
      const next = new Set(prev);
      next.delete(expId);
      return next;
    });
    const { error } = await supabase
      .from("experience_companies")
      .delete()
      .eq("experience_id", expId)
      .eq("company_id", profile.company_id);
    if (error) {
      devLog.error("Error deactivating:", error);
      setActivatedIds((prev) => new Set(prev).add(expId));
      toast({ title: "Errore nella rimozione", variant: "destructive" });
    } else {
      toast({ title: "Rimossa dal programma" });
      setStatsLoaded(false);
    }
  };

  /* ── Filtered lists ── */

  const filteredCatalog = useMemo(() => {
    return experiences.filter((exp) => {
      if (searchTerm && !exp.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (categoryFilter !== "all" && exp.category_id !== categoryFilter) return false;
      if (cityFilter !== "all" && exp.city_id !== cityFilter) return false;
      return true;
    });
  }, [experiences, searchTerm, categoryFilter, cityFilter]);

  const programExperiences = useMemo(() => {
    return experiences.filter((e) => activatedIds.has(e.id));
  }, [experiences, activatedIds]);

  const filteredStats = useMemo(() => {
    const now = new Date();
    return statsExperiences.filter((exp) => {
      if (statsSearch && !exp.title.toLowerCase().includes(statsSearch.toLowerCase())) return false;
      if (statsCategoryFilter !== "all" && exp.category_id !== statsCategoryFilter) return false;
      if (statsCityFilter !== "all" && exp.city_id !== statsCityFilter) return false;
      if (!showPastEvents) {
        const hasFuture = exp.dates.some((d) => new Date(d.start_datetime) > now);
        if (!hasFuture && exp.dates.length > 0) return false;
      }
      return true;
    });
  }, [statsExperiences, statsSearch, statsCategoryFilter, statsCityFilter, showPastEvents]);

  const statsMetrics = useMemo<Metrics>(() => {
    const now = new Date();
    const activeExperiences = statsExperiences.length;
    let futureEvents = 0, totalParticipations = 0, totalFillRate = 0, datesWithCapacity = 0;

    statsExperiences.forEach((exp) => {
      exp.dates.forEach((date) => {
        const participated = date.bookings.filter((b) => ["confirmed", "completed", "verified"].includes(b.status)).length;
        totalParticipations += participated;
        if (new Date(date.start_datetime) > now) {
          futureEvents++;
        }
        if (date.max_participants > 0) {
          totalFillRate += (participated / date.max_participants) * 100;
          datesWithCapacity++;
        }
      });
    });

    return {
      activeExperiences,
      futureEvents,
      totalParticipations,
      averageFillRate: datesWithCapacity > 0 ? Math.round(totalFillRate / datesWithCapacity) : 0,
    };
  }, [statsExperiences]);

  /* ── Render ── */

  if (loading) {
    return <HRLayout><LoadingState message="Caricamento..." /></HRLayout>;
  }

  if (error) {
    return (
      <HRLayout>
        <EmptyState icon={Calendar} title="Errore di caricamento" description={error} className="min-h-[60vh]" />
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      <div className="space-y-6">
        <PageHeader title="Volontariato aziendale" description="Gestisci il programma e monitora l'impatto" />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="catalogo">Catalogo</TabsTrigger>
            <TabsTrigger value="programma">
              Il mio programma
            </TabsTrigger>
            <TabsTrigger value="statistiche">Statistiche</TabsTrigger>
          </TabsList>

          {/* ── TAB: Catalogo ── */}
          <TabsContent value="catalogo" className="space-y-4 mt-4">
            <CatalogFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              cityFilter={cityFilter}
              onCityChange={setCityFilter}
              categories={categories}
              cities={cities}
            />

            {filteredCatalog.length === 0 ? (
              <EmptyState icon={Search} title="Nessuna esperienza trovata" description="Prova a modificare i filtri di ricerca" />
            ) : (
              <TooltipProvider delayDuration={300}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredCatalog.map((exp, i) => (
                    <CompactCard key={exp.id} experience={exp} index={i} onOpen={() => navigate(`/hr/experiences/${exp.id}`)} actions={
                      activatedIds.has(exp.id) ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Nel programma
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Questa esperienza è nel tuo programma</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={(e) => { e.stopPropagation(); handleActivate(exp.id); }}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Aggiungi al programma</TooltipContent>
                        </Tooltip>
                      )
                    } />
                  ))}
                </div>
              </TooltipProvider>
            )}
          </TabsContent>

          {/* ── TAB: Il mio programma ── */}
          <TabsContent value="programma" className="space-y-4 mt-4">
            {programExperiences.length === 0 ? (
              <EmptyState
                icon={PackageOpen}
                title="Nessuna esperienza attiva"
                description="Vai al Catalogo per aggiungere esperienze al programma"
              />
            ) : (
              <TooltipProvider delayDuration={300}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {programExperiences.map((exp, i) => (
                    <CompactCard key={exp.id} experience={exp} index={i} onOpen={() => navigate(`/hr/experiences/${exp.id}`)} actions={
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeactivate(exp.id); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Rimuovi dal programma</TooltipContent>
                      </Tooltip>
                    } />
                  ))}
                </div>
              </TooltipProvider>
            )}
          </TabsContent>

          {/* ── TAB: Statistiche ── */}
          <TabsContent value="statistiche" className="space-y-6 mt-4">
            {statsLoading ? (
              <LoadingState message="Caricamento statistiche..." />
            ) : (
              <>
                <HRExperienceMetrics
                  activeExperiences={statsMetrics.activeExperiences}
                  futureEvents={statsMetrics.futureEvents}
                  totalParticipations={statsMetrics.totalParticipations}
                  averageFillRate={statsMetrics.averageFillRate}
                />

                <Card className="border bg-card">
                  <CardContent className="p-4 sm:p-6">
                    <HRExperienceFilters
                      searchTerm={statsSearch}
                      onSearchChange={setStatsSearch}
                      categoryFilter={statsCategoryFilter}
                      onCategoryChange={setStatsCategoryFilter}
                      cityFilter={statsCityFilter}
                      onCityChange={setStatsCityFilter}
                      showPastEvents={showPastEvents}
                      onShowPastEventsChange={setShowPastEvents}
                      categories={categories}
                      cities={cities}
                      resultCount={filteredStats.length}
                    />
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {filteredStats.length === 0 ? (
                    <Card className="border-border/50 bg-card/80">
                      <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Nessuna esperienza corrisponde ai filtri selezionati</p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredStats.map((experience, index) => (
                      <motion.div key={experience.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                        <HRExperienceCard experience={experience} />
                      </motion.div>
                    ))
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

    </HRLayout>
  );
}

/* ── Sub-components ── */

function CompactCard({ experience, index, actions, onOpen }: {
  experience: CatalogExperience;
  index: number;
  actions: React.ReactNode;
  onOpen: () => void;
}) {
  const categoryName = experience.categories?.name || experience.category;
  const cityName = experience.cities?.name || experience.city;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
      className="group"
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <BaseCardImage imageUrl={experience.image_url} alt={experience.title} aspectRatio="square" />
        <div className="pt-2 space-y-1">
          <h3 className="text-[13px] font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {experience.title}
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-light">
            {categoryName && <span className="truncate">{categoryName}</span>}
            {categoryName && cityName && <span>·</span>}
            {cityName && (
              <span className="flex items-center gap-0.5 truncate">
                <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                {cityName}
              </span>
            )}
          </div>
        </div>
      </button>
      <div className="pt-0.5">{actions}</div>
    </motion.div>
  );
}

function CatalogFilters({ searchTerm, onSearchChange, categoryFilter, onCategoryChange, cityFilter, onCityChange, categories, cities }: {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  categoryFilter: string;
  onCategoryChange: (v: string) => void;
  cityFilter: string;
  onCityChange: (v: string) => void;
  categories: { id: string; name: string }[];
  cities: { id: string; name: string }[];
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cerca esperienza..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} className="pl-10" />
      </div>
      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tutte le categorie</SelectItem>
          {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={cityFilter} onValueChange={onCityChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Città" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tutte le città</SelectItem>
          {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
