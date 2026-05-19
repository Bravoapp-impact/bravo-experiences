import { useMemo, useState } from "react";
import { RowsPhotoAlbum, type Photo as AlbumPhoto } from "react-photo-album";
import "react-photo-album/rows.css";

import { useAuth } from "@/hooks/useAuth";
import { useExperiencePhotosForEmployee } from "@/hooks/queries/gallery/useExperiencePhotosForEmployee";
import { useSignedPhotoUrls } from "@/hooks/queries/gallery/useSignedPhotoUrls";
import { useImageDimensions } from "@/hooks/queries/gallery/useImageDimensions";
import { Skeleton } from "@/components/ui/skeleton";
import { ExperiencePhotosLightbox } from "./ExperiencePhotosLightbox";

type AlbumPhotoWithId = AlbumPhoto & { photoId: string };

interface Props {
  experienceId: string;
}

/**
 * Employee-facing "past experience photos" section. Renders nothing when
 * no approved photos exist for the current company, so first-time-activated
 * experiences don't show an empty/broken state.
 */
export function ExperiencePhotosSection({ experienceId }: Props) {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? null;

  const { data: photos = [], isLoading } = useExperiencePhotosForEmployee(
    experienceId,
    companyId,
  );

  const paths = useMemo(() => photos.map((p) => p.storage_path), [photos]);
  const { data: signedUrls = {} } = useSignedPhotoUrls(paths);
  const dims = useImageDimensions(Object.values(signedUrls));

  const album: AlbumPhotoWithId[] = useMemo(
    () =>
      photos
        .map((p) => {
          const src = signedUrls[p.storage_path];
          if (!src) return null;
          const d = dims[src] ?? { width: 1200, height: 900 };
          return {
            src,
            width: d.width,
            height: d.height,
            key: p.id,
            photoId: p.id,
          } as AlbumPhotoWithId;
        })
        .filter((x): x is AlbumPhotoWithId => x !== null),
    [photos, signedUrls, dims],
  );

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <section>
        <h2 className="text-2xl font-semibold mb-2">Foto delle esperienze passate</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Ecco com'è andata per chi è venuto prima di te.
        </p>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-md" />
          ))}
        </div>
      </section>
    );
  }

  if (photos.length === 0) return null;

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-2">Foto delle esperienze passate</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Ecco com'è andata per chi è venuto prima di te.
      </p>

      <div className="overflow-hidden rounded-2xl">
        <RowsPhotoAlbum<AlbumPhotoWithId>
          photos={album}
          spacing={2}
          padding={0}
          componentsProps={{
            button: {
              className: "block min-h-0 p-0 leading-none relative",
              style: { padding: 0, minHeight: 0, lineHeight: 0 },
            },
            image: { className: "block" },
          }}
          targetRowHeight={(containerWidth) =>
            containerWidth < 640 ? 180 : 230
          }
          onClick={({ index }) => setLightboxIndex(index)}
        />
      </div>

      <ExperiencePhotosLightbox
        photos={photos}
        signedUrls={signedUrls}
        index={lightboxIndex ?? 0}
        onIndexChange={setLightboxIndex}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </section>
  );
}
