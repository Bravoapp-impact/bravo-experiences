import { useMemo, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import {
  Star,
  Eye,
  EyeOff,
  Trash2,
  Pencil,
  Download,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CompanyGalleryPhoto } from "@/hooks/queries/gallery/useCompanyGallery";
import { useTogglePhotoFeatured } from "@/hooks/queries/gallery/useTogglePhotoFeatured";
import {
  useUpdatePhotoStatus,
  useDeletePhoto,
} from "@/hooks/queries/gallery/useUpdatePhotoStatus";
import { useUpdatePhotoCaption } from "@/hooks/queries/gallery/useUpdatePhotoCaption";

interface Props {
  photos: CompanyGalleryPhoto[];
  signedUrls: Record<string, string>;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  /** Reserved for super-admin variant (Step 5). */
  mode?: "hr" | "super-admin";
}

export function PhotoLightbox({
  photos,
  signedUrls,
  currentIndex,
  onIndexChange,
  open,
  onOpenChange,
  companyId,
}: Props) {
  const toggleFeatured = useTogglePhotoFeatured();
  const updateStatus = useUpdatePhotoStatus();
  const deletePhoto = useDeletePhoto();
  const updateCaption = useUpdatePhotoCaption();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState("");

  const safeIndex = Math.min(Math.max(0, currentIndex), photos.length - 1);
  const current = photos[safeIndex];

  const slides = useMemo(
    () =>
      photos.map((p) => {
        const src = signedUrls[p.storage_path] ?? "";
        const uploader = p.uploader_profile;
        const uploaderName = uploader
          ? `${uploader.first_name ?? ""} ${uploader.last_name ?? ""}`.trim() ||
            "Dipendente"
          : "Dipendente";
        const exp = p.experience_dates?.experiences;
        const eventDate = p.experience_dates?.start_datetime
          ? format(new Date(p.experience_dates.start_datetime), "d MMMM yyyy", {
              locale: it,
            })
          : "";
        const lines = [
          uploaderName,
          [exp?.title, exp?.association_name].filter(Boolean).join(" · "),
          eventDate,
          p.caption,
        ].filter(Boolean);
        return {
          src,
          title: exp?.title ?? "Foto",
          description: lines.join("\n"),
        };
      }),
    [photos, signedUrls],
  );

  if (!current) return null;

  const handleToggleFeatured = async () => {
    try {
      await toggleFeatured.mutateAsync({
        photoId: current.id,
        isFeatured: !current.is_featured,
        companyId,
      });
      toast.success(
        current.is_featured
          ? "Foto rimossa dagli evidenziati"
          : "Foto messa in evidenza",
      );
    } catch (e: any) {
      toast.error(e?.message || "Errore.");
    }
  };

  const handleToggleHidden = async () => {
    const nextStatus = current.status === "hidden" ? "approved" : "hidden";
    try {
      await updateStatus.mutateAsync({
        photoId: current.id,
        status: nextStatus,
        companyId,
      });
      toast.success(
        nextStatus === "hidden" ? "Foto nascosta" : "Foto visibile",
      );
    } catch (e: any) {
      toast.error(e?.message || "Errore.");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePhoto.mutateAsync({ photoId: current.id, companyId });
      toast.success("Foto eliminata.");
      setConfirmDelete(false);
      // Close lightbox if we deleted the last photo
      if (photos.length <= 1) onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Errore.");
    }
  };

  const openCaptionEditor = () => {
    setCaptionDraft(current.caption ?? "");
    setEditingCaption(true);
  };

  const saveCaption = async () => {
    try {
      await updateCaption.mutateAsync({
        photoId: current.id,
        caption: captionDraft,
        companyId,
      });
      toast.success("Didascalia aggiornata.");
      setEditingCaption(false);
    } catch (e: any) {
      toast.error(e?.message || "Errore.");
    }
  };

  const toolbarButtons = [
    <button
      key="feature"
      type="button"
      className="yarl__button"
      title={current.is_featured ? "Rimuovi dagli evidenziati" : "Metti in evidenza"}
      onClick={handleToggleFeatured}
    >
      <Star
        className="h-5 w-5"
        fill={current.is_featured ? "currentColor" : "none"}
      />
    </button>,
    <button
      key="hide"
      type="button"
      className="yarl__button"
      title={current.status === "hidden" ? "Rendi visibile" : "Nascondi"}
      onClick={handleToggleHidden}
    >
      {current.status === "hidden" ? (
        <EyeOff className="h-5 w-5" />
      ) : (
        <Eye className="h-5 w-5" />
      )}
    </button>,
    <button
      key="caption"
      type="button"
      className="yarl__button"
      title="Modifica didascalia"
      onClick={openCaptionEditor}
    >
      <Pencil className="h-5 w-5" />
    </button>,
    <a
      key="download"
      className="yarl__button"
      title="Scarica"
      href={signedUrls[current.storage_path] ?? "#"}
      download
      target="_blank"
      rel="noreferrer"
    >
      <Download className="h-5 w-5" />
    </a>,
    <button
      key="delete"
      type="button"
      className="yarl__button"
      title="Rimuovi"
      onClick={() => setConfirmDelete(true)}
    >
      <Trash2 className="h-5 w-5" />
    </button>,
    "close" as const,
  ];

  return (
    <>
      <Lightbox
        open={open}
        close={() => onOpenChange(false)}
        index={safeIndex}
        on={{
          view: ({ index }) => onIndexChange(index),
        }}
        slides={slides}
        plugins={[Captions, Zoom]}
        captions={{ descriptionTextAlign: "start" }}
        toolbar={{ buttons: toolbarButtons }}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa foto?</AlertDialogTitle>
            <AlertDialogDescription>
              L'azione non è reversibile. La foto sarà rimossa dalla galleria
              e dallo storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editingCaption} onOpenChange={setEditingCaption}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica didascalia</DialogTitle>
          </DialogHeader>
          <Textarea
            value={captionDraft}
            onChange={(e) => setCaptionDraft(e.target.value)}
            rows={3}
            placeholder="Aggiungi una didascalia..."
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingCaption(false)}>
              Annulla
            </Button>
            <Button onClick={saveCaption} disabled={updateCaption.isPending}>
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
