import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Experience } from "@/types/experiences";

interface HookResult {
  experiences: Experience[];
  loading: boolean;
}

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

/**
 * Employee context: fetches experiences in the same city, activated for the user's
 * company (joined via experience_companies), excluding the current one, with future dates.
 */
export function useRelatedExperiencesForEmployee(params: {
  currentExperienceId: string;
  cityId: string | null;
  companyId: string | null;
}): HookResult {
  const { currentExperienceId, cityId, companyId } = params;
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
        const seen = new Set<string>();
        const mapped: Experience[] = [];
        for (const e of data as any[]) {
          if (seen.has(e.id)) continue;
          seen.add(e.id);
          mapped.push(mapRow(e));
        }
        setExperiences(mapped);
      }
      setLoading(false);
    };

    fetch();
  }, [cityId, currentExperienceId, companyId]);

  return { experiences, loading };
}

/**
 * HR context: fetches experiences in the same city that are NOT yet activated
 * for the HR's company (i.e. not present in experience_companies for that company),
 * with future dates, excluding the current one.
 */
export function useRelatedExperiencesForHR(params: {
  currentExperienceId: string;
  cityId: string | null;
  companyId: string | null;
}): HookResult {
  const { currentExperienceId, cityId, companyId } = params;
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cityId || !companyId) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);

      // 1. Get all experience IDs already activated for this company
      const { data: activated } = await supabase
        .from("experience_companies")
        .select("experience_id")
        .eq("company_id", companyId);

      const activatedIds = new Set((activated || []).map((r) => r.experience_id));
      // Also exclude the current experience id
      const excludeIds = Array.from(activatedIds);
      if (!excludeIds.includes(currentExperienceId)) {
        excludeIds.push(currentExperienceId);
      }

      // 2. Fetch published public experiences in the same city, with future dates
      let query = supabase
        .from("experiences")
        .select(`
          id, title, description, image_url, association_name, city, address, category, sdgs,
          associations:association_id (logo_url),
          experience_dates!inner (id, start_datetime)
        `)
        .eq("city_id", cityId)
        .eq("status", "published")
        .eq("visibility", "public")
        .gte("experience_dates.start_datetime", new Date().toISOString())
        .limit(6);

      if (excludeIds.length > 0) {
        query = query.not("id", "in", `(${excludeIds.join(",")})`);
      }

      const { data } = await query;

      if (data) {
        const seen = new Set<string>();
        const mapped: Experience[] = [];
        for (const e of data as any[]) {
          if (seen.has(e.id)) continue;
          seen.add(e.id);
          mapped.push(mapRow(e));
        }
        setExperiences(mapped);
      }
      setLoading(false);
    };

    fetch();
  }, [cityId, currentExperienceId, companyId]);

  return { experiences, loading };
}
