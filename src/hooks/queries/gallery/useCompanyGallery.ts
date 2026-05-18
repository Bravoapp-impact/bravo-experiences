import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { galleryKeys, type CompanyGalleryFilters } from "./keys";

export interface CompanyGalleryPhoto {
  id: string;
  storage_path: string;
  status: "approved" | "hidden" | "pending" | "rejected";
  is_featured: boolean;
  caption: string | null;
  created_at: string;
  uploaded_by: string | null;
  uploader_profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  experience_date_id: string;
  experience_dates?: {
    id: string;
    start_datetime: string;
    experiences?: {
      id: string;
      title: string;
      association_id: string | null;
      association_name: string | null;
    } | null;
  } | null;
}

export function useCompanyGallery(
  companyId: string | null | undefined,
  filters: CompanyGalleryFilters = {},
) {
  return useQuery({
    queryKey: galleryKeys.companyGallery(companyId ?? "", filters),
    queryFn: async () => {
      if (!companyId) return [] as CompanyGalleryPhoto[];

      const statuses = filters.includeHidden
        ? ["approved", "hidden"]
        : ["approved"];

      let query = (supabase as any)
        .from("gallery_photos")
        .select(
          `id, storage_path, status, is_featured, caption, created_at,
           uploaded_by, experience_date_id,
           uploader_profile:profiles!gallery_photos_uploaded_by_fkey ( id, first_name, last_name ),
           experience_dates (
             id, start_datetime,
             experiences ( id, title, association_id, association_name )
           )`,
        )
        .eq("company_id", companyId)
        .in("status", statuses)
        .order("created_at", { ascending: false });

      if (filters.onlyFeatured) {
        query = query.eq("is_featured", true);
      }
      if (filters.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = (data ?? []) as CompanyGalleryPhoto[];

      // Filter by experience / association in JS to avoid join-filter complexity
      if (filters.experienceIds?.length) {
        const ids = new Set(filters.experienceIds);
        result = result.filter((p) =>
          ids.has(p.experience_dates?.experiences?.id ?? ""),
        );
      }
      if (filters.associationIds?.length) {
        const ids = new Set(filters.associationIds);
        result = result.filter((p) =>
          ids.has(p.experience_dates?.experiences?.association_id ?? ""),
        );
      }
      return result;
    },
    enabled: !!companyId,
    staleTime: 30 * 1000,
  });
}
