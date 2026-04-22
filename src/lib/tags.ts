/**
 * Unified secondary tags — shared by experiences and tb_formats.
 * Single source of truth. Import from here.
 */
export const AVAILABLE_TAGS = [
  "Outdoor",
  "Indoor",
  "Manuale",
  "Creativo",
  "Formativo",
  "Intergenerazionale",
  "Animali",
  "Gruppo",
  "Accessibile",
  "Fisica",
  "Inclusione",
  "Sostenibilità",
  "Cultura locale",
  "Culinario",
  "Sportivo",
] as const;

export type SecondaryTag = (typeof AVAILABLE_TAGS)[number];
