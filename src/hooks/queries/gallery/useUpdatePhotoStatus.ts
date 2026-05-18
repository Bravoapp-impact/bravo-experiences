import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { galleryKeys } from "./keys";

interface SetStatusInput {
  photoId: string;
  status: "approved" | "hidden";
  companyId: string;
}

interface DeleteInput {
  photoId: string;
  companyId: string;
}

export function useUpdatePhotoStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ photoId, status }: SetStatusInput) => {
      const { error } = await (supabase as any)
        .from("gallery_photos")
        .update({ status })
        .eq("id", photoId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: galleryKeys.companyAll(vars.companyId) });
    },
  });
}

/**
 * Hard delete a photo. The `gallery_photos_storage_cleanup` AFTER DELETE
 * trigger removes the matching object from the storage bucket.
 */
export function useDeletePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ photoId }: DeleteInput) => {
      const { error } = await (supabase as any)
        .from("gallery_photos")
        .delete()
        .eq("id", photoId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: galleryKeys.companyAll(vars.companyId) });
    },
  });
}
