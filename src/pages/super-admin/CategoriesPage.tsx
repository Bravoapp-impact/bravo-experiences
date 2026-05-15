import { useState } from "react";
import { Plus, Tag, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { useToast } from "@/hooks/use-toast";
import { getAllSDGs } from "@/lib/sdg-data";
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

interface Category {
  id: string;
  name: string;
  description: string | null;
  default_sdgs: string[] | null;
  created_at: string;
}

export default function CategoriesPage() {
  const { toast } = useToast();
  const allSDGs = getAllSDGs();

  const {
    items: categories,
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
  } = useCrudState<Category>({
    tableName: "categories",
    orderBy: { column: "name", ascending: true },
    searchFields: ["name", "description"],
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    default_sdgs: [] as string[],
  });

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setSelectedItem(category);
      setFormData({
        name: category.name,
        description: category.description || "",
        default_sdgs: category.default_sdgs || [],
      });
    } else {
      setSelectedItem(null);
      setFormData({
        name: "",
        description: "",
        default_sdgs: [],
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
      description: formData.description.trim() || null,
      default_sdgs: formData.default_sdgs.length > 0 ? formData.default_sdgs : null,
    });
  };

  const handleSDGToggle = (sdgCode: string) => {
    setFormData((prev) => ({
      ...prev,
      default_sdgs: prev.default_sdgs.includes(sdgCode)
        ? prev.default_sdgs.filter((s) => s !== sdgCode)
        : [...prev.default_sdgs, sdgCode],
    }));
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Categorie"
          description="Gestisci le categorie delle esperienze"
          actions={
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuova Categoria
            </Button>
          }
        />

        <CrudTableCard
          title={`${categories.length} Categorie`}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Cerca categoria..."
        >
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrizione</TableHead>
                  <TableHead>SDG Default</TableHead>
                  <TableHead className="w-24">Azioni</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableLoadingRow colSpan={4} />
                ) : filteredItems.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    icon={Tag}
                    message="Nessuna categoria trovata"
                  />
                ) : (
                  filteredItems.map((category, index) => (
                    <CrudTableRow key={category.id} index={index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Tag className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium capitalize">
                            {category.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate text-sm text-muted-foreground">
                          {category.description || "—"}
                        </p>
                      </TableCell>
                      <TableCell>
                        {category.default_sdgs && category.default_sdgs.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <Lightbulb className="h-4 w-4 text-primary/70" />
                            <span className="text-sm text-muted-foreground">
                              {category.default_sdgs.length} SDG
                            </span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <CrudTableActions
                          onEdit={() => handleOpenDialog(category)}
                          onDelete={() => {
                            setSelectedItem(category);
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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? "Modifica Categoria" : "Nuova Categoria"}
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
                placeholder="es. Ambiente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrizione della categoria..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                SDG Default Suggeriti
                <Badge variant="outline" className="text-xs font-normal">
                  Suggerimento
                </Badge>
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Quando si crea un'esperienza di questa categoria, questi SDG appariranno come suggerimento
              </p>
              <div className="grid grid-cols-2 gap-2 p-3 border border-border rounded-lg max-h-48 overflow-y-auto">
                {allSDGs.map((sdg) => (
                  <div key={sdg.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sdg-${sdg.code}`}
                      checked={formData.default_sdgs.includes(sdg.code)}
                      onCheckedChange={() => handleSDGToggle(sdg.code)}
                    />
                    <label
                      htmlFor={`sdg-${sdg.code}`}
                      className="text-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>{sdg.icon}</span>
                      <span className="truncate">{sdg.name}</span>
                    </label>
                  </div>
                ))}
              </div>
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
        entityName="categoria"
        entityLabel={selectedItem?.name}
        isLoading={saving}
      />
    </SuperAdminLayout>
  );
}
