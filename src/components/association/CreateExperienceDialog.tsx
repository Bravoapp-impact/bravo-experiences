import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { devLog } from "@/lib/logger";
import { toast } from "sonner";
import { BaseModal } from "@/components/common/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
}

interface CreateExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateExperienceDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateExperienceDialogProps) {
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cityId, setCityId] = useState("");
  const [address, setAddress] = useState("");
  const [defaultHours, setDefaultHours] = useState<number | "">("");
  const [maxParticipants, setMaxParticipants] = useState<number | "">("");
  const [participantInfo, setParticipantInfo] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      fetchOptions();
    }
  }, [open]);

  const fetchOptions = async () => {
    const [catRes, cityRes] = await Promise.all([
      supabase.from("categories").select("id, name").order("name"),
      supabase.from("cities").select("id, name").order("name"),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (cityRes.data) setCities(cityRes.data);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategoryId("");
    setCityId("");
    setAddress("");
    setDefaultHours("");
    setMaxParticipants("");
    setParticipantInfo("");
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Il titolo è obbligatorio";
    if (!description.trim()) errs.description = "La descrizione è obbligatoria";
    if (!categoryId) errs.categoryId = "Seleziona una categoria";
    if (!cityId) errs.cityId = "Seleziona una città";
    if (!address.trim()) errs.address = "L'indirizzo è obbligatorio";
    if (!defaultHours || defaultHours < 1) errs.defaultHours = "La durata è obbligatoria";
    if (!maxParticipants || maxParticipants < 1) errs.maxParticipants = "Il numero massimo è obbligatorio";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !profile?.id || !profile?.association_id) return;

    setSaving(true);
    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${profile.association_id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("experience-images")
          .upload(path, imageFile);
        if (uploadError) {
          devLog.error("Image upload error:", uploadError);
          toast.error("Errore nel caricamento dell'immagine");
          setSaving(false);
          return;
        }
        const { data: urlData } = supabase.storage
          .from("experience-images")
          .getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const categoryName = categories.find((c) => c.id === categoryId)?.name || null;
      const cityName = cities.find((c) => c.id === cityId)?.name || null;

      const { error } = await supabase.from("experiences").insert({
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId,
        category: categoryName,
        city_id: cityId,
        city: cityName,
        address: address.trim() || null,
        participant_info: participantInfo.trim() || null,
        image_url: imageUrl,
        status: "draft",
        visibility: "public",
        type: "volunteering",
        created_by: profile.id,
        association_id: profile.association_id,
      });

      if (error) {
        devLog.error("Error creating experience:", error);
        toast.error("Errore nella creazione dell'esperienza");
        return;
      }

      toast.success("Esperienza creata come bozza");
      resetForm();
      onOpenChange(false);
      onCreated();
    } catch (err) {
      devLog.error("Unexpected error:", err);
      toast.error("Errore imprevisto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title="Nuova esperienza"
    >
      <div className="flex flex-col h-full sm:max-h-[85vh] overflow-hidden">
        {/* Scrollable form content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Compila i campi per creare una nuova esperienza di volontariato. Verrà salvata come bozza.
          </p>

          {/* Titolo */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-title">Titolo *</Label>
            <Input
              id="exp-title"
              placeholder="Es. Pulizia parco cittadino"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Descrizione */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-desc">Descrizione *</Label>
            <Textarea
              id="exp-desc"
              placeholder="Descrivi brevemente cosa faranno i volontari"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Categoria */}
          <div className="space-y-1.5">
            <Label>Categoria *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-destructive">{errors.categoryId}</p>
            )}
          </div>

          {/* Città */}
          <div className="space-y-1.5">
            <Label>Città *</Label>
            <Select value={cityId} onValueChange={setCityId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona città" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.cityId && (
              <p className="text-sm text-destructive">{errors.cityId}</p>
            )}
          </div>

          {/* Indirizzo */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-address">Indirizzo *</Label>
            <Input
              id="exp-address"
              placeholder="Indirizzo specifico del punto di ritrovo"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={300}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address}</p>
            )}
          </div>

          {/* Durata e Partecipanti */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-hours">Durata (ore)</Label>
              <Input
                id="exp-hours"
                type="number"
                min={1}
                max={24}
                value={defaultHours}
                onChange={(e) => setDefaultHours(Number(e.target.value) || 4)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-max">Max partecipanti</Label>
              <Input
                id="exp-max"
                type="number"
                min={1}
                placeholder="Es. 15"
                value={maxParticipants}
                onChange={(e) =>
                  setMaxParticipants(e.target.value ? Number(e.target.value) : "")
                }
              />
            </div>
          </div>

          {/* Participant info */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-info">Informazioni per i partecipanti</Label>
            <Textarea
              id="exp-info"
              placeholder="Cosa portare, come vestirsi, dove parcheggiare..."
              value={participantInfo}
              onChange={(e) => setParticipantInfo(e.target.value)}
              rows={2}
              maxLength={1000}
            />
          </div>

          {/* Image upload */}
          <div className="space-y-1.5">
            <Label>Immagine di copertina</Label>
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img
                  src={imagePreview}
                  alt="Anteprima"
                  className="w-full h-40 object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-sm text-muted-foreground">
                  Clicca per caricare
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>
        </div>

        {/* Fixed footer */}
        <div className="flex-shrink-0 p-5 border-t border-border bg-background">
          <Button
            className="w-full h-12 text-base font-medium rounded-xl"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvataggio...
              </>
            ) : (
              "Crea esperienza"
            )}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
