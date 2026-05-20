import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { devLog } from "@/lib/logger";
import { toast } from "sonner";
import { BaseModal } from "@/components/common/BaseModal";
import { ExperienceForm, ExperienceFormData } from "./ExperienceForm";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ExperienceData {
  id: string;
  title: string;
  short_description?: string | null;
  description: string | null;
  category_id?: string | null;
  city_id?: string | null;
  address: string | null;
  default_hours?: number | null;
  participant_info?: string | null;
  image_url: string | null;
}

interface CreateExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  experience?: ExperienceData;
  isPublished?: boolean;
}

export function CreateExperienceDialog({
  open,
  onOpenChange,
  onCreated,
  experience,
  isPublished = false,
}: CreateExperienceDialogProps) {
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [pendingData, setPendingData] = useState<ExperienceFormData | null>(null);
  const isEdit = !!experience;

  const performSave = async (data: ExperienceFormData) => {
    if (!profile?.id || !profile?.association_id) return;

    setSaving(true);
    try {
      // Risolvi i nomi legacy (colonne text `category` / `city`) lookup-by-id.
      const [{ data: cat }, { data: city }] = await Promise.all([
        supabase.from("categories").select("name").eq("id", data.category_id).maybeSingle(),
        supabase.from("cities").select("name").eq("id", data.city_id).maybeSingle(),
      ]);

      const basePayload = {
        title: data.title,
        short_description: data.short_description,
        description: data.description,
        category_id: data.category_id,
        category: cat?.name ?? null,
        city_id: data.city_id,
        city: city?.name ?? null,
        address: data.address || null,
        default_hours: data.default_hours,
        participant_info: data.participant_info,
        image_url: data.image_url,
      };

      if (isEdit) {
        const { error } = await supabase
          .from("experiences")
          .update(basePayload)
          .eq("id", experience!.id);

        if (error) {
          devLog.error("Error updating experience:", error);
          toast.error("Errore nel salvataggio delle modifiche");
          return;
        }

        toast.success("Modifiche salvate");
      } else {
        const { error } = await supabase.from("experiences").insert({
          ...basePayload,
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

  const handleSubmit = async (data: ExperienceFormData) => {
    if (isEdit && isPublished) {
      setPendingData(data);
      return;
    }
    await performSave(data);
  };

  const handleConfirmLiveEdit = async () => {
    if (!pendingData) return;
    await performSave(pendingData);
    setPendingData(null);
  };

  return (
    <>
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
              ? (isPublished ? "Le modifiche saranno visibili immediatamente a tutti i dipendenti." : undefined)
              : "Compila i campi per creare una nuova esperienza di volontariato. Verrà salvata come bozza."
          }
        />
      </BaseModal>

      {/* Confirmation for live edits on published experiences */}
      <AlertDialog open={!!pendingData} onOpenChange={(open) => { if (!open) setPendingData(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma modifiche</AlertDialogTitle>
            <AlertDialogDescription>
              Le modifiche andranno live e saranno visibili a tutti i dipendenti immediatamente. Vuoi procedere?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLiveEdit} disabled={saving}>
              {saving ? "Salvataggio..." : "Conferma e pubblica"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
