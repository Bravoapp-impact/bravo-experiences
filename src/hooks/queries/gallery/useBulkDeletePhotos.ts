import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { galleryKeys } from "./keys";
import { devLog } from "@/lib/logger";

interface BulkDeleteInput {
  photos: { id: string; storage_path: string }[];
  companyId: string;
}

/**
 * Bulk-deletes photos: removes objects from the storage bucket first,
 * then deletes the DB rows in a single `.in("id", ...)` call.
 * Storage errors are logged but don't block the DB delete (an orphan
 * file in the bucket is less bad than a ghost row in the gallery).
 */
export function useBulkDeletePhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ photos, companyId: _c }: BulkDeleteInput) => {
      if (photos.length === 0) return;

      const paths = photos.map((p) => p.storage_path).filter(Boolean);
      if (paths.length > 0) {
        const { error: storageErr } = await supabase.storage
          .from("gallery-photos")
          .remove(paths);
        if (storageErr) {
          devLog.warn("bulk delete storage error", storageErr);
        }
      }

      const ids = photos.map((p) => p.id);
      const { error } = await (supabase as any)
        .from("gallery_photos")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: galleryKeys.companyAll(vars.companyId) });
    },
  });
}
