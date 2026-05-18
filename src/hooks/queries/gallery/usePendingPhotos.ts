import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { galleryKeys } from "./keys";

export interface PendingPhoto {
  id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
  experience_date_id: string;
  uploaded_by: string | null;
  uploader_profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  experience_dates?: {
    id: string;
    start_datetime: string;
    experiences?: {
      id: string;
      title: string;
      association_name: string | null;
    } | null;
  } | null;
}

export function usePendingPhotos(companyId: string | null | undefined) {
  return useQuery({
    queryKey: galleryKeys.pendingPhotos(companyId ?? ""),
    queryFn: async () => {
      if (!companyId) return [] as PendingPhoto[];
      const { data, error } = await (supabase as any)
        .from("gallery_photos")
        .select(
          `id, storage_path, caption, created_at, experience_date_id, uploaded_by,
           uploader_profile:profiles!gallery_photos_uploaded_by_fkey ( id, first_name, last_name ),
           experience_dates (
             id, start_datetime,
             experiences ( id, title, association_name )
           )`,
        )
        .eq("company_id", companyId)
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PendingPhoto[];
    },
    enabled: !!companyId,
    staleTime: 15 * 1000,
  });
}
