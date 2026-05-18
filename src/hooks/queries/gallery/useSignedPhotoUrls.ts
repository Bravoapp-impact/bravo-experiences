import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { galleryKeys } from "./keys";

/**
 * Resolves an array of storage paths to signed URLs (valid 1h).
 * Cached 50 minutes to avoid regenerating constantly.
 */
export function useSignedPhotoUrls(paths: string[]) {
  const stableKey = [...paths].sort();
  return useQuery({
    queryKey: galleryKeys.signedUrls(stableKey),
    queryFn: async () => {
      if (paths.length === 0) return {} as Record<string, string>;
      const { data, error } = await supabase.storage
        .from("gallery-photos")
        .createSignedUrls(paths, 3600);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data ?? []).forEach((entry) => {
        if (entry.path && entry.signedUrl) {
          map[entry.path] = entry.signedUrl;
        }
      });
      return map;
    },
    enabled: paths.length > 0,
    staleTime: 50 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
