import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { devLog } from "@/lib/logger";
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
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
}

export interface ExperienceFormData {
  title: string;
  description: string;
  categoryId: string;
  categoryName: string | null;
  cityId: string;
  cityName: string | null;
  address: string;
  maxParticipants: number;
  participantInfo: string;
  imageUrl: string | null;
}

interface ExperienceInitialData {
  title?: string;
  description?: string | null;
  category_id?: string | null;
  city_id?: string | null;
  address?: string | null;
  default_hours?: number | null;
  max_participants?: number | null;
  participant_info?: string | null;
  image_url?: string | null;
}

interface ExperienceFormProps {
  experience?: ExperienceInitialData;
  onSubmit: (data: ExperienceFormData) => Promise<void>;
  saving: boolean;
  submitLabel: string;
  subtitle?: string;
}

export function ExperienceForm({
  experience,
  onSubmit,
  saving,
  submitLabel,
  subtitle,
}: ExperienceFormProps) {
  const { profile } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [title, setTitle] = useState(experience?.title || "");
  const [description, setDescription] = useState(experience?.description || "");
  const [categoryId, setCategoryId] = useState(experience?.category_id || "");
  const [cityId, setCityId] = useState(experience?.city_id || "");
  const [address, setAddress] = useState(experience?.address || "");
  const [maxParticipants, setMaxParticipants] = useState<number | "">(
    experience?.max_participants ?? ""
  );
  const [participantInfo, setParticipantInfo] = useState(
    experience?.participant_info || ""
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    experience?.image_url || null
  );
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(
    experience?.image_url || null
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchOptions();
  }, []);

  // Reset form when experience changes (e.g. opening edit for different experience)
  useEffect(() => {
    if (experience) {
      setTitle(experience.title || "");
      setDescription(experience.description || "");
      setCategoryId(experience.category_id || "");
      setCityId(experience.city_id || "");
      setAddress(experience.address || "");
      setMaxParticipants(experience.max_participants ?? "");
      setParticipantInfo(experience.participant_info || "");
      setImagePreview(experience.image_url || null);
      setExistingImageUrl(experience.image_url || null);
      setImageFile(null);
    }
  }, [experience]);

  const fetchOptions = async () => {
    const [catRes, cityRes] = await Promise.all([
      supabase.from("categories").select("id, name").order("name"),
      supabase.from("cities").select("id, name").order("name"),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (cityRes.data) setCities(cityRes.data);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setExistingImageUrl(null);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Il titolo è obbligatorio";
    if (!description.trim()) errs.description = "La descrizione è obbligatoria";
    if (!categoryId) errs.categoryId = "Seleziona una categoria";
    if (!cityId) errs.cityId = "Seleziona una città";
    if (!address.trim()) errs.address = "L'indirizzo è obbligatorio";
    if (!maxParticipants || maxParticipants < 1)
      errs.maxParticipants = "Il numero massimo è obbligatorio";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !profile?.association_id) return;

    let imageUrl = existingImageUrl;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${profile.association_id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("experience-images")
        .upload(path, imageFile);
      if (uploadError) {
        devLog.error("Image upload error:", uploadError);
        toast.error("Errore nel caricamento dell'immagine");
        return;
      }
      const { data: urlData } = supabase.storage
        .from("experience-images")
        .getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const categoryName =
      categories.find((c) => c.id === categoryId)?.name || null;
    const cityName = cities.find((c) => c.id === cityId)?.name || null;

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      categoryId,
      categoryName,
      cityId,
      cityName,
      address: address.trim(),
      maxParticipants: Number(maxParticipants),
      participantInfo: participantInfo.trim(),
      imageUrl,
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}

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
            <Label htmlFor="exp-hours">Durata (ore) *</Label>
            <Input
              id="exp-hours"
              type="number"
              min={1}
              max={24}
              placeholder="Es. 4"
              value={defaultHours}
              onChange={(e) =>
                setDefaultHours(e.target.value ? Number(e.target.value) : "")
              }
            />
            {errors.defaultHours && (
              <p className="text-sm text-destructive">{errors.defaultHours}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp-max">Max partecipanti *</Label>
            <Input
              id="exp-max"
              type="number"
              min={1}
              placeholder="Es. 15"
              value={maxParticipants}
              onChange={(e) =>
                setMaxParticipants(
                  e.target.value ? Number(e.target.value) : ""
                )
              }
            />
            {errors.maxParticipants && (
              <p className="text-sm text-destructive">
                {errors.maxParticipants}
              </p>
            )}
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
            submitLabel
          )}
        </Button>
      </div>
    </div>
  );
}
