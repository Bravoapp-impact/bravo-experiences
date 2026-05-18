import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { galleryKeys } from "./keys";

interface Input {
  photoId: string;
  isFeatured: boolean;
  companyId: string;
}

export function useTogglePhotoFeatured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ photoId, isFeatured }: Input) => {
      const { error } = await (supabase as any)
        .from("gallery_photos")
        .update({ is_featured: isFeatured })
        .eq("id", photoId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: galleryKeys.companyAll(vars.companyId) });
    },
  });
}
