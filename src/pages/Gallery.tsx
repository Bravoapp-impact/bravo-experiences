import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Image as ImageIcon,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useMyPhotos, type MyPhoto } from "@/hooks/queries/gallery/useMyPhotos";
import { useSignedPhotoUrls } from "@/hooks/queries/gallery/useSignedPhotoUrls";
import { useDeleteMyPendingPhoto } from "@/hooks/queries/gallery/useDeleteMyPendingPhoto";

const STATUS_CONFIG = {
  pending: {
    label: "In attesa",
    icon: Clock,
    classes: "bg-amber-100 text-amber-700",
  },
  approved: {
    label: "Approvata",
    icon: CheckCircle2,
    classes: "bg-emerald-100 text-emerald-700",
  },
  rejected: {
    label: "Rifiutata",
    icon: XCircle,
    classes: "bg-red-100 text-red-700",
  },
} as const;

export default function Gallery() {
  const { user } = useAuth();
  const { data: photos = [], isLoading } = useMyPhotos(user?.id);
  const [lightboxPhoto, setLightboxPhoto] = useState<MyPhoto | null>(null);

  const paths = photos.map((p) => p.storage_path);
  const { data: signedUrls = {} } = useSignedPhotoUrls(paths);

  const deleteMutation = useDeleteMyPendingPhoto();

  const handleDelete = async (photo: MyPhoto) => {
    if (!user) return;
    if (!confirm("Vuoi davvero eliminare questa foto?")) return;
    try {
      await deleteMutation.mutateAsync({
        photoId: photo.id,
        storagePath: photo.storage_path,
        userId: user.id,
      });
      toast.success("Foto eliminata.");
    } catch (e: any) {
      toast.error(e?.message || "Errore durante l'eliminazione.");
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <PageHeader
          title="Galleria"
          description="Rivivi momenti e esperienze speciali"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-muted/30 rounded-2xl border border-border/50"
        >
          <ImageIcon className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base font-semibold mb-1">
            Nessuna foto caricata
          </h3>
          <p className="text-[13px] text-muted-foreground max-w-md mx-auto mb-5">
            Le foto delle tue esperienze appariranno qui dopo averle caricate.
          </p>
          <Button asChild>
            <Link to="/app/bookings">Vai alle mie prenotazioni</Link>
          </Button>
        </motion.div>
      ) : (
        <section>
          <h2 className="text-base font-semibold mb-4">Le mie foto</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {photos.map((photo) => {
              const cfg = STATUS_CONFIG[photo.status];
              const StatusIcon = cfg.icon;
              const url = signedUrls[photo.storage_path];
              return (
                <div
                  key={photo.id}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                  onClick={() => setLightboxPhoto(photo)}
                >
                  {url ? (
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Skeleton className="w-full h-full" />
                  )}

                  {/* Status badge */}
                  <div
                    className={cn(
                      "absolute top-1.5 right-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      cfg.classes,
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </div>

                  {/* Delete (only pending) */}
                  {photo.status === "pending" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(photo);
                      }}
                      className="absolute top-1.5 left-1.5 h-7 w-7 rounded-full bg-black/70 text-white items-center justify-center hidden group-hover:flex hover:bg-black"
                      aria-label="Elimina foto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Lightbox */}
      <Dialog
        open={!!lightboxPhoto}
        onOpenChange={(o) => !o && setLightboxPhoto(null)}
      >
        <DialogContent className="max-w-4xl bg-black/95 border-none p-0 [&>button]:text-white">
          {lightboxPhoto && (
            <div className="flex flex-col">
              <div className="flex items-center justify-center max-h-[80vh] overflow-hidden">
                {signedUrls[lightboxPhoto.storage_path] && (
                  <img
                    src={signedUrls[lightboxPhoto.storage_path]}
                    alt=""
                    className="max-h-[80vh] w-auto object-contain"
                  />
                )}
              </div>
              <div className="p-4 text-white space-y-1">
                <div className="flex items-center gap-2">
                  {(() => {
                    const cfg = STATUS_CONFIG[lightboxPhoto.status];
                    const Icon = cfg.icon;
                    return (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                          cfg.classes,
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-sm font-medium">
                  {lightboxPhoto.experience_dates?.experiences?.title ??
                    "Esperienza"}
                </p>
                {lightboxPhoto.experience_dates?.start_datetime && (
                  <p className="text-[12px] text-white/70">
                    {format(
                      new Date(
                        lightboxPhoto.experience_dates.start_datetime,
                      ),
                      "d MMMM yyyy",
                      { locale: it },
                    )}
                  </p>
                )}
                {lightboxPhoto.status === "rejected" &&
                  lightboxPhoto.rejection_reason && (
                    <p className="text-[12px] text-red-300 mt-2">
                      Motivo: {lightboxPhoto.rejection_reason}
                    </p>
                  )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
