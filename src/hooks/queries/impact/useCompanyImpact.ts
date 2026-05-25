import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { impactKeys } from "./keys";

export interface CompanyImpact {
  unique_participants: number;
  registered_users: number;
  participation_rate: number;
  total_hours: number;
  avg_hours_per_participant: number;
  total_participations: number;
  distinct_experiences: number;
  ets_count: number;
  cities_count: number;
  sdgs_touched: string[];
  avg_rating: number | null;
  would_recommend_rate: number | null;
  reviews_count: number;
}

/**
 * Reads the HR's company row from `v_volunteering_company_impact`.
 * The view scopes by the current user's company, so no filter is needed.
 */
export function useCompanyImpact(companyId: string | undefined) {
  return useQuery({
    queryKey: companyId
      ? impactKeys.companyFor(companyId)
      : impactKeys.company(),
    queryFn: async (): Promise<CompanyImpact | null> => {
      const { data, error } = await supabase
        .from("v_volunteering_company_impact" as any)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as any;
      return {
        unique_participants: Number(row.unique_participants) || 0,
        registered_users: Number(row.registered_users) || 0,
        participation_rate: Number(row.participation_rate) || 0,
        total_hours: Number(row.total_hours) || 0,
        avg_hours_per_participant: Number(row.avg_hours_per_participant) || 0,
        total_participations: Number(row.total_participations) || 0,
        distinct_experiences: Number(row.distinct_experiences) || 0,
        ets_count: Number(row.ets_count) || 0,
        cities_count: Number(row.cities_count) || 0,
        sdgs_touched: Array.isArray(row.sdgs_touched) ? row.sdgs_touched : [],
        avg_rating: row.avg_rating == null ? null : Number(row.avg_rating),
        would_recommend_rate:
          row.would_recommend_rate == null
            ? null
            : Number(row.would_recommend_rate),
        reviews_count: Number(row.reviews_count) || 0,
      };
    },
    enabled: !!companyId,
    staleTime: 1000 * 60,
  });
}
