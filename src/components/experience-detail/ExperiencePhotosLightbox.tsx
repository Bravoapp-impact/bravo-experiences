import { format } from "date-fns";
import { it } from "date-fns/locale";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";

import type { ExperiencePhotoForEmployee } from "@/hooks/queries/gallery/useExperiencePhotosForEmployee";

interface Props {
  photos: ExperiencePhotoForEmployee[];
  signedUrls: Record<string, string>;
  index: number;
  onIndexChange: (i: number) => void;
  open: boolean;
  onClose: () => void;
}

/**
 * Read-only lightbox for the employee-facing "Foto" section of an
 * experience detail page. No delete, no download, no caption editing.
 */
export function ExperiencePhotosLightbox({
  photos,
  signedUrls,
  index,
  onIndexChange,
  open,
  onClose,
}: Props) {
  const slides = photos.map((p) => {
    const eventDate = p.start_datetime
      ? format(new Date(p.start_datetime), "d MMMM yyyy", { locale: it })
      : "";
    const description = [eventDate, p.caption].filter(Boolean).join("\n");
    return {
      src: signedUrls[p.storage_path] ?? "",
      description,
    };
  });

  if (!photos.length) return null;

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={Math.min(Math.max(0, index), photos.length - 1)}
      on={{ view: ({ index: i }) => onIndexChange(i) }}
      slides={slides}
      plugins={[Captions, Zoom]}
      captions={{ descriptionTextAlign: "start" }}
    />
  );
}
