/**
 * ExperienceFormFields — superset di campi di un'esperienza, unico per ETS e super-admin.
 *
 * Step 1 del refactor "unifica i due form esperienza":
 *  - Step 1 (questo): creare il componente, isolato, non integrato.
 *  - Step 2: migrare `src/components/association/ExperienceForm.tsx` a wrappare questo componente.
 *  - Step 3: migrare il dialog inline in `src/pages/super-admin/ExperiencesPage.tsx`.
 *
 * Il componente è puramente "presentational + validation":
 *  - non fa submit (lo fa il wrapper),
 *  - riceve il `form` (UseFormReturn) come prop,
 *  - carica autonomamente categorie/città/associazioni via TanStack Query.
 */

import { useFormContext, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Controller } from "react-hook-form";

import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogoUpload } from "@/components/super-admin/LogoUpload";
import { AVAILABLE_TAGS } from "@/lib/tags";
import { getAllSDGs } from "@/lib/sdg-data";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

/**
 * Schema unico per i campi esperienza. I campi solo super-admin sono opzionali
 * a livello di schema; la required-ness aggiuntiva è imposta dal wrapper in
 * base al `mode` (es. con `.superRefine` o validazione locale).
 *
 * NOTA: `max_participants` è volutamente assente — vive solo in
 * `experience_dates.max_participants` nel nuovo modello.
 */
export const experienceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(20, "Il titolo deve avere almeno 20 caratteri")
    .max(80, "Il titolo non può superare 80 caratteri"),
  short_description: z
    .string()
    .trim()
    .max(150, "Massimo 150 caratteri")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .min(1, "La descrizione è obbligatoria")
    .max(2000, "Massimo 2000 caratteri"),
  category_id: z.string().uuid("Seleziona una categoria"),
  city_id: z.string().uuid("Seleziona una città"),
  address: z.string().trim().min(1, "L'indirizzo è obbligatorio").max(300),
  default_hours: z
    .number({ invalid_type_error: "Inserisci un numero" })
    .int("Inserisci un numero intero")
    .min(1, "Minimo 1 ora")
    .max(24, "Massimo 24 ore"),
  participant_info: z
    .string()
    .trim()
    .max(1000, "Massimo 1000 caratteri")
    .optional()
    .or(z.literal("")),
  image_url: z.string().url().optional().or(z.literal("")),

  // Super-admin only
  association_id: z.string().uuid().optional().or(z.literal("")),
  sdgs: z.array(z.string()).optional(),
  secondary_tags: z.array(z.string()).optional(),
  location_type: z.enum(["indoor", "outdoor", "both"]).optional(),
});

export type ExperienceFormValues = z.infer<typeof experienceSchema>;

// ---------------------------------------------------------------------------
// Data hooks (inline — molto piccoli, vivono qui finché non li promuoviamo)
// ---------------------------------------------------------------------------

