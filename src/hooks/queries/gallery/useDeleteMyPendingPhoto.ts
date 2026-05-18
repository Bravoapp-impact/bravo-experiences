import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { galleryKeys } from "./keys";

interface DeleteInput {
  photoId: string;
  storagePath: string;
  userId: string;
}

export function useDeleteMyPendingPhoto() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, storagePath }: DeleteInput) => {
      const { error } = await (supabase as any)
        .from("gallery_photos")
        .delete()
        .eq("id", photoId);
      if (error) throw error;

      // Best effort cleanup of storage object
      await supabase.storage.from("gallery-photos").remove([storagePath]);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: galleryKeys.myPhotos(vars.userId) });
      qc.invalidateQueries({ queryKey: galleryKeys.all });
    },
  });
}
