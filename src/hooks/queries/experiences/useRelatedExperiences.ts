import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Experience } from "@/types/experiences";
import { experienceKeys, type RelatedExperiencesParams } from "./keys";

/**
 * Related experiences hook (TanStack Query).
 *
 * Employee context: experiences activated for the user's company (joined via
 * experience_companies) in the same city, with future dates.
 *
 * The HR-side variant has been removed: HR no longer curates the catalog.
 */

const STALE_TIME_MS = 1000 * 60 * 2;

const mapRow = (e: any): Experience => ({
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

const dedupe = (rows: any[]): Experience[] => {
  const seen = new Set<string>();
  const out: Experience[] = [];
  for (const e of rows) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(mapRow(e));
  }
  return out;
};

/**
 * Employee context: experiences in the same city, activated for the user's
 * company, with at least one future date, excluding the current one.
 */
export function useRelatedExperiencesForEmployee(params: RelatedExperiencesParams) {
  const { currentExperienceId, cityId, companyId } = params;

  return useQuery({
    queryKey: experienceKeys.relatedFor("employee", params),
    enabled: !!cityId && !!companyId,
    staleTime: STALE_TIME_MS,
    queryFn: async (): Promise<Experience[]> => {
      const { data, error } = await supabase
        .from("experiences")
        .select(`
          id, title, description, image_url, association_name, city, address, category, sdgs,
          associations:association_id (logo_url),
          experience_companies!inner (company_id),
          experience_dates!inner (id, start_datetime)
        `)
        .eq("city_id", cityId!)
        .eq("status", "published")
        .eq("visibility", "public")
        .neq("id", currentExperienceId)
        .eq("experience_companies.company_id", companyId!)
        .gte("experience_dates.start_datetime", new Date().toISOString())
        .limit(6);

      if (error) throw error;
      return dedupe((data ?? []) as any[]);
    },
  });
}
