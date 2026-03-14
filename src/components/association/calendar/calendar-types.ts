export interface CalendarEvent {
  id: string;
  experience_id: string;
  experience_title: string;
  start_datetime: string;
  end_datetime: string;
  max_participants: number;
  confirmed_count: number;
}

export type ViewMode = "month" | "week" | "day";

const EVENT_COLORS = [
  "hsl(274 100% 50%)",   // purple
  "hsl(200 80% 50%)",    // blue
  "hsl(142 71% 45%)",    // green
  "hsl(26 100% 55%)",    // orange
  "hsl(330 56% 53%)",    // pink
  "hsl(45 96% 45%)",     // gold
  "hsl(180 60% 45%)",    // teal
  "hsl(0 84% 60%)",      // red
];

const EVENT_BG_COLORS = [
  "hsl(274 100% 95%)",
  "hsl(200 80% 93%)",
  "hsl(142 71% 92%)",
  "hsl(26 100% 93%)",
  "hsl(330 56% 93%)",
  "hsl(45 96% 90%)",
  "hsl(180 60% 92%)",
  "hsl(0 84% 93%)",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getEventColor(experienceId: string): string {
  return EVENT_COLORS[hashString(experienceId) % EVENT_COLORS.length];
}

export function getEventBgColor(experienceId: string): string {
  return EVENT_BG_COLORS[hashString(experienceId) % EVENT_BG_COLORS.length];
}
