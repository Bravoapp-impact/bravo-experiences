import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { impactKeys } from "./keys";

export interface UserImpact {
  total_hours: number;
  total_participations: number;
  distinct_experiences: number;
  last_participation_at: string | null;
  sdgs_touched: string[];
}

/**
 * Reads the current user's row from `v_volunteering_employee_impact`.
 * The view filters by the current authenticated user, so we don't pass any
 * extra `where` clause here.
 */
export function useUserImpact(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? impactKeys.userFor(userId) : impactKeys.user(),
    queryFn: async (): Promise<UserImpact | null> => {
      const { data, error } = await supabase
        .from("v_volunteering_employee_impact" as any)
        .select(
          "total_hours, total_participations, distinct_experiences, last_participation_at, sdgs_touched",
        )
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as any;
      return {
        total_hours: Number(row.total_hours) || 0,
        total_participations: Number(row.total_participations) || 0,
        distinct_experiences: Number(row.distinct_experiences) || 0,
        last_participation_at: row.last_participation_at ?? null,
        sdgs_touched: Array.isArray(row.sdgs_touched) ? row.sdgs_touched : [],
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
}
