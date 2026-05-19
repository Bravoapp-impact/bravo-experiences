import { useEffect, useMemo, useState } from "react";
import {
  RowsPhotoAlbum,
  type Photo as AlbumPhoto,
} from "react-photo-album";
import "react-photo-album/rows.css";
import { Image as ImageIcon, ImageOff, AlertCircle, CheckSquare, Check, Upload } from "lucide-react";
import { HRLayout } from "@/components/layout/HRLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyGallery } from "@/hooks/queries/gallery/useCompanyGallery";
import { usePendingPhotos } from "@/hooks/queries/gallery/usePendingPhotos";
import { useSignedPhotoUrls } from "@/hooks/queries/gallery/useSignedPhotoUrls";
import { useImageDimensions } from "@/hooks/queries/gallery/useImageDimensions";
import { useBulkDeletePhotos } from "@/hooks/queries/gallery/useBulkDeletePhotos";
import { useBulkDownloadPhotos } from "@/hooks/queries/gallery/useBulkDownloadPhotos";
import {
  GalleryFilters,
  EMPTY_FILTERS,
  type GalleryFiltersState,
  type GalleryFilterOption,
} from "@/components/hr-gallery/GalleryFilters";
import { GallerySelectionBar } from "@/components/hr-gallery/GallerySelectionBar";
import { HRPhotoUploadDialog } from "@/components/hr-gallery/HRPhotoUploadDialog";
import { ModerationQueueDialog } from "@/components/hr-gallery/ModerationQueueDialog";
import { PhotoLightbox } from "@/components/hr-gallery/PhotoLightbox";
import { cn } from "@/lib/utils";
import { GALLERY_PAGE_SIZE } from "@/lib/gallery";

type AlbumPhotoWithId = AlbumPhoto & { photoId: string };

