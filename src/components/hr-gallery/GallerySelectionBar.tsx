import { Download, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  selectedCount: number;
  totalVisible: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onExit: () => void;
  isDownloading?: boolean;
  isDeleting?: boolean;
}

export function GallerySelectionBar({
  selectedCount,
  totalVisible,
  allSelected,
  onToggleAll,
  onDownload,
  onDelete,
  onExit,
  isDownloading,
  isDeleting,
}: Props) {
  const busy = isDownloading || isDeleting;
  return (
    <div className="sticky top-0 z-20 -mx-4 sm:mx-0 px-4 sm:px-4 py-2.5 sm:rounded-xl bg-background/95 backdrop-blur border-b sm:border border-border flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onExit}
          disabled={busy}
          aria-label="Esci dalla selezione"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {selectedCount} {selectedCount === 1 ? "foto selezionata" : "foto selezionate"}
          </p>
          {totalVisible > 0 && (
            <button
              type="button"
              onClick={onToggleAll}
              className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              disabled={busy}
            >
              {allSelected
                ? "Deseleziona tutto"
                : `Seleziona tutte (${totalVisible})`}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          disabled={selectedCount === 0 || busy}
        >
          {isDownloading ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5 mr-1.5" />
          )}
          <span className="hidden sm:inline">Scarica ZIP</span>
          <span className="sm:hidden">ZIP</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={onDelete}
          disabled={selectedCount === 0 || busy}
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          )}
          Elimina
        </Button>
      </div>
    </div>
  );
}
