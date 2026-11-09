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
  resolveOperationalMatterState,
  withMatterQuery,
  type OperationalMatterSourceRow,
} from "@/lib/matter/canonicalOperationalRead";
import { evaluateSchedulingGate } from "@/lib/scheduling/complimentarySchedulingGate";
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

export type OperatorActionClass = (typeof OPERATOR_ACTION_CLASSES)[number];
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
  payment_disposition?: string | null;
  payment_settlement_status?: string | null;
  payment_observed_at?: string | null;
  payment_observed_amount?: number | null;
  payment_observed_currency?: string | null;
  payment_observed_reference?: string | null;
  currency?: string | null;
  wise_reference?: string | null;
  comp_authorized?: boolean | null;
  comp_authorization_id?: string | null;
  comp_authorized_at?: string | null;
  comp_revoked_at?: string | null;
}

interface MatterReadResult {
  rows: RawMatterRow[];
  sourceTier: "rich" | "fallback";
  capabilities: OperatorIntelligenceCapabilities;
}

const PAYMENT_COLUMNS = [
  "payment_status",
  "payment_confirmed",
  "payment_settlement_status",
  "payment_observed_at",
  "payment_observed_amount",
  "payment_observed_currency",
  "payment_observed_reference",
  "currency",
  "wise_reference",
  "payment_disposition",
  "amount_due",
  "amount_paid",
  "verified_revenue",
  "comp_authorized",
  "comp_authorization_id",
  "comp_authorized_at",
  "comp_revoked_at",
];

const RICH_COLUMNS = [
  "id",
  "deal_id",
  "client_name",
  "full_name",
  "status",
  "deal_status",
  ...PAYMENT_COLUMNS,
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
  ...PAYMENT_COLUMNS,
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
const PAYMENT_GATE_STATES = new Set(["quoted", "awaiting_deposit", "deposit_pending_review", "deposit_confirmed", "scheduling_unlocked", "final_balance_due", "final_payment_pending_review"]);
const DOCUMENT_BLOCK_STATES = new Set(["needs_client_info", "document_correction_required"]);
const SCHEDULING_DUE_STATES = new Set(["deposit_confirmed", "scheduling_unlocked"]);
const APOSTILLE_PENDING_STATES = new Set(["apostille_packet_ready", "apostille_submitted", "apostille_processing", "apostille_rejected"]);
const RELEASE_READY_STATES = new Set(["final_payment_confirmed", "ready_for_release"]);
const CARRIER_EXCEPTION_STATUSES = new Set(["failed", "exception", "returned", "return_to_sender"]);
const CARRIER_ACTIVE_STATUSES = new Set(["in_transit", "out_for_delivery"]);

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

const PRIORITY_WEIGHT: Record<OperatorPriority, number> = { critical: 0, high: 1, normal: 2 };

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

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function schedulingGate(row: RawMatterRow) {
  return evaluateSchedulingGate({
    matter: {
      id: operationalMatterId(row),
      deal_id: operationalMatterDisplayId(row),
      payment_status: operationalPaymentStatus(row),
      payment_confirmed: row.payment_confirmed ?? null,
      payment_settlement_status: row.payment_settlement_status ?? null,
      payment_observed_at: row.payment_observed_at ?? null,
      payment_observed_amount: numberOrNull(row.payment_observed_amount),
      payment_observed_currency: row.payment_observed_currency ?? null,
      payment_observed_reference: row.payment_observed_reference ?? null,
      currency: row.currency ?? null,
      wise_reference: row.wise_reference ?? null,
      amount_due: numberOrNull(row.amount_due),
      amount_paid: numberOrNull(row.amount_paid),
      verified_revenue: numberOrNull(row.verified_revenue),
      payment_disposition: row.payment_disposition ?? null,
      comp_authorized: row.comp_authorized ?? null,
      comp_authorization_id: row.comp_authorization_id ?? null,
      comp_authorized_at: row.comp_authorized_at ?? null,
      comp_revoked_at: row.comp_revoked_at ?? null,
    },
  });
}

function hasExecutionTruth(row: RawMatterRow): boolean {
  return typeof row.execution_truth === "object" && row.execution_truth !== null && !Array.isArray(row.execution_truth);
}

function executionReviewReason(row: RawMatterRow): string | null {
  if (!hasExecutionTruth(row)) return null;
  const truth = normalizeExecutionTruth({ execution_truth: row.execution_truth });
  const validation = validateExecutionTruth(truth);
  if (!validation.reviewRequired && validation.valid) return null;
  if (validation.errors.length) return validation.errors.join(", ");
  return "Canonical execution truth requires operator review.";
}

function overdueFollowUpReason(row: RawMatterRow, now: Date, capabilities: OperatorIntelligenceCapabilities): { reason: string; priority: OperatorPriority } | null {
  if (!capabilities.followUps) return null;
  if (row.follow_up_active === false) return null;
  const paymentStatus = operationalPaymentStatus(row);
  if (!["unpaid", "pending"].includes(paymentStatus)) return null;
  const state = resolveOperationalMatterState(row).state;
  if (isOperationalTerminalState(state)) return null;
  const hours = ageHours(row.created_at, now);
  if (hours === null) return null;
  if (hours >= 168 && row.followup_7d !== true) return { reason: "7-day canonical payment follow-up is overdue.", priority: "critical" };
  if (hours >= 72 && row.followup_72h !== true) return { reason: "72-hour canonical payment follow-up is overdue.", priority: "high" };
  if (hours >= 24 && row.followup_24h !== true) return { reason: "24-hour canonical payment follow-up is overdue.", priority: "high" };
  return null;
}

function buildAction(row: RawMatterRow, actionClass: OperatorActionClass, priority: OperatorPriority, reason: string): OperatorMatterAction {
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
    actionHref: withMatterQuery(ACTION_DESTINATIONS[actionClass], row, { focus: actionClass, country: actionClass === "Authority Review" ? destinationCountry : null }),
    matterHref: operationalMatterHref(row),
  };
}

