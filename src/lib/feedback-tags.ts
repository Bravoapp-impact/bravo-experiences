/**
 * Shared constants for experience feedback positive tags.
 * Single source of truth: imported by FeedbackModal (write) and CompletedExperienceCard (read).
 */

export interface PositiveTag {
  slug: string;
  label: string;
}

export const POSITIVE_TAGS: PositiveTag[] = [
  { slug: "legato_colleghi", label: "Ho legato con i colleghi" },
  { slug: "contributo_concreto", label: "Ho dato un contributo concreto" },
  { slug: "realta_territorio", label: "Ho conosciuto una realtà del territorio" },
  { slug: "ben_organizzata", label: "Era organizzata bene" },
  { slug: "ets_accogliente", label: "L'associazione ci ha accolto benissimo" },
  { slug: "imparato_qualcosa", label: "Ho imparato qualcosa di nuovo" },
  { slug: "pausa_diversa", label: "Una pausa diversa dal solito" },
  { slug: "energia_buonumore", label: "Mi ha lasciato energia e buonumore" },
];

export const MAX_POSITIVE_TAGS = 3;

export const POSITIVE_TAG_LABELS: Record<string, string> = POSITIVE_TAGS.reduce(
  (acc, t) => {
    acc[t.slug] = t.label;
    return acc;
  },
  {} as Record<string, string>
);

export function getPositiveTagLabel(slug: string): string {
  return POSITIVE_TAG_LABELS[slug] ?? slug;
}
