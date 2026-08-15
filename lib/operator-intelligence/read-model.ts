import { MATTER_STATES } from "@/data/matter-state-machine";
import {
  normalizeExecutionTruth,
  validateExecutionTruth,
} from "@/lib/matter/executionTruth";
import {
  isOperationalTerminalState,
  operationalClientName,
  operationalDestinationCountry,
  operationalDocumentType,
  operationalDueAt,
  operationalMatterDisplayId,
  operationalMatterHref,
  operationalMatterId,
  operationalPaymentStatus,
  operationalPaymentVerified,
  resolveOperationalMatterState,
  withMatterQuery,
  type OperationalMatterSourceRow,
} from "@/lib/matter/canonicalOperationalRead";
import { createAdminClient } from "@/lib/supabase/admin";

export const OPERATOR_ACTION_CLASSES = [
  "Payment Blocked",
  "Document Blocked",
  "Authority Review",
  "Scheduling Due",
  "Apostille Pending",
  "Courier Exception",
  "Release Ready",
  "Overdue Follow-Up",
] as const;

export type OperatorActionClass =
  (typeof OPERATOR_ACTION_CLASSES)[number];

export type OperatorPriority = "critical" | "high" | "normal";

export interface OperatorMatterAction {
  id: string;
  matterId: string;
  internalId: string;
  clientName: string;
  actionClass: OperatorActionClass;
  priority: OperatorPriority;
  reason: string;
  state: string;
  paymentStatus: string;
  destinationCountry: string | null;
  documentType: string | null;
  dueAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  actionHref: string;
  matterHref: string;
}

export interface OperatorIntelligenceCapabilities {
  richMatterRead: boolean;
  executionTruth: boolean;
  followUps: boolean;
  slaDeadline: boolean;
}

export interface OperatorIntelligenceSnapshot {
  generatedAt: string;
  source: "canonical-deals";
  sourceTier: "rich" | "fallback";
  degraded: boolean;
  warning: string | null;
  mattersRead: number;
  counts: Record<OperatorActionClass, number>;
  capabilities: OperatorIntelligenceCapabilities;
  actions: OperatorMatterAction[];
}

interface RawMatterRow extends OperationalMatterSourceRow {
  id?: string | null;
  deal_id?: string | null;
}

interface MatterReadResult {
  rows: RawMatterRow[];
  sourceTier: "rich" | "fallback";
  capabilities: OperatorIntelligenceCapabilities;
}

const RICH_COLUMNS = [
  "id",
  "deal_id",
  "client_name",
  "full_name",
  "status",
  "deal_status",
  "payment_status",
  "payment_confirmed",
  "payment_settlement_status",
  "amount_due",
  "amount_paid",
  "verified_revenue",
  "destination_country",
  "country",
  "document_type",
  "document",
  "service_type",
  "execution_truth",
  "apostille_required",
  "requires_apostille",
  "created_at",
  "updated_at",
  "due_at",
  "sla_deadline",
  "scheduled_at",
  "apostille_at",
  "shipped_at",
  "delivery_at",
  "delivery_timestamp",
  "completed_at",
  "tracking_number",
  "carrier",
  "delivery_status",
  "delivery_eta",
  "is_paid_and_released",
  "followup_24h",
  "followup_72h",
  "followup_7d",
  "follow_up_active",
].join(", ");

const FALLBACK_COLUMNS = [
  "id",
  "deal_id",
  "client_name",
  "full_name",
  "status",
  "deal_status",
  "payment_status",
  "payment_confirmed",
  "destination_country",
  "country",
  "document_type",
  "document",
  "service_type",
  "created_at",
  "updated_at",
  "due_at",
  "sla_deadline",
].join(", ");

const CANONICAL_STATE_SET = new Set<string>(MATTER_STATES);

const PAYMENT_GATE_STATES = new Set([
  "quoted",
  "awaiting_deposit",
  "deposit_pending_review",
  "deposit_confirmed",
  "scheduling_unlocked",
  "final_balance_due",
  "final_payment_pending_review",
]);