export default function HRGalleryPage() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? null;

  const [filters, setFilters] = useState<GalleryFiltersState>(EMPTY_FILTERS);
  const [moderationOpen, setModerationOpen] = useState(false);
  const [lightboxPhotoId, setLightboxPhotoId] = useState<string | null>(null);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const bulkDelete = useBulkDeletePhotos();
  const bulkDownload = useBulkDownloadPhotos();

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

  const [visibleCount, setVisibleCount] = useState(GALLERY_PAGE_SIZE);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(GALLERY_PAGE_SIZE);
  }, [filters.experienceIds.join(","), dateFromIso, dateToIso]);

  const paths = useMemo(
    () => photos.slice(0, visibleCount).map((p) => p.storage_path),
    [photos, visibleCount],
  );
  const { data: signedUrls = {} } = useSignedPhotoUrls(paths);
  const dims = useImageDimensions(Object.values(signedUrls));

  const mainPhotos = useMemo(
    () =>
      photos
        .slice(0, visibleCount)
        .filter((p) => !!signedUrls[p.storage_path]),
    [photos, visibleCount, signedUrls],
  );

  const hasMore = visibleCount < photos.length;

  // Reset selection when filters change or selection mode toggles off
  const filtersKey = `${filters.experienceIds.join(",")}|${dateFromIso}|${dateToIso}`;
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filtersKey]);

  // Prune selection if the underlying visible list changes (e.g. after delete)
  const visibleIdsKey = useMemo(
    () => mainPhotos.map((p) => p.id).join(","),
    [mainPhotos],
  );
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const valid = new Set(mainPhotos.map((p) => p.id));
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (valid.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIdsKey]);

  const experienceOptions: GalleryFilterOption[] = useMemo(() => {
    const map = new Map<string, string>();
    allPhotos.forEach((p) => {
      const exp = p.experience_dates?.experiences;
      if (exp?.id && exp.title) map.set(exp.id, exp.title);
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [allPhotos]);

  const buildAlbumPhotos = (list: typeof photos): AlbumPhotoWithId[] =>
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
          photoId: p.id,
        } as AlbumPhotoWithId;
      })
      .filter((x): x is AlbumPhotoWithId => x !== null);

  const mainAlbum = useMemo(
    () => buildAlbumPhotos(mainPhotos),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mainPhotos, signedUrls, dims],
  );

  const totalCompanyPhotos = allPhotos.length + pending.length;
  const showEmptyState = !isLoading && totalCompanyPhotos === 0;
  const noResultsForFilters =
    !isLoading && photos.length === 0 && totalCompanyPhotos > 0;

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleSelected =
    mainPhotos.length > 0 && selectedIds.size === mainPhotos.length;

  const toggleAllVisible = () => {
    if (allVisibleSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(mainPhotos.map((p) => p.id)));
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const enterSelection = () => {
    setSelectionMode(true);
  };

  const selectedPhotos = useMemo(
    () => mainPhotos.filter((p) => selectedIds.has(p.id)),
    [mainPhotos, selectedIds],
  );

  const handleBulkDownload = async () => {
    if (!companyId || selectedPhotos.length === 0) return;
    await bulkDownload.download(selectedPhotos);
  };

  const handleBulkDelete = async () => {
    if (!companyId || selectedPhotos.length === 0) return;
    try {
      await bulkDelete.mutateAsync({
        photos: selectedPhotos.map((p) => ({
          id: p.id,
          storage_path: p.storage_path,
        })),
        companyId,
      });
      toast.success(
        `${selectedPhotos.length} ${selectedPhotos.length === 1 ? "foto eliminata" : "foto eliminate"}.`,
      );
      setConfirmBulkDelete(false);
      setSelectedIds(new Set());
    } catch (e: any) {
      toast.error(e?.message || "Errore durante l'eliminazione.");
    }
  };

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
            <p className="text-[13px] text-muted-foreground max-w-md mx-auto mb-4">
              Le foto caricate dai dipendenti appariranno qui dopo la tua
              approvazione. Puoi anche caricarle tu direttamente.
            </p>
            <Button size="sm" onClick={() => setUploadOpen(true)}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Carica foto
            </Button>
          </div>
        ) : (
          <>
            {selectionMode ? (
              <GallerySelectionBar
                selectedCount={selectedIds.size}
                totalVisible={mainPhotos.length}
                allSelected={allVisibleSelected}
                onToggleAll={toggleAllVisible}
                onDownload={handleBulkDownload}
                onDelete={() => setConfirmBulkDelete(true)}
                onExit={exitSelection}
                isDownloading={bulkDownload.isPending}
                isDeleting={bulkDelete.isPending}
              />
            ) : (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <GalleryFilters
                    value={filters}
                    onChange={setFilters}
                    experienceOptions={experienceOptions}
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={enterSelection}
                    disabled={mainPhotos.length === 0}
                  >
                    <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                    Seleziona
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setUploadOpen(true)}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Carica
                  </Button>
                </div>
              </div>
            )}

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
                <RowsPhotoAlbum<AlbumPhotoWithId>
                  photos={mainAlbum}
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
                    containerWidth < 640 ? 200 : 250
                  }
                  render={{
                    extras: (_props, { photo }) => {
                      if (!selectionMode) return null;
                      const isSelected = selectedIds.has(photo.photoId);
                      return (
                        <>
                          <div
                            className={cn(
                              "absolute inset-0 pointer-events-none transition-all",
                              isSelected
                                ? "bg-primary/15 ring-2 ring-primary ring-inset"
                                : "bg-background/0 hover:bg-background/10",
                            )}
                          />
                          <div
                            className={cn(
                              "absolute top-2 left-2 h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all pointer-events-none",
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "bg-background/80 border-white/90 backdrop-blur-sm",
                            )}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                          </div>
                        </>
                      );
                    },
                  }}
                  onClick={({ index }) => {
                    const p = mainPhotos[index];
                    if (!p) return;
                    if (selectionMode) {
                      toggleSelection(p.id);
                    } else {
                      setLightboxPhotoId(p.id);
                    }
                  }}
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

      {companyId && (
        <HRPhotoUploadDialog
          companyId={companyId}
          open={uploadOpen}
          onOpenChange={setUploadOpen}
        />
      )}

      {companyId && !selectionMode && lightboxPhotoId !== null && (() => {
        const idx = mainPhotos.findIndex((p) => p.id === lightboxPhotoId);
        if (idx === -1) return null;
        return (
          <PhotoLightbox
            photos={mainPhotos}
            signedUrls={signedUrls}
            currentIndex={idx}
            onIndexChange={(i) => setLightboxPhotoId(mainPhotos[i]?.id ?? null)}
            open={true}
            onOpenChange={(o) => !o && setLightboxPhotoId(null)}
            companyId={companyId}
          />
        );
      })()}

      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Eliminare {selectedIds.size}{" "}
              {selectedIds.size === 1 ? "foto" : "foto"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              L'azione non è reversibile. Le foto saranno rimosse dalla galleria
              e dallo storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDelete.isPending}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDelete.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </HRLayout>
  );
}
