import { useMutation, useQueryClient } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";
import { galleryKeys } from "./keys";

interface UploadInput {
  files: File[];
  userId: string;
  companyId: string;
  experienceDateId: string;
  onProgress?: (current: number, total: number) => void;
}

const COMPRESS_OPTS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
  fileType: "image/jpeg",
  initialQuality: 0.85,
};

/**
 * HR upload: photos are auto-approved by the DB trigger
 * (populate_gallery_photo_metadata sets status='approved' for hr_admin).
 */
export function useHRUploadPhotos() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      files,
      userId,
      companyId,
      experienceDateId,
      onProgress,
    }: UploadInput) => {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        onProgress?.(i + 1, files.length);
        const file = files[i];
        const compressed = await imageCompression(file, COMPRESS_OPTS);
        const uuid = crypto.randomUUID();
        const path = `${companyId}/${experienceDateId}/${uuid}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("gallery-photos")
          .upload(path, compressed, {
            contentType: "image/jpeg",
            upsert: false,
          });
        if (uploadError) throw uploadError;

        const { error: insertError } = await (supabase as any)
          .from("gallery_photos")
          .insert({
            experience_date_id: experienceDateId,
            uploaded_by: userId,
            storage_path: path,
            consent_confirmed: true,
          });

        if (insertError) {
          await supabase.storage.from("gallery-photos").remove([path]);
          throw insertError;
        }
        uploaded.push(path);
      }
      return uploaded;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: galleryKeys.companyAll(vars.companyId) });
    },
  });
}
