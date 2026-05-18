import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { galleryKeys } from "./keys";

interface Input {
  photoId: string;
  caption: string | null;
  companyId: string;
}

export function useUpdatePhotoCaption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ photoId, caption }: Input) => {
      const { error } = await (supabase as any)
        .from("gallery_photos")
        .update({ caption: caption?.trim() || null })
        .eq("id", photoId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: galleryKeys.companyAll(vars.companyId) });
    },
  });
}
