import { useState } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { devLog } from "@/lib/logger";
import type { CompanyGalleryPhoto } from "./useCompanyGallery";

const MAX_PHOTOS_PER_ZIP = 200;

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "foto";
}

function inferExtension(path: string, contentType: string | null): string {
  const fromPath = path.split(".").pop();
  if (fromPath && fromPath.length <= 5) return fromPath.toLowerCase();
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("heic")) return "heic";
  return "jpg";
}

export function useBulkDownloadPhotos() {
  const [isPending, setIsPending] = useState(false);

  const download = async (photos: CompanyGalleryPhoto[]) => {
    if (photos.length === 0) return;
    if (photos.length > MAX_PHOTOS_PER_ZIP) {
      toast.error(
        `Puoi scaricare al massimo ${MAX_PHOTOS_PER_ZIP} foto alla volta.`,
      );
      return;
    }

    setIsPending(true);
    const toastId = toast.loading(`Preparazione ZIP… 0/${photos.length}`);

    try {
      // Generate fresh signed URLs (1h validity) for all selected paths
      const paths = photos.map((p) => p.storage_path);
      const { data: signed, error: signErr } = await supabase.storage
        .from("gallery-photos")
        .createSignedUrls(paths, 3600);
      if (signErr) throw signErr;

      const urlByPath = new Map<string, string>();
      (signed ?? []).forEach((s) => {
        if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
      });

      const zip = new JSZip();
      const usedNames = new Set<string>();
      let completed = 0;

      // Sequential to keep memory + progress UI sane; gallery downloads are not perf-critical
      for (const photo of photos) {
        const url = urlByPath.get(photo.storage_path);
        if (!url) {
          devLog.warn("missing signed url for", photo.storage_path);
          completed += 1;
          continue;
        }

        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();

          const exp = photo.experience_dates?.experiences?.title ?? "foto";
          const eventDate = photo.experience_dates?.start_datetime
            ? format(new Date(photo.experience_dates.start_datetime), "yyyy-MM-dd")
            : "";
          const ext = inferExtension(photo.storage_path, blob.type);
          const base = sanitizeFilename(
            [eventDate, exp].filter(Boolean).join("_"),
          );

          let candidate = `${base}.${ext}`;
          let n = 2;
          while (usedNames.has(candidate)) {
            candidate = `${base}_${n}.${ext}`;
            n += 1;
          }
          usedNames.add(candidate);

          zip.file(candidate, blob);
        } catch (e) {
          devLog.warn("download error for", photo.storage_path, e);
        }

        completed += 1;
        toast.loading(`Preparazione ZIP… ${completed}/${photos.length}`, {
          id: toastId,
        });
      }

      toast.loading("Compressione…", { id: toastId });
      const zipBlob = await zip.generateAsync({ type: "blob" });

      const fileName = `galleria-${format(new Date(), "yyyyMMdd-HHmm")}.zip`;
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast.success(`ZIP pronto (${photos.length} foto).`, { id: toastId });
    } catch (e: any) {
      toast.error(e?.message || "Errore durante la creazione dello ZIP.", {
        id: toastId,
      });
    } finally {
      setIsPending(false);
    }
  };

  return { download, isPending };
}
