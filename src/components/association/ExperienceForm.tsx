/**
 * ExperienceForm (ETS) — thin wrapper attorno a `ExperienceFormFields`.
 *
 * Step 2 del refactor "unifica i due form esperienza":
 *  - Step 1: creato `ExperienceFormFields` (componente unificato).
 *  - Step 2 (questo): l'ex form ETS diventa un wrapper sottile che istanzia
 *    `react-hook-form` + `experienceSchema` e delega i campi al componente
 *    unificato in `mode="association"`.
 *  - Step 3: stesso lavoro per il dialog super-admin.
 *
 * API esterna preservata (props `experience`, `onSubmit`, `saving`,
 * `submitLabel`, `subtitle`) per non rompere `CreateExperienceDialog`.
 *
 * NOTA: `max_participants` non viene più letto né scritto qui — vive solo su
 * `experience_dates`. La colonna `experiences.max_participants` resta in DB
 * finché non avremo migrato anche il dialog super-admin.
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ExperienceFormFields,
  experienceSchema,
  type ExperienceFormValues,
} from "@/components/experiences/ExperienceFormFields";

/**
 * Dati che il wrapper passa a chi salva (CreateExperienceDialog).
 * Mappa snake_case → struttura attesa dal layer storage (categoryName/cityName
 * vengono risolti dentro `CreateExperienceDialog` per popolare le colonne
 * legacy text).
 */
export interface ExperienceFormData {
  title: string;
  short_description: string | null;
  description: string;
  category_id: string;
  city_id: string;
  address: string;
  default_hours: number;
  participant_info: string | null;
  image_url: string | null;
}

interface ExperienceInitialData {
  title?: string;
  short_description?: string | null;
  description?: string | null;
  category_id?: string | null;
  city_id?: string | null;
  address?: string | null;
  default_hours?: number | null;
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

function toDefaults(exp?: ExperienceInitialData): ExperienceFormValues {
  return {
    title: exp?.title ?? "",
    short_description: exp?.short_description ?? "",
    description: exp?.description ?? "",
    category_id: exp?.category_id ?? "",
    city_id: exp?.city_id ?? "",
    address: exp?.address ?? "",
    default_hours: exp?.default_hours ?? 3,
    participant_info: exp?.participant_info ?? "",
    image_url: exp?.image_url ?? "",
  };
}

export function ExperienceForm({
  experience,
  onSubmit,
  saving,
  submitLabel,
  subtitle,
}: ExperienceFormProps) {
  const form = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: toDefaults(experience),
    mode: "onBlur",
  });

  // Reset quando l'esperienza in modifica cambia identità
  useEffect(() => {
    form.reset(toDefaults(experience));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experience?.title, experience?.description, experience?.category_id, experience?.city_id, experience?.address, experience?.default_hours, experience?.participant_info, experience?.image_url, experience?.short_description]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      title: values.title.trim(),
      short_description: values.short_description?.trim() || null,
      description: values.description.trim(),
      category_id: values.category_id,
      city_id: values.city_id,
      address: values.address.trim(),
      default_hours: values.default_hours,
      participant_info: values.participant_info?.trim() || null,
      image_url: values.image_url || null,
    });
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
        <ExperienceFormFields mode="association" form={form} />
      </div>

      {/* Fixed footer */}
      <div className="flex-shrink-0 p-5 border-t border-border bg-background">
        <Button
          type="submit"
          className="w-full h-12 text-base font-medium rounded-xl"
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
    </form>
  );
}