function deriveMatterActions(row: RawMatterRow, now: Date, capabilities: OperatorIntelligenceCapabilities): OperatorMatterAction[] {
  const stateResolution = resolveOperationalMatterState(row);
  const state = stateResolution.state;
  const deliveryStatus = row.delivery_status?.trim().toLowerCase() ?? "";
  const actions = new Map<OperatorActionClass, OperatorMatterAction>();
  const add = (actionClass: OperatorActionClass, priority: OperatorPriority, reason: string) => {
    if (!actions.has(actionClass)) actions.set(actionClass, buildAction(row, actionClass, priority, reason));
  };

  if (isOperationalTerminalState(state)) {
    if (state === "completed" && (CARRIER_ACTIVE_STATUSES.has(deliveryStatus) || CARRIER_EXCEPTION_STATUSES.has(deliveryStatus))) {
      add("Courier Exception", "critical", `Matter is completed while carrier delivery state is ${deliveryStatus.replaceAll("_", " ")}; reconcile custody truth.`);
    }
    return [...actions.values()];
  }

  const gate = schedulingGate(row);

  if (state && PAYMENT_GATE_STATES.has(state) && !gate.paymentRequirementSatisfied) {
    const progressedPastPaymentReview = state === "deposit_confirmed" || state === "scheduling_unlocked";
    add("Payment Blocked", progressedPastPaymentReview ? "critical" : "high", progressedPastPaymentReview ? `Matter state indicates payment progression, but the canonical scheduling payment gate is not satisfied: ${gate.reason}` : gate.reason);
  }

  if (state && DOCUMENT_BLOCK_STATES.has(state)) {
    add("Document Blocked", state === "document_correction_required" ? "critical" : "high", state === "document_correction_required" ? "Canonical Matter state requires document correction before progression." : "Canonical Matter state requires additional client information.");
  }

  if (capabilities.executionTruth) {
    const executionReason = executionReviewReason(row);
    if (executionReason) add("Authority Review", "high", executionReason);
  }

  if (state === "under_review" && !operationalDestinationCountry(row)) {
    add("Authority Review", "high", "Destination authority cannot be resolved because destination country is missing.");
  }

  if (state && SCHEDULING_DUE_STATES.has(state) && gate.schedulingEligible) {
    add("Scheduling Due", isPast(operationalDueAt(row), now) ? "critical" : "high", state === "scheduling_unlocked" ? "Canonical scheduling gate is unlocked and the Matter is awaiting scheduling." : `Canonical scheduling payment gate is satisfied by ${gate.paymentRequirementMethod.replaceAll("_", " ")}; scheduling-unlock action is due.`);
  }

  if (state && APOSTILLE_PENDING_STATES.has(state)) {
    add("Apostille Pending", state === "apostille_rejected" ? "critical" : isPast(operationalDueAt(row), now) ? "high" : "normal", state === "apostille_rejected" ? "Apostille was rejected and requires governed correction or re-submission." : `Canonical Matter state is ${state.replaceAll("_", " ")}.`);
  }

  if (CARRIER_EXCEPTION_STATUSES.has(deliveryStatus)) {
    add("Courier Exception", "critical", `Carrier delivery state is ${deliveryStatus.replaceAll("_", " ")}; operator courier review is required.`);
  } else if (state === "customs_watch") {
    add("Courier Exception", "critical", "Canonical Matter state is customs watch; operator courier review is required.");
  } else if (state === "in_transit" && capabilities.slaDeadline && isPast(operationalDueAt(row), now)) {
    add("Courier Exception", "high", "Matter remains in transit beyond its canonical SLA deadline.");
  }

  if (state && RELEASE_READY_STATES.has(state)) {
    add("Release Ready", isPast(operationalDueAt(row), now) ? "critical" : "high", state === "ready_for_release" ? "Canonical Matter state is ready for governed release QA." : "Final payment is confirmed and the Matter is eligible for the canonical ready-for-release transition.");
  }

  const followUp = overdueFollowUpReason(row, now, capabilities);
  if (followUp) add("Overdue Follow-Up", followUp.priority, followUp.reason);
  return [...actions.values()];
}

