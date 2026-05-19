import { useState, useRef, useEffect, useMemo } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyPastDates } from "@/hooks/queries/gallery/useCompanyPastDates";
import { useHRUploadPhotos } from "@/hooks/queries/gallery/useHRUploadPhotos";

interface Props {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SelectedFile {
  id: string;
  file: File;
  preview: string;
}

export function HRPhotoUploadDialog({ companyId, open, onOpenChange }: Props) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [experienceDateId, setExperienceDateId] = useState<string>("");
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const { data: dates = [], isLoading: datesLoading } =
    useCompanyPastDates(companyId);
  const uploadMutation = useHRUploadPhotos();

  useEffect(() => {
    if (!open) {
      files.forEach((f) => URL.revokeObjectURL(f.preview));
      setFiles([]);
      setExperienceDateId("");
      setProgress({ current: 0, total: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dateOptions = useMemo(
    () =>
      dates.map((d) => ({
        id: d.id,
        label: `${d.experience_title} · ${format(new Date(d.start_datetime), "d MMM yyyy", { locale: it })}`,
      })),
    [dates],
  );

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
    setFiles((prev) => [...prev, ...newOnes]);
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
    if (!user || !companyId) {
      toast.error("Sessione non valida.");
      return;
    }
    if (!experienceDateId) {
      toast.error("Seleziona un'esperienza.");
      return;
    }
    if (files.length === 0) return;

    setProgress({ current: 0, total: files.length });
    try {
      await uploadMutation.mutateAsync({
        files: files.map((f) => f.file),
        userId: user.id,
        companyId,
        experienceDateId,
        onProgress: (current, total) => setProgress({ current, total }),
      });
      toast.success(
        `${files.length} ${files.length === 1 ? "foto caricata" : "foto caricate"} in galleria.`,
      );
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Errore durante il caricamento delle foto.");
    } finally {
      setProgress({ current: 0, total: 0 });
    }
  };

  const isUploading = uploadMutation.isPending;
  const submitDisabled =
    files.length === 0 || !experienceDateId || isUploading;

  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="hr-upload-date">Esperienza</Label>
        <Select
          value={experienceDateId}
          onValueChange={setExperienceDateId}
          disabled={isUploading || datesLoading}
        >
          <SelectTrigger id="hr-upload-date">
            <SelectValue
              placeholder={
                datesLoading
                  ? "Caricamento…"
                  : dateOptions.length === 0
                    ? "Nessuna esperienza passata"
                    : "Seleziona un'esperienza"
              }
            />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {dateOptions.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading || !experienceDateId}
        className="w-full border-2 border-dashed border-border rounded-xl py-8 px-4 flex flex-col items-center justify-center gap-2 hover:bg-muted/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">
          {experienceDateId
            ? "Tocca per scegliere le foto"
            : "Prima seleziona un'esperienza"}
        </p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />

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

      {isUploading && progress.total > 0 && (
        <div className="space-y-2">
          <Progress value={(progress.current / progress.total) * 100} />
          <p className="text-[12px] text-muted-foreground text-center">
            Caricamento foto {progress.current} di {progress.total}
          </p>
        </div>
      )}

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
              Le foto saranno pubblicate immediatamente in galleria.
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
            Le foto saranno pubblicate immediatamente in galleria.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
