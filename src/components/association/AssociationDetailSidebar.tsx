import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AssociationDetailSidebarProps {
  status: string;
  onEdit: () => void;
}

/**
 * Sidebar for the association experience detail page.
 * Explains the preview context and provides the edit entry point.
 */
export function AssociationDetailSidebar({
  status,
  onEdit,
}: AssociationDetailSidebarProps) {
  const isArchived = status === "archived";

  return (
    <div className="border border-border rounded-2xl p-6 shadow-sm bg-card space-y-4">
      <h3 className="text-base font-semibold text-foreground">
        Anteprima esperienza
      </h3>

      <p className="text-sm text-muted-foreground leading-relaxed">
        {isArchived
          ? "Questa esperienza è archiviata. Per riutilizzarla, ripubblicala o duplicala dalla pagina Esperienze."
          : "Così è come la tua esperienza appare alle aziende. Modificala con il pulsante qui sotto."}
      </p>

      {!isArchived && (
        <Button
          onClick={onEdit}
          className="w-full h-11 text-sm font-medium rounded-xl"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Modifica esperienza
        </Button>
      )}
    </div>
  );
}
