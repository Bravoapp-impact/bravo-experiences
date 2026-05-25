import { useMemo, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMyPhotosForEvent } from "@/hooks/queries/gallery/useMyPhotos";
import { useSignedPhotoUrls } from "@/hooks/queries/gallery/useSignedPhotoUrls";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

interface Props {
  experienceDateId: string;
  onUploadClick?: () => void;
}

export function MyEventPhotosSection({ experienceDateId, onUploadClick }: Props) {
  const { user } = useAuth();
  const { data: photos = [], isLoading } = useMyPhotosForEvent(user?.id, experienceDateId);
  const paths = useMemo(() => photos.map((p) => p.storage_path), [photos]);
  const { data: signedUrls = {} } = useSignedPhotoUrls(paths);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <section>
      <h3 className="text-base font-semibold text-foreground mb-3">Le tue foto</h3>

      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="rounded-xl bg-muted/30 border border-border p-4 flex flex-col items-center text-center gap-2">
          <Camera className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Non hai ancora caricato foto per questa esperienza.
          </p>
          {onUploadClick && (
            <Button
              size="sm"
              variant="outline"
              onClick={onUploadClick}
              className="mt-1"
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              Carica le tue foto
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((p, i) => {
              const url = signedUrls[p.storage_path];
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => url && setLightboxIndex(i)}
                  className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                >
                  {url ? (
                    <img
                      src={url}
                      alt={p.caption ?? ""}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <Skeleton className="w-full h-full" />
                  )}
                  {p.status !== "approved" && (
                    <div className="absolute inset-x-1 bottom-1">
                      <Badge
                        variant={p.status === "pending" ? "secondary" : "destructive"}
                        className="w-full justify-center text-[10px] py-0.5"
                      >
                        {p.status === "pending" ? "In revisione" : "Non approvata"}
                      </Badge>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {onUploadClick && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onUploadClick}
              className="mt-3"
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              Aggiungi altre foto
            </Button>
          )}
          <Lightbox
            open={lightboxIndex !== null}
            close={() => setLightboxIndex(null)}
            index={lightboxIndex ?? 0}
            on={{ view: ({ index }) => setLightboxIndex(index) }}
            slides={photos.map((p) => ({ src: signedUrls[p.storage_path] ?? "" }))}
            plugins={[Zoom]}
          />
        </>
      )}
    </section>
  );
}
