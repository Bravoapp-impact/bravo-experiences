/**
 * Single source of truth for tb_requests.status mapping.
 *
 * Esaustività garantita dal compiler: TBRequestStatus è una union literal
 * e TB_REQUEST_STATUS_META è Record<TBRequestStatus, TBStatusMeta>, quindi
 * dimenticare uno status produce un errore di build.
 */

export type TBRequestStatus =
  | "draft"
  | "submitted"
  | "in_matching"
  | "proposals_ready"
  | "proposals_sent"
  | "proposals_reviewed"
  | "quote_requested"
  | "quote_in_composition"
  | "quote_sent"
  | "modification_requested"
  | "quote_accepted"
  | "quote_rejected"
  | "signed"
  | "event_scheduled"
  | "completed"
  | "cancelled";

export type TBStatusGroup =
  | "admin_action_needed"
  | "hr_action_needed"
  | "in_progress"
  | "completed"
  | "closed";

export interface TBStatusMeta {
  value: TBRequestStatus;
  label: string;
  group: TBStatusGroup;
  badgeClass: string;
}

const GROUP_BADGE: Record<TBStatusGroup, string> = {
  admin_action_needed: "bg-amber-100 text-amber-800 border-amber-200",
  hr_action_needed: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-gray-100 text-gray-700 border-gray-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  closed: "bg-red-100 text-red-700 border-red-200",
};

function meta(value: TBRequestStatus, label: string, group: TBStatusGroup): TBStatusMeta {
  return { value, label, group, badgeClass: GROUP_BADGE[group] };
}

export const TB_REQUEST_STATUS_META: Record<TBRequestStatus, TBStatusMeta> = {
  draft: meta("draft", "Bozza", "in_progress"),
  submitted: meta("submitted", "Inviata", "admin_action_needed"),
  in_matching: meta("in_matching", "In matching", "admin_action_needed"),
  proposals_ready: meta("proposals_ready", "Proposte pronte", "admin_action_needed"),
  proposals_sent: meta("proposals_sent", "Proposte inviate", "hr_action_needed"),
  proposals_reviewed: meta("proposals_reviewed", "Proposte valutate", "admin_action_needed"),
  quote_requested: meta("quote_requested", "Quotazione richiesta", "admin_action_needed"),
  quote_in_composition: meta("quote_in_composition", "Preventivo in composizione", "admin_action_needed"),
  quote_sent: meta("quote_sent", "Preventivo inviato", "hr_action_needed"),
  modification_requested: meta("modification_requested", "Modifiche richieste", "admin_action_needed"),
  quote_accepted: meta("quote_accepted", "Preventivo accettato", "completed"),
  quote_rejected: meta("quote_rejected", "Preventivo rifiutato", "closed"),
  signed: meta("signed", "Contratto firmato", "completed"),
  event_scheduled: meta("event_scheduled", "Evento programmato", "completed"),
  completed: meta("completed", "Completata", "completed"),
  cancelled: meta("cancelled", "Cancellata", "closed"),
};

const FALLBACK_META: TBStatusMeta = {
  value: "draft",
  label: "Sconosciuto",
  group: "in_progress",
  badgeClass: GROUP_BADGE.in_progress,
};

export function getTBStatusMeta(status: string | null | undefined): TBStatusMeta {
  if (!status) return FALLBACK_META;
  return TB_REQUEST_STATUS_META[status as TBRequestStatus] ?? { ...FALLBACK_META, label: status };
}

export const TB_REQUEST_STATUS_OPTIONS: TBStatusMeta[] = Object.values(TB_REQUEST_STATUS_META);
