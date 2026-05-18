import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Check, X as XIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  usePendingPhotos,
  type PendingPhoto,
} from "@/hooks/queries/gallery/usePendingPhotos";
import { useSignedPhotoUrls } from "@/hooks/queries/gallery/useSignedPhotoUrls";
import { useModeratePhotos } from "@/hooks/queries/gallery/useModeratePhotos";

interface Props {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModerationQueueDialog({ companyId, open, onOpenChange }: Props) {
  const { data: photos = [], isLoading } = usePendingPhotos(
    open ? companyId : undefined,
  );
  const paths = useMemo(() => photos.map((p) => p.storage_path), [photos]);
  const { data: signedUrls = {} } = useSignedPhotoUrls(paths);

  const moderate = useModeratePhotos();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<PendingPhoto | null>(null);
  const [rejectFor, setRejectFor] = useState<{
    ids: string[];
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Reset selection when reopening or list changes
  useEffect(() => {
    if (!open) {
      setSelected(new Set());
      setPreview(null);
      setRejectFor(null);
      setRejectReason("");
    }
  }, [open]);

  useEffect(() => {
    // prune selection if items disappear
    setSelected((prev) => {
      const valid = new Set(photos.map((p) => p.id));
      const next = new Set<string>();
      prev.forEach((id) => valid.has(id) && next.add(id));
      return next;
    });
  }, [photos]);

  const allSelected = photos.length > 0 && selected.size === photos.length;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(photos.map((p) => p.id)));
  };

  const runModeration = async (
    ids: string[],
    action: "approve" | "reject",
    reason?: string,
  ) => {
    if (ids.length === 0) return;
    try {
      await moderate.mutateAsync({
        photoIds: ids,
        action,
        rejectionReason: reason,
        companyId,
      });
      toast.success(
        action === "approve"
          ? `${ids.length} ${ids.length === 1 ? "foto approvata" : "foto approvate"}`
          : `${ids.length} ${ids.length === 1 ? "foto rifiutata" : "foto rifiutate"}`,
      );
      // Optimistically remove from local selection
      setSelected((prev) => {
        const next = new Set(prev);
        ids.forEach((i) => next.delete(i));
        return next;
      });
      // If we just emptied the queue, close
      const remaining = photos.filter((p) => !ids.includes(p.id)).length;
      if (remaining === 0) {
        toast.success("Hai gestito tutte le foto in attesa 🎉");
        onOpenChange(false);
      }
    } catch (e: any) {
      toast.error(e?.message || "Errore durante la moderazione.");
    } finally {
      setRejectFor(null);
      setRejectReason("");
      setPreview(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Foto in attesa di approvazione ({photos.length})
            </DialogTitle>
            <DialogDescription>
              Approva o rifiuta le foto caricate dai dipendenti. Solo le foto
              approvate compaiono nella galleria.
            </DialogDescription>
          </DialogHeader>

          {/* Toolbar */}
          {photos.length > 0 && (
            <div className="flex items-center justify-between gap-3 py-2 border-y border-border">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                />
                Seleziona tutte ({selected.size}/{photos.length})
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selected.size === 0 || moderate.isPending}
                  onClick={() =>
                    setRejectFor({ ids: Array.from(selected) })
                  }
                >
                  <XIcon className="h-3.5 w-3.5 mr-1" />
                  Rifiuta selezionate
                </Button>
                <Button
                  size="sm"
                  disabled={selected.size === 0 || moderate.isPending}
                  onClick={() =>
                    runModeration(Array.from(selected), "approve")
                  }
                >
                  {moderate.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5 mr-1" />
                  )}
                  Approva selezionate
                </Button>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="flex-1 overflow-y-auto -mx-2 px-2 py-3">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-muted-foreground">
                  Nessuna foto in attesa. 🎉
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {photos.map((p) => {
                  const isSelected = selected.has(p.id);
                  const url = signedUrls[p.storage_path];
                  const uploader = p.uploader_profile;
                  const uploaderName = uploader
                    ? `${uploader.first_name ?? ""} ${uploader.last_name ?? ""}`.trim() ||
                      "Dipendente"
                    : "Dipendente";
                  const eventDate = p.experience_dates?.start_datetime
                    ? format(
                        new Date(p.experience_dates.start_datetime),
                        "d MMM yyyy",
                        { locale: it },
                      )
                    : "—";
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "rounded-xl border bg-card overflow-hidden transition-all",
                        isSelected
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border",
                      )}
                    >
                      <div
                        className="relative aspect-square bg-muted cursor-pointer"
                        onClick={() => setPreview(p)}
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
                        <div
                          className="absolute top-2 left-2 bg-background/90 rounded-md p-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(p.id);
                          }}
                        >
                          <Checkbox checked={isSelected} />
                        </div>
                      </div>
                      <div className="p-2.5 space-y-1.5">
                        <p className="text-[12px] font-medium truncate">
                          {uploaderName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {p.experience_dates?.experiences?.title ??
                            "Esperienza"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {eventDate}
                        </p>
                        <div className="flex items-center gap-1.5 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-7 text-[11px]"
                            disabled={moderate.isPending}
                            onClick={() =>
                              setRejectFor({ ids: [p.id] })
                            }
                          >
                            Rifiuta
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 h-7 text-[11px]"
                            disabled={moderate.isPending}
                            onClick={() => runModeration([p.id], "approve")}
                          >
                            Approva
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview sub-dialog */}
      <Dialog
        open={!!preview}
        onOpenChange={(o) => !o && setPreview(null)}
      >
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/95 border-none [&>button]:text-white">
          {preview && (
            <div className="flex flex-col">
              <div className="flex items-center justify-center max-h-[75vh] overflow-hidden">
                {signedUrls[preview.storage_path] && (
                  <img
                    src={signedUrls[preview.storage_path]}
                    alt=""
                    className="max-h-[75vh] w-auto object-contain"
                  />
                )}
              </div>
              <div className="p-4 text-white flex items-center justify-between gap-3">
                <div className="text-sm">
                  <p className="font-medium">
                    {preview.experience_dates?.experiences?.title ??
                      "Esperienza"}
                  </p>
                  <p className="text-white/70 text-xs">
                    {preview.uploader_profile?.first_name ?? ""}{" "}
                    {preview.uploader_profile?.last_name ?? ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectFor({ ids: [preview.id] })}
                  >
                    Rifiuta
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => runModeration([preview.id], "approve")}
                  >
                    Approva
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection reason dialog */}
      <Dialog
        open={!!rejectFor}
        onOpenChange={(o) => {
          if (!o) {
            setRejectFor(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rifiuta {rejectFor?.ids.length} foto</DialogTitle>
            <DialogDescription>
              Aggiungi un motivo (facoltativo) che il dipendente vedrà nella
              propria galleria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Motivo</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Es. foto sfocata, persone non consenzienti, contenuto non coerente..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setRejectFor(null);
                setRejectReason("");
              }}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              disabled={moderate.isPending}
              onClick={() =>
                rejectFor &&
                runModeration(rejectFor.ids, "reject", rejectReason)
              }
            >
              Conferma rifiuto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
