import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { experienceKeys } from "./keys";
import type { Experience, ExperienceDate } from "@/types/experiences";

/**
 * Employee catalog hook (TanStack Query migration).
 *
 * Mirrors the legacy inline `fetchExperiences` from `src/pages/Experiences.tsx`,
 * with the same four steps: resolve company → resolve allowed experience IDs →
 * fetch published experiences → fetch future dates separately and merge.
 *
 * IMPORTANT: dates are fetched as a separate query on purpose. RLS policies on
 * `experience_dates` enforce per-company isolation; merging into a single
 * Supabase join would risk bypassing them. Do not "optimise" this.
 *
 * Business rule: experiences with no future dates are excluded from the result.
 *
 * See docs/data-fetching.md.
 */

const STALE_TIME_MS = 1000 * 60 * 2; // 2 minutes — HR activations are infrequent.

interface ExperienceDateRow extends ExperienceDate {
  experience_id: string;
}

export function useEmployeeCatalog(userId: string | undefined) {
  return useQuery({
    queryKey: experienceKeys.catalogFor("employee", userId ?? ""),
    enabled: !!userId,
    staleTime: STALE_TIME_MS,
    queryFn: async (): Promise<Experience[]> => {
      // 1. Resolve user's company_id from user_tenants.
      const { data: tenant } = await supabase
        .from("user_tenants")
        .select("company_id")
        .eq("user_id", userId!)
        .single();

      const companyId = tenant?.company_id;

      // 2. Resolve allowed experience IDs curated for this company.
      let allowedExperienceIds: string[] | null = null;
      if (companyId) {
        const { data: ecData, error: ecError } = await supabase
          .from("experience_companies")
          .select("experience_id")
          .eq("company_id", companyId);

        if (ecError) throw ecError;

        allowedExperienceIds = (ecData ?? []).map((r) => r.experience_id);
        if (allowedExperienceIds.length === 0) return [];
      }

      // 3. Fetch published experiences filtered to allowed IDs.
      let query = supabase
        .from("experiences")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (allowedExperienceIds) {
        query = query.in("id", allowedExperienceIds);
      }

      const { data: expData, error: expError } = await query;
      if (expError) throw expError;

      // 3b. Fetch association names/logos via the public view (RLS on
      //     `associations` blocks employees from joining the table directly).
      const associationIds = Array.from(
        new Set(
          (expData ?? [])
            .map((e: any) => e.association_id)
            .filter((id: string | null): id is string => !!id),
        ),
      );

      const associationsById = new Map<string, { name: string | null; logo_url: string | null }>();
      if (associationIds.length > 0) {
        const { data: assocData, error: assocError } = await supabase
          .from("associations_public" as any)
          .select("id, name, logo_url")
          .in("id", associationIds);
        if (assocError) throw assocError;
        (assocData as any[] | null)?.forEach((a) => {
          associationsById.set(a.id, { name: a.name, logo_url: a.logo_url });
        });
      }

      const baseExperiences = (expData ?? []).map((exp: any) => {
        const assoc = exp.association_id ? associationsById.get(exp.association_id) : null;
        return {
          id: exp.id,
          title: exp.title,
          description: exp.description,
          image_url: exp.image_url,
          association_name: assoc?.name ?? exp.association_name ?? null,
          association_logo_url: assoc?.logo_url ?? null,
          city: exp.city,
          address: exp.address,
          category: exp.category,
          sdgs: exp.sdgs ?? [],
          participant_info: exp.participant_info ?? null,
        };
      }) as Experience[];

      if (baseExperiences.length === 0) return [];

      // 4. Fetch future dates separately so that date-level RLS (company
      //    isolation) is applied, then merge.
      const experienceIds = baseExperiences.map((e) => e.id);
      const { data: datesData, error: datesError } = await supabase
        .from("experience_dates")
        .select("id, experience_id, start_datetime, end_datetime, max_participants")
        .in("experience_id", experienceIds)
        .gte("start_datetime", new Date().toISOString())
        .order("start_datetime", { ascending: true });

      if (datesError) throw datesError;

      const datesByExperienceId = new Map<string, ExperienceDate[]>();
      (datesData as ExperienceDateRow[] | null)?.forEach((d) => {
        const { experience_id, ...date } = d;
        const list = datesByExperienceId.get(experience_id) ?? [];
        list.push(date);
        datesByExperienceId.set(experience_id, list);
      });

      // Business rule: drop experiences that have no future dates.
      return baseExperiences
        .map((exp) => ({
          ...exp,
          experience_dates: datesByExperienceId.get(exp.id) ?? [],
        }))
        .filter((exp) => (exp.experience_dates?.length ?? 0) > 0);
    },
  });
}
