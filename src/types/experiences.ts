/**
 * Shared types for experiences and experience dates.
 * Single source of truth — import from here instead of redefining locally.
 */

export interface ExperienceDate {
  id: string;
  start_datetime: string;
  end_datetime: string;
  max_participants: number;
  confirmed_count?: number;
  volunteer_hours?: number;
}

export interface Experience {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  association_name: string | null;
  association_logo_url?: string | null;
  city: string | null;
  address: string | null;
  category: string | null;
  sdgs?: string[];
  participant_info?: string | null;
  experience_dates?: ExperienceDate[];
}