const DOCUMENT_BLOCK_STATES = new Set([
  "needs_client_info",
  "document_correction_required",
]);

const SCHEDULING_DUE_STATES = new Set([
  "deposit_confirmed",
  "scheduling_unlocked",
]);

const APOSTILLE_PENDING_STATES = new Set([
  "apostille_packet_ready",
  "apostille_submitted",
  "apostille_processing",
  "apostille_rejected",
]);

const RELEASE_READY_STATES = new Set([
  "final_payment_confirmed",
  "ready_for_release",
]);

const ACTION_DESTINATIONS: Record<OperatorActionClass, string> = {
  "Payment Blocked": "/dashboard/ledger",
  "Document Blocked": "/dashboard/needs-review",
  "Authority Review": "/dashboard/authorities/verify",
  "Scheduling Due": "/dashboard/pipeline",
  "Apostille Pending": "/dashboard/apostille",
  "Courier Exception": "/dashboard/courier",
  "Release Ready": "/workspace/release",
  "Overdue Follow-Up": "/dashboard/follow-ups",
};

const PRIORITY_WEIGHT: Record<OperatorPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
};

function normalizedState(row: RawMatterRow): string {
  const resolution = resolveOperationalMatterState(row);
  return resolution.state ?? resolution.rawState ?? "unknown";
}

function validDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isPast(value: string | null | undefined, now: Date): boolean {
  const date = validDate(value);
  return Boolean(date && date.getTime() < now.getTime());
}

function ageHours(createdAt: string | null | undefined, now: Date): number | null {
  const created = validDate(createdAt);
  if (!created) return null;
  return Math.max(0, (now.getTime() - created.getTime()) / 3_600_000);
}

function hasExecutionTruth(row: RawMatterRow): boolean {
  return (
    typeof row.execution_truth === "object" &&
    row.execution_truth !== null &&
    !Array.isArray(row.execution_truth)
  );
}

function executionReviewReason(row: RawMatterRow): string | null {
  if (!hasExecutionTruth(row)) return null;

  const truth = normalizeExecutionTruth({ execution_truth: row.execution_truth });
  const validation = validateExecutionTruth(truth);

  if (!validation.reviewRequired && validation.valid) return null;
  if (validation.errors.length) return validation.errors.join(", ");

  return "Canonical execution truth requires operator review.";
}

function overdueFollowUpReason(
  row: RawMatterRow,
  now: Date,
  capabilities: OperatorIntelligenceCapabilities,
): { reason: string; priority: OperatorPriority } | null {
  if (!capabilities.followUps) return null;
  if (row.follow_up_active === false) return null;

  const paymentStatus = operationalPaymentStatus(row);
  if (!["unpaid", "pending"].includes(paymentStatus)) return null;

  const state = resolveOperationalMatterState(row).state;
  if (isOperationalTerminalState(state)) return null;

  const hours = ageHours(row.created_at, now);
  if (hours === null) return null;

  if (hours >= 168 && row.followup_7d !== true) {
    return {
      reason: "7-day canonical payment follow-up is overdue.",
      priority: "critical",
    };
  }

  if (hours >= 72 && row.followup_72h !== true) {
    return {
      reason: "72-hour canonical payment follow-up is overdue.",
      priority: "high",
    };
  }

  if (hours >= 24 && row.followup_24h !== true) {
    return {
      reason: "24-hour canonical payment follow-up is overdue.",
      priority: "high",
    };
  }

  return null;
}