async function readCanonicalMatterRows(limit: number): Promise<MatterReadResult> {
  const supabase = createAdminClient();
  const rich = await supabase.from("deals").select(RICH_COLUMNS).order("updated_at", { ascending: false }).limit(limit);
  if (!rich.error) {
    return { rows: (rich.data ?? []) as unknown as RawMatterRow[], sourceTier: "rich", capabilities: { richMatterRead: true, executionTruth: true, followUps: true, slaDeadline: true } };
  }

  console.warn("[operator-intelligence] rich canonical read unavailable; using governed fallback:", rich.error.message);
  const fallback = await supabase.from("deals").select(FALLBACK_COLUMNS).order("updated_at", { ascending: false }).limit(limit);
  if (fallback.error) throw new Error(`Canonical Matter read failed: ${fallback.error.message}`);
  return { rows: (fallback.data ?? []) as unknown as RawMatterRow[], sourceTier: "fallback", capabilities: { richMatterRead: false, executionTruth: false, followUps: false, slaDeadline: true } };
}

function createCounts(): Record<OperatorActionClass, number> {
  return OPERATOR_ACTION_CLASSES.reduce((counts, actionClass) => { counts[actionClass] = 0; return counts; }, {} as Record<OperatorActionClass, number>);
}

function actionDate(action: OperatorMatterAction): number {
  const candidate = action.dueAt ?? action.updatedAt ?? action.createdAt;
  return validDate(candidate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
}

export async function loadOperatorIntelligence(options: { limit?: number; now?: Date } = {}): Promise<OperatorIntelligenceSnapshot> {
  const limit = Math.min(Math.max(options.limit ?? 500, 1), 1000);
  const now = options.now ?? new Date();
  const result = await readCanonicalMatterRows(limit);
  const actions = result.rows.flatMap((row) => deriveMatterActions(row, now, result.capabilities));

  actions.sort((a, b) => {
    const priorityDifference = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
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
    warning: result.sourceTier === "fallback" ? "Rich canonical Matter columns are unavailable. Execution-truth, shipment and follow-up signals are suppressed; do not interpret zero counts for those classes as an all-clear condition." : null,
    mattersRead: result.rows.length,
    counts,
    capabilities: result.capabilities,
    actions,
  };
}

export function isCanonicalMatterState(value: string): boolean {
  return CANONICAL_STATE_SET.has(value);
}

export interface OperationalHealthObservation {
  id: string;
  label: string;
  category: string;
  state: 'Operational' | 'Unknown' | 'Degraded';
  note: string;
  observedAt: string | null;
}

/** Counts describe canonical operational evidence, never external-provider uptime. */
export async function loadOperationalHealth(role: string, suppliedAdmin?: ReturnType<typeof createAdminClient>): Promise<OperationalHealthObservation[]> {
  const definitions = [
    { id: 'database', label: 'Canonical database read', category: 'Database' },
    { id: 'wise', label: 'Wise reconciliation exceptions', category: 'Payment' },
    { id: 'notifications', label: 'Notification delivery failures', category: 'Communication' },
    { id: 'ron', label: 'RON evidence review', category: 'Execution' },
    { id: 'courier', label: 'Courier exceptions', category: 'Courier' },
    { id: 'security', label: 'Open compliance incidents', category: 'Security' },
    { id: 'retention', label: 'Retention destruction review', category: 'Preservation' },
    { id: 'governance', label: 'Agent outcome review', category: 'Governance' },
  ];
  const unknown = (definition: typeof definitions[number]): OperationalHealthObservation => ({ ...definition, state: 'Unknown', note: 'NOT VERIFIED: canonical observation unavailable. No zero or healthy state is inferred.', observedAt: null });
  let admin: ReturnType<typeof createAdminClient>;
  try { admin = suppliedAdmin ?? createAdminClient({ timeoutMs: 10_000 }); }
  catch { return definitions.map(unknown); }
  const responses = await Promise.allSettled([
    admin.from('deals').select('id').limit(1),
    admin.from('wise_reconciliation_exceptions').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    admin.from('notifications').select('id', { count: 'exact', head: true }).in('delivery_status', ['failed', 'bounced', 'suppressed']),
    admin.from('ron_sessions').select('id', { count: 'exact', head: true }).eq('milano_ron_status', 'RON_REVIEW_REQUIRED'),
    admin.from('matter_shipment_legs').select('id', { count: 'exact', head: true }).eq('custody_status', 'exception'),
    admin.from('compliance_incidents').select('id', { count: 'exact', head: true }).not('status', 'in', '(CLOSED,RESOLVED,MATTER_RESTORED_OR_CLOSED)'),
    admin.from('retention_records').select('id', { count: 'exact', head: true }).in('deletion_claim_outcome', ['pending', 'unknown']),
    ['founder', 'founder_admin', 'admin_operator', 'ops_manager'].includes(role)
      ? admin.from('governance_tasks').select('id', { count: 'exact', head: true }).in('status', ['UNKNOWN', 'DEAD_LETTER'])
      : Promise.resolve({ error: { code: 'ROLE_SCOPED' }, count: null }),
  ]);
  return definitions.map((definition, index) => {
    const response = responses[index];
    if (response.status !== 'fulfilled' || response.value.error) return unknown(definition);
    const observedAt = new Date().toISOString();
    if (index === 0) return { ...definition, state: 'Operational', observedAt, note: 'Canonical database read succeeded. This observation does not certify provider availability, write access, backups or recovery.' };
    const count = response.value.count;
    if (count == null || !Number.isSafeInteger(count) || count < 0) return unknown(definition);
    return { ...definition, state: count > 0 ? 'Degraded' : 'Unknown', observedAt, note: `${count} recorded items require review. External provider health and delivery remain NOT VERIFIED by this count.` };
  });
}
