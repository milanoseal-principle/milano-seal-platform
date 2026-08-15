import {
  MATTER_STATES,
  type MatterState,
} from "@/data/matter-state-machine";

const CANONICAL_STATES = new Set<string>(MATTER_STATES);

/**
 * Read-only compatibility aliases for historical rows.
 *
 * These aliases are deliberately NOT transition authority. They only let
 * operator surfaces project legacy production rows into the current canonical
 * Matter lifecycle without rewriting historical data or creating a second
 * state machine.
 */
export const LEGACY_OPERATIONAL_STATE_ALIASES: Readonly<
  Record<string, MatterState>
> = {
  new: "intake_received",
  reviewing: "under_review",
  awaiting_payment: "awaiting_deposit",
  payment_pending: "deposit_pending_review",
  execution_completed: "execution_qa",
  apostille: "apostille_processing",
  courier_ready: "ready_for_release",
  released: "final_packet_assembled",
  shipped: "in_transit",
  complete: "completed",
};

export interface OperationalMatterSourceRow {
  id?: string | null;
  deal_id?: string | null;
  status?: string | null;
  deal_status?: string | null;
  client_name?: string | null;
  full_name?: string | null;
  destination_country?: string | null;
  country?: string | null;
  document_type?: string | null;
  document?: string | null;
  service_type?: string | null;
  payment_status?: string | null;
  payment_confirmed?: boolean | null;
  payment_settlement_status?: string | null;
  amount_due?: number | string | null;
  amount_paid?: number | string | null;
  verified_revenue?: number | string | null;
  due_at?: string | null;
  sla_deadline?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  scheduled_at?: string | null;
  apostille_at?: string | null;
  shipped_at?: string | null;
  delivery_at?: string | null;
  delivery_timestamp?: string | null;
  completed_at?: string | null;
  tracking_number?: string | null;
  carrier?: string | null;
  delivery_status?: string | null;
  delivery_eta?: string | null;
  is_paid_and_released?: boolean | null;
  execution_truth?: unknown;
  followup_24h?: boolean | null;
  followup_72h?: boolean | null;
  followup_7d?: boolean | null;
  follow_up_active?: boolean | null;
  apostille_required?: boolean | null;
  requires_apostille?: boolean | null;
}

export interface OperationalStateResolution {
  state: MatterState | null;
  rawState: string | null;
  source: "status" | "deal_status" | "none";
  aliasApplied: boolean;
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned || null;
}

function normalizeStateValue(value: unknown): {
  state: MatterState | null;
  raw: string | null;
  aliasApplied: boolean;
} {
  const raw = cleanString(value)?.toLowerCase() ?? null;
  if (!raw) return { state: null, raw: null, aliasApplied: false };

  if (CANONICAL_STATES.has(raw)) {
    return {
      state: raw as MatterState,
      raw,
      aliasApplied: false,
    };
  }

  const alias = LEGACY_OPERATIONAL_STATE_ALIASES[raw] ?? null;
  return {
    state: alias,
    raw,
    aliasApplied: Boolean(alias),
  };
}

export function resolveOperationalMatterState(
  row: OperationalMatterSourceRow,
): OperationalStateResolution {
  const primary = normalizeStateValue(row.status);
  if (primary.state) {
    return {
      state: primary.state,
      rawState: primary.raw,
      source: "status",
      aliasApplied: primary.aliasApplied,
    };
  }

  const fallback = normalizeStateValue(row.deal_status);
  if (fallback.state) {
    return {
      state: fallback.state,
      rawState: fallback.raw,
      source: "deal_status",
      aliasApplied: fallback.aliasApplied,
    };
  }

  return {
    state: null,
    rawState: primary.raw ?? fallback.raw,
    source: primary.raw ? "status" : fallback.raw ? "deal_status" : "none",
    aliasApplied: false,
  };
}

export function operationalMatterId(
  row: OperationalMatterSourceRow,
): string {
  return cleanString(row.id) ?? "unknown";
}

export function operationalMatterDisplayId(
  row: OperationalMatterSourceRow,
): string {
  return cleanString(row.deal_id) ?? operationalMatterId(row);
}

export function operationalClientName(
  row: OperationalMatterSourceRow,
): string {
  return cleanString(row.client_name) ?? cleanString(row.full_name) ?? "Matter";
}

export function operationalDestinationCountry(
  row: OperationalMatterSourceRow,
): string | null {
  return cleanString(row.destination_country) ?? cleanString(row.country);
}

export function operationalDocumentType(
  row: OperationalMatterSourceRow,
): string | null {
  return (
    cleanString(row.document_type) ??
    cleanString(row.document) ??
    cleanString(row.service_type)
  );
}

export function operationalDueAt(
  row: OperationalMatterSourceRow,
): string | null {
  return cleanString(row.due_at) ?? cleanString(row.sla_deadline);
}

export function operationalPaymentStatus(
  row: OperationalMatterSourceRow,
): string {
  return cleanString(row.payment_status)?.toLowerCase() ?? "unknown";
}

export function operationalPaymentVerified(
  row: OperationalMatterSourceRow,
): boolean {
  const paymentStatus = operationalPaymentStatus(row);
  const settlement = cleanString(row.payment_settlement_status)?.toLowerCase();

  return (
    row.payment_confirmed === true ||
    paymentStatus === "paid" ||
    paymentStatus === "confirmed" ||
    paymentStatus === "payment_confirmed" ||
    settlement === "settled" ||
    settlement === "confirmed"
  );
}

export function operationalApostilleRequired(
  row: OperationalMatterSourceRow,
): boolean {
  return Boolean(row.apostille_required ?? row.requires_apostille ?? false);
}

export function operationalMatterHref(
  row: OperationalMatterSourceRow,
): string {
  const id = cleanString(row.id);
  return id
    ? `/dashboard/deals/${encodeURIComponent(id)}`
    : "/dashboard/pipeline";
}

export function withMatterQuery(
  basePath: string,
  row: OperationalMatterSourceRow,
  extra: Record<string, string | null | undefined> = {},
): string {
  const params = new URLSearchParams();
  const matter = cleanString(row.id);
  const dealId = cleanString(row.deal_id);

  if (matter) params.set("matter", matter);
  if (dealId) params.set("deal", dealId);

  for (const [key, value] of Object.entries(extra)) {
    const cleaned = cleanString(value);
    if (cleaned) params.set(key, cleaned);
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function isOperationalTerminalState(
  state: MatterState | null,
): boolean {
  return state === "completed" || state === "lost" || state === "cancelled";
}

export function stateLabel(state: MatterState | null): string {
  if (!state) return "Unresolved";
  return state.replaceAll("_", " ");
}
