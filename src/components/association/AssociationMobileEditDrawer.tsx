import { CalendarRange, Pencil } from "lucide-react";
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
  onManageDates: () => void;
}

/**
 * Mobile bottom-drawer for the association experience detail page.
 * Contains the explanatory message + edit and manage-dates entry points.
 */
export function AssociationMobileEditDrawer({
  open,
  onOpenChange,
  onEdit,
  onManageDates,
}: AssociationMobileEditDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[60vh]">
        <DrawerHeader>
          <DrawerTitle>Anteprima esperienza</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Così è come la tua esperienza appare alle aziende. Modificala o
            gestisci le date con i pulsanti qui sotto.
          </p>
        </div>

        <DrawerFooter className="space-y-2">
          <Button
            onClick={onEdit}
            className="w-full h-12 text-base font-medium rounded-xl"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Modifica esperienza
          </Button>
          <Button
            onClick={onManageDates}
            variant="outline"
            className="w-full h-12 text-base font-medium rounded-xl"
          >
            <CalendarRange className="h-4 w-4 mr-2" />
            Gestisci date
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
