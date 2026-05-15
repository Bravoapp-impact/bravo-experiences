import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Heart, MapPin, PackageOpen, Search } from "lucide-react";
import { HRLayout } from "@/components/layout/HRLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { devLog } from "@/lib/logger";

import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";
import { BravoCard, BravoCardMetaItem } from "@/components/common/BravoCard";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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

export default function HRExperiencesPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [experiences, setExperiences] = useState<CatalogExperience[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.company_id) fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.company_id]);

  const fetchInitialData = async () => {
    if (!profile?.company_id) return;
    try {
      setLoading(true);
      setError(null);

      // RLS già restringe `experiences` alle sole esperienze attivate per la company dell'HR.
      const [catRes, cityRes, expRes] = await Promise.all([
        supabase.from("categories").select("id, name").order("name"),
        supabase.from("cities").select("id, name").order("name"),
        supabase
          .from("experiences")
          .select(`id, title, description, image_url, city, address, status, sdgs, category, category_id, city_id, association_id, association_name, participant_info, categories:category_id (id, name), cities:city_id (id, name)`)
          .eq("status", "published")
          .order("created_at", { ascending: false }),
      ]);

      const expRows = (expRes.data || []) as any[];
      const assocIds = Array.from(new Set(expRows.map((e) => e.association_id).filter(Boolean)));
      const assocMap = new Map<string, { name: string; logo_url: string | null }>();
      if (assocIds.length > 0) {
        const { data: assocData } = await supabase
          .from("associations_public")
          .select("id, name, logo_url")
          .in("id", assocIds);
        (assocData || []).forEach((a: any) => assocMap.set(a.id, { name: a.name, logo_url: a.logo_url }));
      }

      setCategories(catRes.data || []);
      setCities(cityRes.data || []);
      setExperiences(
        expRows.map((e) => ({
          ...e,
          associations: e.association_id
            ? { name: assocMap.get(e.association_id)?.name ?? e.association_name ?? null }
            : e.association_name
              ? { name: e.association_name }
              : null,
        })) as CatalogExperience[]
      );
    } catch (err) {
      devLog.error("Error fetching initial data:", err);
      setError("Errore nel caricamento");
    } finally {
      setLoading(false);
    }
  };

  const filteredExperiences = useMemo(() => {
    return experiences.filter((exp) => {
      if (searchTerm && !exp.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (categoryFilter !== "all" && exp.category_id !== categoryFilter) return false;
      if (cityFilter !== "all" && exp.city_id !== cityFilter) return false;
      return true;
    });
  }, [experiences, searchTerm, categoryFilter, cityFilter]);

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
        <PageHeader title="Volontariato aziendale" icon={Heart} iconColor="text-green-500" />

        {experiences.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="Nessuna esperienza nel tuo programma"
            description="Contatta il tuo referente Bravo! per attivare le prime esperienze"
          />
        ) : (
          <>
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

            {filteredExperiences.length === 0 ? (
              <EmptyState icon={Search} title="Nessuna esperienza trovata" description="Prova a modificare i filtri di ricerca" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredExperiences.map((exp, i) => {
                  const cityName = exp.cities?.name || exp.city;
                  const metaItems: BravoCardMetaItem[] = [];
                  if (cityName) metaItems.push({ icon: MapPin, text: cityName });
                  return (
                    <BravoCard
                      key={exp.id}
                      imageUrl={exp.image_url}
                      imageAlt={exp.title}
                      title={exp.title}
                      metaItems={metaItems}
                      index={i}
                      onOpen={() => navigate(`/hr/experiences/${exp.id}`)}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </HRLayout>
  );
}

/* ── Sub-components ── */

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
