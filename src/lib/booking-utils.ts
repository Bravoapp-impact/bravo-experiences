/**
 * Booking status utilities for Sprint 3 lifecycle.
 * 
 * Statuses: confirmed, verified, completed, cancelled, no_show
 * 
 * - "Active" bookings occupy a spot: confirmed, verified
 * - "Done" bookings count for impact: confirmed (past), completed, verified (past)
 * - Use ACTIVE_STATUSES for spot counting queries
 * - Use DONE_STATUSES for impact/stats queries
 * - Cancellation window: 14 days before event (enforced server-side by is_booking_cancellable())
 */

/** Statuses that occupy a spot (for availability checks) */
export const ACTIVE_BOOKING_STATUSES = ["confirmed", "verified"] as const;

/** Statuses that count as "completed" for impact stats */
export const DONE_BOOKING_STATUSES = ["confirmed", "completed"] as const;

/** Check if a booking status represents a completed/done experience */
export function isBookingDone(status: string, startDatetime?: string): boolean {
  if (status === "completed") return true;
  // Retrocompatibility: confirmed + past date = done
  if (status === "confirmed" && startDatetime) {
    return new Date(startDatetime) < new Date();
  }
  return false;
}

/** Check if a booking can be cancelled */
export function isBookingCancellable(status: string): boolean {
  return status === "confirmed";
}

/** Human-readable status label (Italian) */
export function getBookingStatusLabel(status: string): string {
  switch (status) {
    case "confirmed": return "Confermata";
    case "verified": return "Verificata";
    case "completed": return "Completata";
    case "cancelled": return "Annullata";
    case "no_show": return "Assente";
    default: return status;
  }
}
