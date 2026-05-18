import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ImagePlus, X, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useMyPhotosCountForEvent } from "@/hooks/queries/gallery/useMyPhotos";
import {
  useUploadPhotos,
  GalleryLimitReachedError,
} from "@/hooks/queries/gallery/useUploadPhoto";

const MAX_PHOTOS = 20;

interface Props {
  experienceDateId: string;
  experienceTitle: string;
  eventDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SelectedFile {
  id: string;
  file: File;
  preview: string;
}

export function PhotoUploadDialog({
  experienceDateId,
  experienceTitle,
  eventDate,
  open,
  onOpenChange,
}: Props) {
  const isMobile = useIsMobile();
  const { user, profile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [consent, setConsent] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const { data: alreadyUploaded = 0 } = useMyPhotosCountForEvent(
    user?.id,
    experienceDateId,
  );
  const uploadMutation = useUploadPhotos();

  const remaining = Math.max(0, MAX_PHOTOS - alreadyUploaded);
  const canAddMore = remaining - files.length;

  useEffect(() => {
    if (!open) {
      // Cleanup blob URLs on close
      files.forEach((f) => URL.revokeObjectURL(f.preview));
      setFiles([]);
      setConsent(false);
      setProgress({ current: 0, total: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleFilesSelected = (list: FileList | null) => {
    if (!list) return;
    const newOnes: SelectedFile[] = [];
    Array.from(list).forEach((f) => {
      if (!f.type.startsWith("image/")) return;
      newOnes.push({
        id: crypto.randomUUID(),
        file: f,
        preview: URL.createObjectURL(f),
      });
    });
    const allowed = Math.max(0, canAddMore);
    if (newOnes.length > allowed) {
      toast.error(
        `Puoi caricare al massimo ${MAX_PHOTOS} foto per evento. Hai spazio per ${allowed} altre.`,
      );
    }
    setFiles((prev) => [...prev, ...newOnes.slice(0, allowed)]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSubmit = async () => {
    if (!user || !profile?.company_id) {
      toast.error("Devi essere autenticato per caricare foto.");
      return;
    }
    if (files.length === 0 || !consent) return;

    setProgress({ current: 0, total: files.length });
    try {
      await uploadMutation.mutateAsync({
        files: files.map((f) => f.file),
        userId: user.id,
        companyId: profile.company_id,
        experienceDateId,
        onProgress: (current, total) => setProgress({ current, total }),
      });
      toast.success(
        `${files.length} ${files.length === 1 ? "foto caricata" : "foto caricate"}. Saranno visibili dopo l'approvazione del team HR.`,
      );
      onOpenChange(false);
    } catch (e: any) {
      if (e instanceof GalleryLimitReachedError) {
        toast.error(e.message);
      } else {
        toast.error(e?.message || "Errore durante il caricamento delle foto.");
      }
    } finally {
      setProgress({ current: 0, total: 0 });
    }
  };

  const isUploading = uploadMutation.isPending;
  const submitDisabled =
    files.length === 0 ||
    !consent ||
    isUploading ||
    files.length > remaining;

  const eventDateFormatted = format(new Date(eventDate), "EEEE d MMMM yyyy", {
    locale: it,
  });

  const content = (
    <div className="space-y-4">
      <p className="text-[13px] text-muted-foreground">
        {alreadyUploaded}/{MAX_PHOTOS} foto già caricate per questo evento
      </p>

      {/* Dropzone / picker */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading || canAddMore <= 0}
        className="w-full border-2 border-dashed border-border rounded-xl py-8 px-4 flex flex-col items-center justify-center gap-2 hover:bg-muted/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">
          {canAddMore > 0
            ? "Tocca per scegliere le foto"
            : "Limite raggiunto"}
        </p>
        {canAddMore > 0 && (
          <p className="text-[12px] text-muted-foreground">
            Puoi ancora aggiungere {canAddMore}{" "}
            {canAddMore === 1 ? "foto" : "foto"}
          </p>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />

      {/* Thumbnails */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted"
            >
              <img
                src={f.preview}
                alt=""
                className="w-full h-full object-cover"
              />
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Consent */}
      <label className="flex items-start gap-2 cursor-pointer">
        <Checkbox
          checked={consent}
          onCheckedChange={(v) => setConsent(v === true)}
          disabled={isUploading}
          className="mt-0.5"
        />
        <span className="text-[13px] leading-snug">
          Confermo di avere il consenso delle persone ritratte alla
          condivisione di queste foto.
        </span>
      </label>

      {/* Progress */}
      {isUploading && progress.total > 0 && (
        <div className="space-y-2">
          <Progress value={(progress.current / progress.total) * 100} />
          <p className="text-[12px] text-muted-foreground text-center">
            Caricamento foto {progress.current} di {progress.total}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="ghost"
          onClick={() => onOpenChange(false)}
          disabled={isUploading}
        >
          Annulla
        </Button>
        <Button onClick={handleSubmit} disabled={submitDisabled}>
          <ImagePlus className="h-4 w-4 mr-2" />
          Carica {files.length > 0 ? `(${files.length})` : ""}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Carica foto</DrawerTitle>
            <DrawerDescription>
              {experienceTitle} · {eventDateFormatted}
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Carica foto</DialogTitle>
          <DialogDescription>
            {experienceTitle} · {eventDateFormatted}
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