function buildAction(
  row: RawMatterRow,
  actionClass: OperatorActionClass,
  priority: OperatorPriority,
  reason: string,
): OperatorMatterAction {
  const internal = operationalMatterId(row);
  const destinationCountry = operationalDestinationCountry(row);

  return {
    id: `${internal}:${actionClass.toLowerCase().replaceAll(" ", "-")}`,
    matterId: operationalMatterDisplayId(row),
    internalId: internal,
    clientName: operationalClientName(row),
    actionClass,
    priority,
    reason,
    state: normalizedState(row),
    paymentStatus: operationalPaymentStatus(row),
    destinationCountry,
    documentType: operationalDocumentType(row),
    dueAt: operationalDueAt(row),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    actionHref: withMatterQuery(ACTION_DESTINATIONS[actionClass], row, {
      focus: actionClass,
      country: actionClass === "Authority Review" ? destinationCountry : null,
    }),
    matterHref: operationalMatterHref(row),
  };
}

function deriveMatterActions(
  row: RawMatterRow,
  now: Date,
  capabilities: OperatorIntelligenceCapabilities,
): OperatorMatterAction[] {
  const stateResolution = resolveOperationalMatterState(row);
  const state = stateResolution.state;

  if (isOperationalTerminalState(state)) return [];

  const actions = new Map<OperatorActionClass, OperatorMatterAction>();
  const add = (
    actionClass: OperatorActionClass,
    priority: OperatorPriority,
    reason: string,
  ) => {
    if (!actions.has(actionClass)) {
      actions.set(actionClass, buildAction(row, actionClass, priority, reason));
    }
  };

  const paymentStatus = operationalPaymentStatus(row);
  const verifiedPayment = operationalPaymentVerified(row);

  if (state && PAYMENT_GATE_STATES.has(state) && !verifiedPayment) {
    const mismatchAfterConfirmationState =
      state === "deposit_confirmed" || state === "scheduling_unlocked";

    add(
      "Payment Blocked",
      paymentStatus === "failed" ||
        paymentStatus === "disputed" ||
        mismatchAfterConfirmationState
        ? "critical"
        : "high",
      mismatchAfterConfirmationState
        ? "Matter state indicates payment progression but canonical payment truth is not verified. Reconcile before scheduling."
        : paymentStatus === "failed" || paymentStatus === "disputed"
          ? `Canonical payment state is ${paymentStatus}; reconciliation is required before progression.`
          : "Matter is at a payment-gated state and verified payment is not confirmed.",
    );
  }

  if (state && DOCUMENT_BLOCK_STATES.has(state)) {
    add(
      "Document Blocked",
      state === "document_correction_required" ? "critical" : "high",
      state === "document_correction_required"
        ? "Canonical Matter state requires document correction before progression."
        : "Canonical Matter state requires additional client information.",
    );
  }

  if (capabilities.executionTruth) {
    const executionReason = executionReviewReason(row);
    if (executionReason) add("Authority Review", "high", executionReason);
  }

  if (state === "under_review" && !operationalDestinationCountry(row)) {
    add(
      "Authority Review",
      "high",
      "Destination authority cannot be resolved because destination country is missing.",
    );
  }

  if (state && SCHEDULING_DUE_STATES.has(state) && verifiedPayment) {
    add(
      "Scheduling Due",
      isPast(operationalDueAt(row), now) ? "critical" : "high",
      state === "scheduling_unlocked"
        ? "Canonical scheduling gate is unlocked and the Matter is awaiting scheduling."
        : "Verified payment is present and the Matter is ready for the canonical scheduling-unlock transition.",
    );
  }

  if (state && APOSTILLE_PENDING_STATES.has(state)) {
    add(
      "Apostille Pending",
      state === "apostille_rejected"
        ? "critical"
        : isPast(operationalDueAt(row), now)
          ? "high"
          : "normal",
      state === "apostille_rejected"
        ? "Apostille was rejected and requires governed correction or re-submission."
        : `Canonical Matter state is ${state.replaceAll("_", " ")}.`,
    );
  }

  const deliveryStatus = row.delivery_status?.trim().toLowerCase() ?? "";
  if (
    ["failed", "exception", "returned", "return_to_sender"].includes(
      deliveryStatus,
    )
  ) {
    add(
      "Courier Exception",
      "critical",
      `Carrier delivery state is ${deliveryStatus.replaceAll("_", " ")}; operator courier review is required.`,
    );
  } else if (state === "customs_watch") {
    add(
      "Courier Exception",
      "critical",
      "Canonical Matter state is customs watch; operator courier review is required.",
    );
  } else if (
    state === "in_transit" &&
    capabilities.slaDeadline &&
    isPast(operationalDueAt(row), now)
  ) {
    add(
      "Courier Exception",
      "high",
      "Matter remains in transit beyond its canonical SLA deadline.",
    );
  }

  if (state && RELEASE_READY_STATES.has(state)) {
    add(
      "Release Ready",
      isPast(operationalDueAt(row), now) ? "critical" : "high",
      state === "ready_for_release"
        ? "Canonical Matter state is ready for governed release QA."
        : "Final payment is confirmed and the Matter is eligible for the canonical ready-for-release transition.",
    );
  }

  const followUp = overdueFollowUpReason(row, now, capabilities);
  if (followUp) {
    add("Overdue Follow-Up", followUp.priority, followUp.reason);
  }

  return [...actions.values()];
}

