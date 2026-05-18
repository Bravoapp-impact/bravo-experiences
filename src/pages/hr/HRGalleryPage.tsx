import { useMemo, useState } from "react";
import {
  RowsPhotoAlbum,
  type Photo as AlbumPhoto,
} from "react-photo-album";
import "react-photo-album/rows.css";
import { Image as ImageIcon, ImageOff, AlertCircle } from "lucide-react";
import { HRLayout } from "@/components/layout/HRLayout";
import { PageHeader } from "@/components/common/PageHeader";
import PageSection from "@/components/common/PageSection";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyGallery } from "@/hooks/queries/gallery/useCompanyGallery";
import { usePendingPhotos } from "@/hooks/queries/gallery/usePendingPhotos";
import { useSignedPhotoUrls } from "@/hooks/queries/gallery/useSignedPhotoUrls";
import { useImageDimensions } from "@/hooks/queries/gallery/useImageDimensions";
import {
  GalleryFilters,
  EMPTY_FILTERS,
  type GalleryFiltersState,
  type GalleryFilterOption,
} from "@/components/hr-gallery/GalleryFilters";
import { ModerationQueueDialog } from "@/components/hr-gallery/ModerationQueueDialog";
import { PhotoLightbox } from "@/components/hr-gallery/PhotoLightbox";

export default function HRGalleryPage() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? null;

  const [filters, setFilters] = useState<GalleryFiltersState>(EMPTY_FILTERS);
  const [moderationOpen, setModerationOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const dateFromIso = filters.dateRange?.from
    ? filters.dateRange.from.toISOString()
    : null;
  const dateToIso = filters.dateRange?.to
    ? new Date(
        filters.dateRange.to.getTime() + 24 * 60 * 60 * 1000 - 1,
      ).toISOString()
    : null;

  const { data: photos = [], isLoading } = useCompanyGallery(companyId, {
    experienceIds: filters.experienceIds,
    dateFrom: dateFromIso,
    dateTo: dateToIso,
  });

  // Fetch all (unfiltered) to populate filter options & detect total empty state
  const { data: allPhotos = [] } = useCompanyGallery(companyId, {});

  const { data: pending = [] } = usePendingPhotos(companyId);

  const paths = useMemo(() => photos.map((p) => p.storage_path), [photos]);
  const { data: signedUrls = {} } = useSignedPhotoUrls(paths);
  const dims = useImageDimensions(Object.values(signedUrls));

  const mainPhotos = photos;

  const experienceOptions: GalleryFilterOption[] = useMemo(() => {
    const map = new Map<string, string>();
    allPhotos.forEach((p) => {
      const exp = p.experience_dates?.experiences;
      if (exp?.id && exp.title) map.set(exp.id, exp.title);
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [allPhotos]);

  const buildAlbumPhotos = (list: typeof photos): AlbumPhoto[] =>
    list
      .map((p) => {
        const src = signedUrls[p.storage_path];
        if (!src) return null;
        const d = dims[src] ?? { width: 1200, height: 900 };
        return {
          src,
          width: d.width,
          height: d.height,
          key: p.id,
        } as AlbumPhoto;
      })
      .filter((x): x is AlbumPhoto => x !== null);

  const mainAlbum = useMemo(
    () => buildAlbumPhotos(mainPhotos),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mainPhotos, signedUrls, dims],
  );

  const totalCompanyPhotos = allPhotos.length + pending.length;
  const showEmptyState = !isLoading && totalCompanyPhotos === 0;
  const noResultsForFilters =
    !isLoading && photos.length === 0 && totalCompanyPhotos > 0;

  return (
    <HRLayout>
      <div className="space-y-6">
        <PageHeader title="Galleria" icon={ImageIcon} iconColor="text-amber-500" />

        {/* Moderation banner */}
        {pending.length > 0 && (
          <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-3 min-w-0">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-900">
                Hai <strong>{pending.length}</strong>{" "}
                {pending.length === 1
                  ? "foto in attesa"
                  : "foto in attesa"}{" "}
                di approvazione
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setModerationOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Rivedi
            </Button>
          </div>
        )}

        {showEmptyState ? (
          <div className="text-center py-16 bg-muted/30 rounded-2xl border border-border/50">
            <ImageOff className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base font-semibold mb-1">Nessuna foto ancora</h3>
            <p className="text-[13px] text-muted-foreground max-w-md mx-auto">
              Le foto caricate dai dipendenti appariranno qui dopo la tua
              approvazione.
            </p>
          </div>
        ) : (
          <>
            <GalleryFilters
              value={filters}
              onChange={setFilters}
              experienceOptions={experienceOptions}
            />

            {isLoading ? (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-md" />
                ))}
              </div>
            ) : noResultsForFilters ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Nessuna foto corrisponde ai filtri selezionati.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl">
                <RowsPhotoAlbum
                  photos={mainAlbum}
                  spacing={2}
                  padding={0}
                  targetRowHeight={(containerWidth) =>
                    containerWidth < 640 ? 200 : 250
                  }
                  onClick={({ index }) => setLightboxIndex(index)}
                />
              </div>
            )}
          </>
        )}
      </div>

      {companyId && (
        <ModerationQueueDialog
          companyId={companyId}
          open={moderationOpen}
          onOpenChange={setModerationOpen}
        />
      )}

      {companyId && lightboxIndex !== null && (
        <PhotoLightbox
          photos={mainPhotos}
          signedUrls={signedUrls}
          currentIndex={lightboxIndex}
          onIndexChange={setLightboxIndex}
          open={lightboxIndex !== null}
          onOpenChange={(o) => !o && setLightboxIndex(null)}
          companyId={companyId}
        />
      )}
    </HRLayout>
  );
}
