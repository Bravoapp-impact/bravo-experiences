import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { galleryKeys } from "./keys";

export interface ExperiencePhotoForEmployee {
  id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
  experience_date_id: string;
  start_datetime: string | null;
}

/**
 * Approved gallery photos for a given experience, scoped to the logged
 * employee's company. Company + gallery-visible gating is enforced by RLS
 * (policy "Employees view approved company photos for visible gallery").
 */
export function useExperiencePhotosForEmployee(
  experienceId: string | null | undefined,
  companyId: string | null | undefined,
) {
  return useQuery({
    queryKey: galleryKeys.experiencePhotos(experienceId ?? "", companyId ?? ""),
    queryFn: async () => {
      if (!experienceId || !companyId) return [] as ExperiencePhotoForEmployee[];

      // 1. Get all experience_dates for this experience
      const { data: dates, error: datesErr } = await supabase
        .from("experience_dates")
        .select("id, start_datetime")
        .eq("experience_id", experienceId);
      if (datesErr) throw datesErr;
      if (!dates?.length) return [];

      const dateIds = dates.map((d) => d.id);
      const dateMap = new Map(dates.map((d) => [d.id, d.start_datetime]));

      // 2. Fetch approved photos for those dates (RLS handles company gating)
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("id, storage_path, caption, created_at, experience_date_id")
        .eq("status", "approved")
        .in("experience_date_id", dateIds)
        .order("created_at", { ascending: false });
      if (error) throw error;

      return (data ?? []).map((p) => ({
        ...p,
        start_datetime: dateMap.get(p.experience_date_id) ?? null,
      })) as ExperiencePhotoForEmployee[];
    },
    enabled: !!experienceId && !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
