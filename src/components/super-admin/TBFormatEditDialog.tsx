import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lightbulb, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { devLog } from "@/lib/logger";
import { LogoUpload } from "@/components/super-admin/LogoUpload";
import { AVAILABLE_TAGS } from "@/lib/tags";
import { getAllSDGs } from "@/lib/sdg-data";
import { validateFormatPublish } from "@/lib/tb-format-validation";

interface Category {
  id: string;
  name: string;
  default_sdgs: string[] | null;
}

interface City {
  id: string;
  name: string;
}

interface Association {
  id: string;
  name: string;
}

export interface TBFormat {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  category_id: string | null;
  secondary_tags: string[] | null;
  sdgs: string[] | null;
  location_type: string;
  participants_min: number | null;
  participants_max: number | null;
  duration_hours: number | null;
  price_range_min: number | null;
  price_range_max: number | null;
  status: string;
  services: any;
  extra_services: any;
  nationwide: boolean;
  created_at: string;
  updated_at: string;
}

interface TBFormatEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  format: TBFormat | null;
  categories: Category[];
  cities: City[];
  associations: Association[];
  onSaved: () => void;
  /** Pre-loaded junction data for editing */
  initialCityIds?: string[];
  initialAssociationIds?: string[];
}

const LOCATION_TYPES = [
  { value: "indoor", label: "Indoor" },
  { value: "outdoor", label: "Outdoor" },
  { value: "both", label: "Entrambi" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Bozza" },
  { value: "published", label: "Pubblicato" },
  { value: "archived", label: "Archiviato" },
];

const EMPTY_ARRAY: string[] = [];

function parseJsonItems(jsonData: any): string[] {
  if (!jsonData) return [];
  if (typeof jsonData === "object" && Array.isArray(jsonData.items)) {
    return jsonData.items.filter((i: any) => typeof i === "string" && i.trim());
  }
  return [];
}

export function TBFormatEditDialog({
  open,
  onOpenChange,
  format,
  categories,
  cities,
  associations,
  onSaved,
  initialCityIds = EMPTY_ARRAY,
  initialAssociationIds = EMPTY_ARRAY,
}: TBFormatEditDialogProps) {
  const { toast } = useToast();
  const allSDGs = getAllSDGs();
  const [saving, setSaving] = useState(false);
  const [suggestedSdgs, setSuggestedSdgs] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    short_description: "",
    description: "",
    image_url: "",
    category_id: "",
    secondary_tags: [] as string[],
    sdgs: [] as string[],
    location_type: "both",
    participants_min: "",
    participants_max: "",
    duration_hours: "",
    price_range_min: "",
    price_range_max: "",
    status: "draft",
    nationwide: false,
  });

  const [serviceItems, setServiceItems] = useState<string[]>([]);
  const [extraServiceItems, setExtraServiceItems] = useState<string[]>([]);
  const [newService, setNewService] = useState("");
  const [newExtraService, setNewExtraService] = useState("");

  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [selectedAssociationIds, setSelectedAssociationIds] = useState<string[]>([]);

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;

    if (format) {
      setFormData({
        title: format.title,
        short_description: format.short_description || "",
        description: format.description || "",
        image_url: format.image_url || "",
        category_id: format.category_id || "",
        secondary_tags: format.secondary_tags || [],
        sdgs: format.sdgs || [],
        location_type: format.location_type,
        participants_min: format.participants_min?.toString() || "",
        participants_max: format.participants_max?.toString() || "",
        duration_hours: format.duration_hours?.toString() || "",
        price_range_min: format.price_range_min?.toString() || "",
        price_range_max: format.price_range_max?.toString() || "",
        status: format.status,
        nationwide: format.nationwide ?? false,
      });
      setServiceItems(parseJsonItems(format.services));
      setExtraServiceItems(parseJsonItems(format.extra_services));
      setSelectedCityIds(initialCityIds);
      setSelectedAssociationIds(initialAssociationIds);
      setSuggestedSdgs([]);
    } else {
      setFormData({
        title: "",
        short_description: "",
        description: "",
        image_url: "",
        category_id: "",
        secondary_tags: [],
        sdgs: [],
        location_type: "both",
        participants_min: "",
        participants_max: "",
        duration_hours: "",
        price_range_min: "",
        price_range_max: "",
        status: "draft",
        nationwide: false,
      });
      setServiceItems([]);
      setExtraServiceItems([]);
      setSelectedCityIds([]);
      setSelectedAssociationIds([]);
      setSuggestedSdgs([]);
    }
    setNewService("");
    setNewExtraService("");
  }, [open, format, initialCityIds, initialAssociationIds]);

  const handleCategoryChange = (categoryId: string) => {
    setFormData((prev) => ({ ...prev, category_id: categoryId }));
    const category = categories.find((c) => c.id === categoryId);
    if (category?.default_sdgs?.length) {
      setSuggestedSdgs(category.default_sdgs);
    } else {
      setSuggestedSdgs([]);
    }
  };

  const handleSDGToggle = (sdgCode: string) => {
    setFormData((prev) => ({
      ...prev,
      sdgs: prev.sdgs.includes(sdgCode)
        ? prev.sdgs.filter((s) => s !== sdgCode)
        : [...prev.sdgs, sdgCode],
    }));
  };

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      secondary_tags: prev.secondary_tags.includes(tag)
        ? prev.secondary_tags.filter((t) => t !== tag)
        : [...prev.secondary_tags, tag],
    }));
  };

  const toggleCity = (cityId: string) => {
    setSelectedCityIds((prev) =>
      prev.includes(cityId) ? prev.filter((id) => id !== cityId) : [...prev, cityId]
    );
  };

  const toggleAssociation = (assocId: string) => {
    setSelectedAssociationIds((prev) =>
      prev.includes(assocId) ? prev.filter((id) => id !== assocId) : [...prev, assocId]
    );
  };

  const addService = () => {
    const trimmed = newService.trim();
    if (trimmed && !serviceItems.includes(trimmed)) {
      setServiceItems((prev) => [...prev, trimmed]);
      setNewService("");
    }
  };

  const addExtraService = () => {
    const trimmed = newExtraService.trim();
    if (trimmed && !extraServiceItems.includes(trimmed)) {
      setExtraServiceItems((prev) => [...prev, trimmed]);
      setNewExtraService("");
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({ variant: "destructive", title: "Errore", description: "Il titolo è obbligatorio" });
      return;
    }

    // Validate if publishing
    if (formData.status === "published") {
      const { valid, missing } = validateFormatPublish(
        { ...formData, category_id: formData.category_id || null, nationwide: formData.nationwide },
        formData.nationwide ? 1 : selectedCityIds.length,
        selectedAssociationIds.length,
      );
      if (!valid) {
        toast({
          variant: "destructive",
          title: "Impossibile pubblicare",
          description: `Campi mancanti: ${missing.join(", ")}`,
        });
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        short_description: formData.short_description.trim() || null,
        description: formData.description.trim() || null,
        image_url: formData.image_url || null,
        category_id: formData.category_id || null,
        secondary_tags: formData.secondary_tags.length > 0 ? formData.secondary_tags : [],
        sdgs: formData.sdgs.length > 0 ? formData.sdgs : [],
        location_type: formData.location_type,
        participants_min: formData.participants_min ? parseInt(formData.participants_min) : null,
        participants_max: formData.participants_max ? parseInt(formData.participants_max) : null,
        duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : null,
        price_range_min: formData.price_range_min ? parseFloat(formData.price_range_min) : null,
        price_range_max: formData.price_range_max ? parseFloat(formData.price_range_max) : null,
        status: formData.status,
        services: { items: serviceItems },
        extra_services: { items: extraServiceItems },
        nationwide: formData.nationwide,
      };

      let formatId: string;

      if (format) {
        const { error } = await supabase
          .from("tb_formats")
          .update(payload)
          .eq("id", format.id);
        if (error) throw error;
        formatId = format.id;
      } else {
        const { data, error } = await supabase
          .from("tb_formats")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        formatId = data.id;
      }

      // Sync junction tables: cities (skip if nationwide)
      await supabase.from("tb_format_cities").delete().eq("format_id", formatId);
      if (!formData.nationwide && selectedCityIds.length > 0) {
        const { error: citiesError } = await supabase
          .from("tb_format_cities")
          .insert(selectedCityIds.map((city_id) => ({ format_id: formatId, city_id })));
        if (citiesError) throw citiesError;
      }

      // Sync junction tables: associations
      await supabase.from("tb_format_associations").delete().eq("format_id", formatId);
      if (selectedAssociationIds.length > 0) {
        const { error: assocError } = await supabase
          .from("tb_format_associations")
          .insert(selectedAssociationIds.map((association_id) => ({ format_id: formatId, association_id })));
        if (assocError) throw assocError;
      }

      toast({
        title: format ? "Aggiornato" : "Creato",
        description: `Format ${format ? "aggiornato" : "creato"} con successo`,
      });

      onOpenChange(false);
      onSaved();
    } catch (error: any) {
      devLog.error("Error saving tb_format:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile salvare il format",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>{format ? "Modifica Format" : "Nuovo Format"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="tb-title">Titolo *</Label>
            <Input
              id="tb-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nome del format"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="tb-desc">Descrizione</Label>
            <Textarea
              id="tb-desc"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrivi l'attività..."
              rows={4}
            />
          </div>

          {/* Image */}
          <div className="space-y-2">
            <Label>Immagine</Label>
            <LogoUpload
              currentLogoUrl={formData.image_url || null}
              onLogoChange={(url) => setFormData({ ...formData, image_url: url || "" })}
              bucket="experience-images"
              label="Carica immagine"
              aspectRatio="wide"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={formData.category_id} onValueChange={handleCategoryChange}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Seleziona categoria" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-[200]">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tag secondari</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={formData.secondary_tags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* SDGs */}
          <div className="space-y-2">
            <Label>SDGs</Label>
            {suggestedSdgs.length > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs text-muted-foreground">
                <Lightbulb className="h-4 w-4 flex-shrink-0" />
                <span>
                  Suggeriti dalla categoria:{" "}
                  {suggestedSdgs.map((s) => {
                    const sdg = allSDGs.find((x) => x.code === s);
                    return sdg ? `${sdg.icon} ${sdg.name}` : s;
                  }).join(", ")}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {allSDGs.map((sdg) => (
                <label
                  key={sdg.code}
                  className="flex items-center gap-2 text-xs cursor-pointer"
                >
                  <Checkbox
                    checked={formData.sdgs.includes(sdg.code)}
                    onCheckedChange={() => handleSDGToggle(sdg.code)}
                  />
                  <span>{sdg.icon} {sdg.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Location type */}
          <div className="space-y-2">
            <Label>Tipo location</Label>
            <Select
              value={formData.location_type}
              onValueChange={(v) => setFormData({ ...formData, location_type: v })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-[200]">
                {LOCATION_TYPES.map((lt) => (
                  <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Participants range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Partecipanti min</Label>
              <Input
                type="number"
                value={formData.participants_min}
                onChange={(e) => setFormData({ ...formData, participants_min: e.target.value })}
                placeholder="es. 10"
              />
            </div>
            <div className="space-y-2">
              <Label>Partecipanti max</Label>
              <Input
                type="number"
                value={formData.participants_max}
                onChange={(e) => setFormData({ ...formData, participants_max: e.target.value })}
                placeholder="es. 50"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Durata (ore)</Label>
            <Input
              type="number"
              value={formData.duration_hours}
              onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
              placeholder="es. 4"
              step="0.5"
            />
          </div>

          {/* Price range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prezzo min / persona (€)</Label>
              <Input
                type="number"
                value={formData.price_range_min}
                onChange={(e) => setFormData({ ...formData, price_range_min: e.target.value })}
                placeholder="es. 20"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Prezzo max / persona (€)</Label>
              <Input
                type="number"
                value={formData.price_range_max}
                onChange={(e) => setFormData({ ...formData, price_range_max: e.target.value })}
                placeholder="es. 80"
                step="0.01"
              />
            </div>
          </div>

          {/* Services included */}
          <div className="space-y-2">
            <Label>Servizi inclusi</Label>
            <div className="flex gap-2">
              <Input
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                placeholder="es. Istruttore esperto"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addService(); } }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addService} className="flex-shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {serviceItems.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {serviceItems.map((item, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">
                    {item}
                    <button
                      type="button"
                      onClick={() => setServiceItems((prev) => prev.filter((_, j) => j !== i))}
                      className="ml-1 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Extra services */}
          <div className="space-y-2">
            <Label>Servizi extra</Label>
            <div className="flex gap-2">
              <Input
                value={newExtraService}
                onChange={(e) => setNewExtraService(e.target.value)}
                placeholder="es. Pranzo con prodotti locali"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExtraService(); } }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addExtraService} className="flex-shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {extraServiceItems.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {extraServiceItems.map((item, i) => (
                  <Badge key={i} variant="outline" className="gap-1 pr-1">
                    {item}
                    <button
                      type="button"
                      onClick={() => setExtraServiceItems((prev) => prev.filter((_, j) => j !== i))}
                      className="ml-1 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Stato</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-[200]">
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nationwide switch + Cities multi-select */}
          <div className="space-y-2">
            <Label>Città disponibili</Label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={formData.nationwide}
                onCheckedChange={(checked) => setFormData({ ...formData, nationwide: checked })}
              />
              <span className="text-sm">Erogabile in tutta Italia</span>
            </label>
            {!formData.nationwide && (
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto border rounded-md p-3">
                {cities.map((city) => (
                  <Badge
                    key={city.id}
                    variant={selectedCityIds.includes(city.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCity(city.id)}
                  >
                    {city.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Associations multi-select */}
          <div className="space-y-2">
            <Label>Associazioni erogabili</Label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto border rounded-md p-3">
              {associations.map((assoc) => (
                <Badge
                  key={assoc.id}
                  variant={selectedAssociationIds.includes(assoc.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleAssociation(assoc.id)}
                >
                  {assoc.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {format ? "Salva" : "Crea"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