async function readCanonicalMatterRows(limit: number): Promise<MatterReadResult> {
  const supabase = createAdminClient();

  const rich = await supabase
    .from("deals")
    .select(RICH_COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (!rich.error) {
    return {
      rows: (rich.data ?? []) as unknown as RawMatterRow[],
      sourceTier: "rich",
      capabilities: {
        richMatterRead: true,
        executionTruth: true,
        followUps: true,
        slaDeadline: true,
      },
    };
  }

  console.warn(
    "[operator-intelligence] rich canonical read unavailable; using governed fallback:",
    rich.error.message,
  );

  const fallback = await supabase
    .from("deals")
    .select(FALLBACK_COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (fallback.error) {
    throw new Error(`Canonical Matter read failed: ${fallback.error.message}`);
  }

  return {
    rows: (fallback.data ?? []) as unknown as RawMatterRow[],
    sourceTier: "fallback",
    capabilities: {
      richMatterRead: false,
      executionTruth: false,
      followUps: false,
      slaDeadline: true,
    },
  };
}

function createCounts(): Record<OperatorActionClass, number> {
  return OPERATOR_ACTION_CLASSES.reduce(
    (counts, actionClass) => {
      counts[actionClass] = 0;
      return counts;
    },
    {} as Record<OperatorActionClass, number>,
  );
}

function actionDate(action: OperatorMatterAction): number {
  const candidate = action.dueAt ?? action.updatedAt ?? action.createdAt;
  return validDate(candidate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
}

export async function loadOperatorIntelligence(
  options: { limit?: number; now?: Date } = {},
): Promise<OperatorIntelligenceSnapshot> {
  const limit = Math.min(Math.max(options.limit ?? 500, 1), 1000);
  const now = options.now ?? new Date();
  const result = await readCanonicalMatterRows(limit);

  const actions = result.rows.flatMap((row) =>
    deriveMatterActions(row, now, result.capabilities),
  );

  actions.sort((a, b) => {
    const priorityDifference =
      PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (priorityDifference !== 0) return priorityDifference;

    const dueDifference = actionDate(a) - actionDate(b);
    if (dueDifference !== 0) return dueDifference;

    return a.matterId.localeCompare(b.matterId);
  });

  const counts = createCounts();
  for (const action of actions) counts[action.actionClass] += 1;

  return {
    generatedAt: now.toISOString(),
    source: "canonical-deals",
    sourceTier: result.sourceTier,
    degraded: result.sourceTier === "fallback",
    warning:
      result.sourceTier === "fallback"
        ? "Rich canonical Matter columns are unavailable. Execution-truth, shipment and follow-up signals are suppressed; do not interpret zero counts for those classes as an all-clear condition."
        : null,
    mattersRead: result.rows.length,
    counts,
    capabilities: result.capabilities,
    actions,
  };
}

export function isCanonicalMatterState(value: string): boolean {
  return CANONICAL_STATE_SET.has(value);
}
