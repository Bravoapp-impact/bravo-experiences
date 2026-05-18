import { useMutation, useQueryClient } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";
import { galleryKeys } from "./keys";

interface UploadPhotoInput {
  file: File;
  userId: string;
  companyId: string;
  experienceDateId: string;
}

interface UploadPhotosInput {
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

export class GalleryLimitReachedError extends Error {
  constructor() {
    super("Hai raggiunto il limite di 20 foto per questo evento.");
    this.name = "GalleryLimitReachedError";
  }
}

async function uploadSinglePhoto({
  file,
  userId,
  companyId,
  experienceDateId,
}: UploadPhotoInput) {
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
    // Best effort cleanup of orphaned storage object
    await supabase.storage.from("gallery-photos").remove([path]);
    const msg = insertError.message || "";
    if (msg.includes("limite di 20 foto") || msg.includes("limit")) {
      throw new GalleryLimitReachedError();
    }
    throw insertError;
  }

  return path;
}

export function useUploadPhotos() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      files,
      userId,
      companyId,
      experienceDateId,
      onProgress,
    }: UploadPhotosInput) => {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        onProgress?.(i + 1, files.length);
        const path = await uploadSinglePhoto({
          file: files[i],
          userId,
          companyId,
          experienceDateId,
        });
        uploaded.push(path);
      }
      return uploaded;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: galleryKeys.myPhotos(vars.userId) });
      qc.invalidateQueries({
        queryKey: galleryKeys.countForEvent(vars.userId, vars.experienceDateId),
      });
    },
  });
}
