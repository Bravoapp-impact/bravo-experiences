import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ExperienceCardCompact } from "@/components/experiences/ExperienceCardCompact";
import { supabase } from "@/integrations/supabase/client";
import type { Experience } from "@/types/experiences";

interface RelatedExperiencesProps {
  currentExperienceId: string;
  cityId: string | null;
  companyId: string | null;
}

export function RelatedExperiences({ currentExperienceId, cityId, companyId }: RelatedExperiencesProps) {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

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
        // Deduplicate (inner join on dates may return duplicates)
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

  if (!loading && experiences.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-6">
        Altre esperienze nella stessa città
      </h2>
      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-[165px] h-[200px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
          {experiences.map((exp, i) => (
            <ExperienceCardCompact key={exp.id} experience={exp} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
