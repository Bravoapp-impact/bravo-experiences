import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { galleryKeys } from "./keys";

interface ModerateInput {
  photoIds: string[];
  action: "approve" | "reject";
  rejectionReason?: string;
  companyId: string;
}

export function useModeratePhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      photoIds,
      action,
      rejectionReason,
    }: ModerateInput) => {
      if (photoIds.length === 0) return [];
      const { data: userResp } = await supabase.auth.getUser();
      const reviewerId = userResp.user?.id ?? null;

      const patch: Record<string, unknown> = {
        status: action === "approve" ? "approved" : "rejected",
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      };
      if (action === "reject") {
        patch.rejection_reason = rejectionReason?.trim() || null;
      }

      const { error } = await (supabase as any)
        .from("gallery_photos")
        .update(patch)
        .in("id", photoIds);
      if (error) throw error;
      return photoIds;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: galleryKeys.companyAll(vars.companyId) });
    },
  });
}
