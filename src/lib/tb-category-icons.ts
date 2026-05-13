import {
  Sparkles,
  PawPrint,
  Palette,
  Hammer,
  Users,
  Landmark,
  GraduationCap,
  ChefHat,
  Leaf,
  Sprout,
  Dumbbell,
  Drama,
  type LucideIcon,
} from "lucide-react";

/**
 * Mappa fissa categoryId → LucideIcon per le 11 categorie attive.
 * Usata da:
 * - card "Richiesta in corso" nella lista HR `/hr/team-building`
 * - (Step 4/5) card proposte/preventivi se serviranno coerenza visiva
 *
 * Fallback `Sparkles` per id sconosciuti, "none", o array vuoto.
 */
const CATEGORY_ICON_BY_ID: Record<string, LucideIcon> = {
  "95af5658-5e4a-4611-922e-54eb3849ad18": PawPrint,        // Animali
  "966ee901-ed8e-4345-9a89-b16d1a644a4a": Palette,         // Arte e creatività
  "9633d240-9f10-4cbb-9ddd-2f8931aac7e9": Hammer,          // Artigianato e manualità
  "e34d75c7-1d04-47c9-81aa-fd787f154e30": Users,           // Compagnia e socialità
  "272cc545-5fc8-482b-96c3-8a5f1fae0a81": Landmark,        // Cultura e territorio
  "824e4d22-0370-4d70-bc64-4c80d9a46e0f": GraduationCap,   // Educazione e doposcuola
  "d2ad0afc-abaf-419a-b4df-71c848766c24": ChefHat,         // Gastronomia e cucina
  "41b58671-dd5b-4cec-a75b-39f410c77aff": Leaf,            // Natura e ambiente
  "62d62ef8-0ea0-431b-9660-7a98c3f275d6": Sprout,          // Orti e apicoltura
  "af649621-a68a-4459-a6d7-d37818148a80": Dumbbell,        // Sport e movimento
  "99c1a617-1054-43a3-b58a-b7cea9a6fae5": Drama,           // Teatro e performance
};

export const TB_CATEGORY_FALLBACK_ICON: LucideIcon = Sparkles;

export function getTbCategoryIcon(categoryId: string | null | undefined): LucideIcon {
  if (!categoryId || categoryId === "none") return TB_CATEGORY_FALLBACK_ICON;
  return CATEGORY_ICON_BY_ID[categoryId] ?? TB_CATEGORY_FALLBACK_ICON;
}

/** Estrae il primo categoryId valido da `extra_services.preferred_activities`. */
export function getTbPrimaryCategoryId(
  preferredActivities: unknown,
): string | null {
  if (!Array.isArray(preferredActivities)) return null;
  for (const v of preferredActivities) {
    if (typeof v === "string" && v.length > 0 && v !== "none") return v;
  }
  return null;
}
