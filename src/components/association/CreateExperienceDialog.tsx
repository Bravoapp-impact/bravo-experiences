import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { devLog } from "@/lib/logger";
import { toast } from "sonner";
import { BaseModal } from "@/components/common/BaseModal";
import { ExperienceForm, ExperienceFormData } from "./ExperienceForm";

interface ExperienceData {
  id: string;
  title: string;
  description: string | null;
  category_id?: string | null;
  city_id?: string | null;
  address: string | null;
  default_hours?: number | null;
  max_participants?: number | null;
  participant_info?: string | null;
  image_url: string | null;
}

interface CreateExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  experience?: ExperienceData;
}

export function CreateExperienceDialog({
  open,
  onOpenChange,
  onCreated,
  experience,
}: CreateExperienceDialogProps) {
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const isEdit = !!experience;

  const handleSubmit = async (data: ExperienceFormData) => {
    if (!profile?.id || !profile?.association_id) return;

    setSaving(true);
    try {
      if (isEdit) {
        const { error } = await supabase
          .from("experiences")
          .update({
            title: data.title,
            description: data.description,
            category_id: data.categoryId,
            category: data.categoryName,
            city_id: data.cityId,
            city: data.cityName,
            address: data.address || null,
            default_hours: data.defaultHours,
            max_participants: data.maxParticipants,
            participant_info: data.participantInfo || null,
            image_url: data.imageUrl,
          })
          .eq("id", experience!.id);

        if (error) {
          devLog.error("Error updating experience:", error);
          toast.error("Errore nel salvataggio delle modifiche");
          return;
        }

        toast.success("Modifiche salvate");
      } else {
        const { error } = await supabase.from("experiences").insert({
          title: data.title,
          description: data.description,
          category_id: data.categoryId,
          category: data.categoryName,
          city_id: data.cityId,
          city: data.cityName,
          address: data.address || null,
          default_hours: data.defaultHours,
          max_participants: data.maxParticipants,
          participant_info: data.participantInfo || null,
          image_url: data.imageUrl,
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
      }

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
      onClose={() => onOpenChange(false)}
      title={isEdit ? "Modifica esperienza" : "Nuova esperienza"}
    >
      <ExperienceForm
        key={experience?.id || "create"}
        experience={isEdit ? experience : undefined}
        onSubmit={handleSubmit}
        saving={saving}
        submitLabel={isEdit ? "Salva modifiche" : "Crea esperienza"}
        subtitle={
          isEdit
            ? undefined
            : "Compila i campi per creare una nuova esperienza di volontariato. Verrà salvata come bozza."
        }
      />
    </BaseModal>
  );
}
