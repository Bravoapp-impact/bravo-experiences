import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { impactKeys } from "./keys";

export interface CompanyKpiRow {
  experience_id: string;
  experience_title: string;
  kpi_label: string;
  total_value: number;
}

/**
 * Reads the HR's company KPI breakdown from
 * `v_volunteering_company_kpi_breakdown` and enriches each row with the
 * experience title for grouping in the UI.
 */
export function useCompanyKpiBreakdown(companyId: string | undefined) {
  return useQuery({
    queryKey: companyId
      ? impactKeys.companyKpiBreakdownFor(companyId)
      : impactKeys.companyKpiBreakdown(),
    queryFn: async (): Promise<CompanyKpiRow[]> => {
      const { data, error } = await supabase
        .from("v_volunteering_company_kpi_breakdown" as any)
        .select("experience_id, kpi_label, total_value");
      if (error) throw error;
      const rows = ((data ?? []) as any[]).map((r) => ({
        experience_id: r.experience_id as string,
        kpi_label: r.kpi_label as string,
        total_value: Number(r.total_value) || 0,
      }));

      const ids = Array.from(new Set(rows.map((r) => r.experience_id)));
      if (ids.length === 0) return [];

      const { data: experiences, error: expErr } = await supabase
        .from("experiences")
        .select("id, title")
        .in("id", ids);
      if (expErr) throw expErr;
      const titleById = new Map<string, string>(
        (experiences ?? []).map((e: any) => [e.id, e.title]),
      );

      return rows.map((r) => ({
        ...r,
        experience_title: titleById.get(r.experience_id) ?? "Esperienza",
      }));
    },
    enabled: !!companyId,
    staleTime: 1000 * 60,
  });
}
