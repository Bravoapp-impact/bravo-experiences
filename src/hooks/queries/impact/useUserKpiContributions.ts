import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { impactKeys } from "./keys";

export interface UserKpiContribution {
  experience_id: string;
  kpi_id: string;
  kpi_label: string;
  total_value: number;
}

/**
 * Reads the current user's KPI contributions from
 * `v_volunteering_employee_kpi_contributions`. The view scopes by the
 * authenticated user, so no additional filter is needed.
 */
export function useUserKpiContributions(userId: string | undefined) {
  return useQuery({
    queryKey: userId
      ? impactKeys.kpiContributionsFor(userId)
      : impactKeys.kpiContributions(),
    queryFn: async (): Promise<UserKpiContribution[]> => {
      const { data, error } = await supabase
        .from("v_volunteering_employee_kpi_contributions" as any)
        .select("experience_id, kpi_id, kpi_label, total_value");
      if (error) throw error;
      return ((data ?? []) as any[]).map((row) => ({
        experience_id: row.experience_id,
        kpi_id: row.kpi_id,
        kpi_label: row.kpi_label,
        total_value: Number(row.total_value) || 0,
      }));
    },
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
}
