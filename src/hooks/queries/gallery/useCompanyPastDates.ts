import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyPastDate {
  id: string;
  start_datetime: string;
  experience_id: string;
  experience_title: string;
}

/**
 * Past experience dates of experiences activated for the given company.
 * Used by HR to pick the event when uploading photos directly.
 */
export function useCompanyPastDates(companyId: string | null | undefined) {
  return useQuery({
    queryKey: ["gallery", "hr-upload-dates", companyId ?? ""],
    queryFn: async () => {
      if (!companyId) return [] as CompanyPastDate[];

      const { data: ec, error: ecErr } = await supabase
        .from("experience_companies")
        .select("experience_id")
        .eq("company_id", companyId);
      if (ecErr) throw ecErr;

      const experienceIds = (ec ?? []).map((r) => r.experience_id);
      if (experienceIds.length === 0) return [];

      const { data, error } = await supabase
        .from("experience_dates")
        .select(
          `id, start_datetime,
           experiences!inner (id, title)`,
        )
        .in("experience_id", experienceIds)
        .lte("start_datetime", new Date().toISOString())
        .order("start_datetime", { ascending: false })
        .limit(200);
      if (error) throw error;

      return (data ?? []).map((d: any) => ({
        id: d.id,
        start_datetime: d.start_datetime,
        experience_id: d.experiences.id,
        experience_title: d.experiences.title,
      })) as CompanyPastDate[];
    },
    enabled: !!companyId,
    staleTime: 60 * 1000,
  });
}
