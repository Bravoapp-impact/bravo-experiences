import { useState } from "react";
import { Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/common/PageHeader";
import {
  CrudTableCard,
  CrudTableActions,
  CrudTableRow,
  TableEmptyRow,
  TableLoadingRow,
  DeleteConfirmDialog,
} from "@/components/crud";
import { useCrudState } from "@/hooks/useCrudState";

interface City {
  id: string;
  name: string;
  province: string | null;
  region: string | null;
  created_at: string;
}

export default function CitiesPage() {
  const { toast } = useToast();
  const {
    items: cities,
    loading,
    searchTerm,
    setSearchTerm,
    selectedItem,
    setSelectedItem,
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    saving,
    handleSave,
    handleDelete,
    filteredItems,
  } = useCrudState<City>({
    tableName: "cities",
    orderBy: { column: "name", ascending: true },
    searchFields: ["name", "province", "region"],
  });

  const [formData, setFormData] = useState({
    name: "",
    province: "",
    region: "",
  });

  const handleOpenDialog = (city?: City) => {
    if (city) {
      setSelectedItem(city);
      setFormData({
        name: city.name,
        province: city.province || "",
        region: city.region || "",
      });
    } else {
      setSelectedItem(null);
      setFormData({
        name: "",
        province: "",
        region: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Il nome è obbligatorio",
      });
      return;
    }

    await handleSave({
      name: formData.name.trim(),
      province: formData.province.trim() || null,
      region: formData.region.trim() || null,
    });
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Città"
          description="Gestisci le città dove operiamo"
          icon={MapPin}
          iconColor="text-cyan-500"
          actions={
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuova Città
            </Button>
          }
        />

        <CrudTableCard
          title={`${cities.length} Città`}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Cerca città..."
        >
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Città</TableHead>
                  <TableHead>Provincia</TableHead>
                  <TableHead>Regione</TableHead>
                  <TableHead className="w-24">Azioni</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableLoadingRow colSpan={4} />
                ) : filteredItems.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    icon={MapPin}
                    message="Nessuna città trovata"
                  />
                ) : (
                  filteredItems.map((city, index) => (
                    <CrudTableRow key={city.id} index={index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium">{city.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{city.province || "—"}</TableCell>
                      <TableCell>{city.region || "—"}</TableCell>
                      <TableCell>
                        <CrudTableActions
                          onEdit={() => handleOpenDialog(city)}
                          onDelete={() => {
                            setSelectedItem(city);
                            setDeleteDialogOpen(true);
                          }}
                        />
                      </TableCell>
                    </CrudTableRow>
                  ))
                )}
              </TableBody>
            </Table>
        </CrudTableCard>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? "Modifica Città" : "Nuova Città"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="es. Milano"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Provincia</Label>
              <Input
                id="province"
                value={formData.province}
                onChange={(e) =>
                  setFormData({ ...formData, province: e.target.value })
                }
                placeholder="es. MI"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Regione</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
                placeholder="es. Lombardia"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        entityName="città"
        entityLabel={selectedItem?.name}
        isLoading={saving}
      />
    </SuperAdminLayout>
  );
}