function useCategoriesOptions() {
  return useQuery({
    queryKey: ["categories", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

function useCitiesOptions() {
  return useQuery({
    queryKey: ["cities", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

function useAssociationsOptions() {
  return useQuery({
    queryKey: ["associations", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("associations")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface ExperienceFormFieldsProps {
  mode: "association" | "super_admin";
  /**
   * Form esterno. Il componente non istanzia il form: lo riceve. Così il
   * wrapper controlla submit, defaults, reset e integrazione con Supabase.
   */
  form: UseFormReturn<ExperienceFormValues>;
}

export function ExperienceFormFields({ mode, form }: ExperienceFormFieldsProps) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const isSuperAdmin = mode === "super_admin";

  const { data: categories = [] } = useCategoriesOptions();
  const { data: cities = [] } = useCitiesOptions();
  const { data: associations = [] } = useAssociationsOptions(); // sempre query, costo minimo
  const allSDGs = getAllSDGs();

  const titleValue = watch("title") ?? "";
  const shortDescValue = watch("short_description") ?? "";
  const sdgsValue = watch("sdgs") ?? [];
  const tagsValue = watch("secondary_tags") ?? [];

  const toggleSdg = (code: string) => {
    const next = sdgsValue.includes(code)
      ? sdgsValue.filter((s) => s !== code)
      : [...sdgsValue, code];
    setValue("sdgs", next, { shouldDirty: true, shouldValidate: true });
  };

  const toggleTag = (tag: string) => {
    const next = tagsValue.includes(tag)
      ? tagsValue.filter((t) => t !== tag)
      : [...tagsValue, tag];
    setValue("secondary_tags", next, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="space-y-5">
      {/* Titolo */}
      <div className="space-y-1.5">
        <Label htmlFor="exp-title">Titolo *</Label>
        <Input
          id="exp-title"
          placeholder="Es. Pulizia parco cittadino con i bambini"
          maxLength={80}
          {...register("title")}
        />
        <div className="flex items-center justify-between">
          {errors.title ? (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Tra 20 e 80 caratteri</p>
          )}
          <p className="text-xs text-muted-foreground">{titleValue.trim().length}/80</p>
        </div>
      </div>

      {/* Short description */}
      <div className="space-y-1.5">
        <Label htmlFor="exp-short-desc">Descrizione breve</Label>
        <Input
          id="exp-short-desc"
          placeholder="Frase di apertura che invoglia a partecipare"
          maxLength={150}
          {...register("short_description")}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Frase di apertura che invoglia a partecipare (max 150 caratteri)
          </p>
          <p className="text-xs text-muted-foreground">{shortDescValue.length}/150</p>
        </div>
        {errors.short_description && (
          <p className="text-sm text-destructive">{errors.short_description.message}</p>
        )}
      </div>

      {/* Descrizione */}
      <div className="space-y-1.5">
        <Label htmlFor="exp-desc">Descrizione *</Label>
        <Textarea
          id="exp-desc"
          placeholder="Descrivi cosa faranno i volontari"
          rows={4}
          maxLength={2000}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Categoria */}
      <div className="space-y-1.5">
        <Label>Categoria *</Label>
        <Controller
          control={control}
          name="category_id"
          render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona categoria" />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.category_id && (
          <p className="text-sm text-destructive">{errors.category_id.message}</p>
        )}
      </div>

      {/* Città */}
      <div className="space-y-1.5">
        <Label>Città *</Label>
        <Controller
          control={control}
          name="city_id"
          render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona città" />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                {cities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.city_id && (
          <p className="text-sm text-destructive">{errors.city_id.message}</p>
        )}
      </div>

      {/* Indirizzo */}
      <div className="space-y-1.5">
        <Label htmlFor="exp-address">Indirizzo *</Label>
        <Input
          id="exp-address"
          placeholder="Indirizzo specifico del punto di ritrovo"
          maxLength={300}
          {...register("address")}
        />
        {errors.address && (
          <p className="text-sm text-destructive">{errors.address.message}</p>
        )}
      </div>

      {/* Durata */}
      <div className="space-y-1.5">
        <Label htmlFor="exp-hours">Durata (ore) *</Label>
        <Input
          id="exp-hours"
          type="number"
          min={1}
          max={24}
          step={1}
          placeholder="Es. 3"
          {...register("default_hours", { valueAsNumber: true })}
        />
        <p className="text-xs text-muted-foreground">
          Durata tipica dell'attività in ore
        </p>
        {errors.default_hours && (
          <p className="text-sm text-destructive">{errors.default_hours.message}</p>
        )}
      </div>

      {/* Participant info */}
      <div className="space-y-1.5">
        <Label htmlFor="exp-info">Informazioni per i partecipanti</Label>
        <Textarea
          id="exp-info"
          placeholder="Cosa portare, come vestirsi, indicazioni pratiche"
          rows={3}
          maxLength={1000}
          {...register("participant_info")}
        />
        <p className="text-xs text-muted-foreground">
          Cosa portare, come vestirsi, indicazioni pratiche
        </p>
      </div>

      {/* Immagine */}
      <div className="space-y-1.5">
        <Label>Immagine di copertina</Label>
        <Controller
          control={control}
          name="image_url"
          render={({ field }) => (
            <LogoUpload
              currentLogoUrl={field.value || null}
              onLogoChange={(url) => field.onChange(url || "")}
              bucket="experience-images"
              label="Carica immagine"
              aspectRatio="wide"
            />
          )}
        />
      </div>

      {/* ============== Super-admin only ============== */}
      {isSuperAdmin && (
        <>
          {/* Associazione */}
          <div className="space-y-1.5">
            <Label>Associazione *</Label>
            <Controller
              control={control}
              name="association_id"
              render={({ field }) => (
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona associazione" />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                    {associations.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.association_id && (
              <p className="text-sm text-destructive">{errors.association_id.message}</p>
            )}
          </div>

          {/* Location type */}
          <div className="space-y-1.5">
            <Label>Tipo location *</Label>
            <Controller
              control={control}
              name="location_type"
              render={({ field }) => (
                <RadioGroup
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  className="flex gap-4"
                >
                  {[
                    { v: "indoor", l: "Indoor" },
                    { v: "outdoor", l: "Outdoor" },
                    { v: "both", l: "Entrambi" },
                  ].map((opt) => (
                    <label
                      key={opt.v}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <RadioGroupItem value={opt.v} />
                      <span>{opt.l}</span>
                    </label>
                  ))}
                </RadioGroup>
              )}
            />
            {errors.location_type && (
              <p className="text-sm text-destructive">{errors.location_type.message}</p>
            )}
          </div>

          {/* Tag secondari */}
          <div className="space-y-1.5">
            <Label>Tag secondari</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => {
                const selected = tagsValue.includes(tag);
                return (
                  <Badge
                    key={tag}
                    variant={selected ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* SDGs */}
          <div className="space-y-1.5">
            <Label>SDGs (Obiettivi di Sviluppo Sostenibile)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {allSDGs.map((sdg) => (
                <label
                  key={sdg.code}
                  className="flex items-center gap-2 text-xs cursor-pointer"
                >
                  <Checkbox
                    checked={sdgsValue.includes(sdg.code)}
                    onCheckedChange={() => toggleSdg(sdg.code)}
                  />
                  <span>
                    {sdg.icon} {sdg.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Re-export utility per chi vuole agganciare il form senza importare il context
export { useFormContext };
