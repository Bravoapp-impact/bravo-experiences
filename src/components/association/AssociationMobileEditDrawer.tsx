import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";

interface AssociationMobileEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

/**
 * Mobile bottom-drawer for the association experience detail page.
 * Contains the explanatory message + the edit entry point.
 */
export function AssociationMobileEditDrawer({
  open,
  onOpenChange,
  onEdit,
}: AssociationMobileEditDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[60vh]">
        <DrawerHeader>
          <DrawerTitle>Anteprima esperienza</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Così è come la tua esperienza appare alle aziende. Modificala con il
            pulsante qui sotto.
          </p>
        </div>

        <DrawerFooter>
          <Button
            onClick={onEdit}
            className="w-full h-12 text-base font-medium rounded-xl"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Modifica esperienza
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
