import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Experience } from "@/types/experiences";
import { experienceKeys, type RelatedExperiencesParams } from "./keys";

/**
 * Related experiences hooks (TanStack Query migration).
 *
 * Two contexts share the same Supabase shape but differ in filtering:
 * - employee: experiences activated for the user's company (joined via
 *   experience_companies) in the same city, with future dates.
 * - hr: experiences in the same city that are NOT yet activated for the HR's
 *   company — discovery surface for activation.
 *
 * Underlying queries are unchanged from the legacy hook; only fetching/caching
 * is reorganised. See docs/data-fetching.md.
 */

const STALE_TIME_MS = 1000 * 60 * 2; // 2 minutes — activation is rare/manual.

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

/**
 * HR context: experiences in the same city, with at least one future date,
 * NOT yet activated for the HR's company, excluding the current one.
 */
export function useRelatedExperiencesForHR(params: RelatedExperiencesParams) {
  const { currentExperienceId, cityId, companyId } = params;

  return useQuery({
    queryKey: experienceKeys.relatedFor("hr", params),
    enabled: !!cityId && !!companyId,
    staleTime: STALE_TIME_MS,
    queryFn: async (): Promise<Experience[]> => {
      // 1. IDs already activated for this company.
      const { data: activated, error: activatedError } = await supabase
        .from("experience_companies")
        .select("experience_id")
        .eq("company_id", companyId!);

      if (activatedError) throw activatedError;

      const excludeIds = new Set<string>((activated ?? []).map((r) => r.experience_id));
      excludeIds.add(currentExperienceId);

      // 2. Published public experiences in the same city with future dates.
      let query = supabase
        .from("experiences")
        .select(`
          id, title, description, image_url, association_name, city, address, category, sdgs,
          associations:association_id (logo_url),
          experience_dates!inner (id, start_datetime)
        `)
        .eq("city_id", cityId!)
        .eq("status", "published")
        .eq("visibility", "public")
        .gte("experience_dates.start_datetime", new Date().toISOString())
        .limit(6);

      const excludeArr = Array.from(excludeIds);
      if (excludeArr.length > 0) {
        query = query.not("id", "in", `(${excludeArr.join(",")})`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return dedupe((data ?? []) as any[]);
    },
  });
}
