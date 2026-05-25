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

import { useState, useEffect } from "react";
import { useFormContext, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { devLog } from "@/lib/logger";

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
  /**
   * Solo super_admin: ID dell'esperienza in modifica. Necessario per gestire i
   * KPI di impatto (devono agganciarsi a un'esperienza esistente).
   */
  experienceId?: string;
}

export function ExperienceFormFields({ mode, form, experienceId }: ExperienceFormFieldsProps) {
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

          {/* KPI di impatto */}
          <ImpactKpisSection experienceId={experienceId} />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Impact KPIs section (super-admin only)
// ---------------------------------------------------------------------------

const MAX_KPIS = 3;

interface ImpactKpi {
  id: string;
  label: string;
  sort_order: number;
}

const impactKpisKey = (experienceId: string) => ["experience-impact-kpis", experienceId] as const;

function ImpactKpisSection({ experienceId }: { experienceId?: string }) {
  const qc = useQueryClient();
  const enabled = Boolean(experienceId);

  const { data: kpis = [], isLoading } = useQuery({
    queryKey: experienceId ? impactKpisKey(experienceId) : ["experience-impact-kpis", "none"],
    queryFn: async (): Promise<ImpactKpi[]> => {
      if (!experienceId) return [];
      const { data, error } = await supabase
        .from("experience_impact_kpis")
        .select("id, label, sort_order")
        .eq("experience_id", experienceId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled,
    staleTime: 1000 * 30,
  });

  const invalidate = () => {
    if (experienceId) qc.invalidateQueries({ queryKey: impactKpisKey(experienceId) });
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!experienceId) throw new Error("missing experience");
      const nextSort = kpis.length > 0 ? Math.max(...kpis.map((k) => k.sort_order)) + 1 : 0;
      const { error } = await supabase
        .from("experience_impact_kpis")
        .insert({ experience_id: experienceId, label: "Nuovo KPI", sort_order: nextSort });
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: unknown) => {
      devLog.error("Add KPI error:", e);
      toast.error("Impossibile aggiungere il KPI");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, label }: { id: string; label: string }) => {
      const { error } = await supabase
        .from("experience_impact_kpis")
        .update({ label })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: unknown) => {
      devLog.error("Update KPI error:", e);
      toast.error("Impossibile salvare l'etichetta");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("experience_impact_kpis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: unknown) => {
      devLog.error("Delete KPI error:", e);
      toast.error("Impossibile rimuovere il KPI");
    },
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>KPI di impatto</Label>
        {enabled && (
          <span className="text-xs text-muted-foreground">
            {kpis.length}/{MAX_KPIS}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Definisci da 1 a {MAX_KPIS} etichette di ciò che l'esperienza misura (es. "Pasti
        distribuiti"). Su ogni data registrerai poi i valori raggiunti.
      </p>

      {!enabled ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
          Salva prima l'esperienza per poter definire i KPI di impatto.
        </div>
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Caricamento KPI…
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {kpis.map((k) => (
              <KpiRow
                key={k.id}
                kpi={k}
                onSave={(label) => updateMutation.mutate({ id: k.id, label })}
                onDelete={() => deleteMutation.mutate(k.id)}
                deleting={deleteMutation.isPending}
              />
            ))}
            {kpis.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Nessun KPI definito.</p>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addMutation.mutate()}
            disabled={kpis.length >= MAX_KPIS || addMutation.isPending}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Aggiungi KPI
          </Button>
        </>
      )}
    </div>
  );
}

function KpiRow({
  kpi,
  onSave,
  onDelete,
  deleting,
}: {
  kpi: ImpactKpi;
  onSave: (label: string) => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [value, setValue] = useState(kpi.label);
  useEffect(() => setValue(kpi.label), [kpi.label]);

  const commit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setValue(kpi.label);
      return;
    }
    if (trimmed !== kpi.label) onSave(trimmed);
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        maxLength={80}
        placeholder="Es. Pasti distribuiti"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDelete}
        disabled={deleting}
        aria-label="Rimuovi KPI"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Re-export utility per chi vuole agganciare il form senza importare il context
export { useFormContext };
