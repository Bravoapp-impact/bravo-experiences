/**
 * Shared validation for TB format publishing.
 * A format can only be published if all required fields are present.
 */
export function validateFormatPublish(
  format: {
    title: string;
    category_id: string | null;
    participants_min: number | string | null;
    participants_max: number | string | null;
    price_range_min: number | string | null;
    price_range_max: number | string | null;
    nationwide?: boolean;
  },
  cityCount: number,
  associationCount: number,
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!format.title?.trim()) missing.push("Titolo");
  if (!format.category_id) missing.push("Categoria");
  if (!format.participants_min) missing.push("Partecipanti min");
  if (!format.participants_max) missing.push("Partecipanti max");
  if (!format.price_range_min) missing.push("Prezzo min");
  if (!format.price_range_max) missing.push("Prezzo max");
  if (!format.nationwide && cityCount === 0) missing.push("Almeno una città o 'Tutta Italia'");
  if (associationCount === 0) missing.push("Almeno un'associazione");

  return { valid: missing.length === 0, missing };
}
