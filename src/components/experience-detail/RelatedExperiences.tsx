import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExperienceCardCompact } from "@/components/experiences/ExperienceCardCompact";
import { supabase } from "@/integrations/supabase/client";
import type { Experience } from "@/types/experiences";

interface RelatedExperiencesProps {
  currentExperienceId: string;
  cityId: string | null;
  companyId: string | null;
  cityName?: string | null;
}

export function RelatedExperiences({ currentExperienceId, cityId, companyId, cityName }: RelatedExperiencesProps) {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (!cityId || !companyId) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from("experiences")
        .select(`
          id, title, description, image_url, association_name, city, address, category, sdgs,
          associations:association_id (logo_url),
          experience_companies!inner (company_id),
          experience_dates!inner (id, start_datetime)
        `)
        .eq("city_id", cityId)
        .eq("status", "published")
        .eq("visibility", "public")
        .neq("id", currentExperienceId)
        .eq("experience_companies.company_id", companyId)
        .gte("experience_dates.start_datetime", new Date().toISOString())
        .limit(6);

      if (data) {
        const seen = new Set<string>();
        const mapped: Experience[] = [];
        for (const e of data as any[]) {
          if (seen.has(e.id)) continue;
          seen.add(e.id);
          mapped.push({
            id: e.id,
            title: e.title,
            description: e.description,
            image_url: e.image_url,
            association_name: e.association_name,
            association_logo_url: (e.associations as any)?.logo_url ?? null,
            city: e.city,
            address: e.address,
            category: e.category,
            sdgs: e.sdgs ?? [],
            experience_dates: [],
          });
        }
        setExperiences(mapped);
      }
      setLoading(false);
    };

    fetch();
  }, [cityId, currentExperienceId, companyId]);

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [experiences.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.8);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  if (!loading && experiences.length === 0) return null;

  return (
    <section>
      <div className="flex items-end justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold text-foreground">
          {cityName ? `Altre esperienze a ${cityName}` : "Altre esperienze nella stessa città"}
        </h2>
        <div className="hidden lg:flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => scrollBy(-1)}
            disabled={!canScrollLeft}
            aria-label="Scorri indietro"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => scrollBy(1)}
            disabled={!canScrollRight}
            aria-label="Scorri avanti"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-[165px] h-[200px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      ) : (
        <div className="relative">
          <div
            ref={scrollerRef}
            className="flex items-start gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:pr-12 scrollbar-hide scroll-smooth"
          >
            {experiences.map((exp, i) => (
              <ExperienceCardCompact key={exp.id} experience={exp} index={i} />
            ))}
          </div>
          <div className="hidden lg:block pointer-events-none absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-background to-transparent" />
        </div>
      )}
    </section>
  );
}
