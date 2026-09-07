// Pipeline Stagnation Alerts — operator-only stage-age monitor.
//
// Net-new intelligence lens (Avvocato backlog category B: "Add stage stagnation
// monitor"). It is a PURE READ PROJECTION over canonical Matter state and the
// existing stage timestamps on the deals row. It creates no Matter state machine,
// mutates nothing, touches no payment/Wise/Shippo authority, and duplicates no
// reconciliation surface.
//
// FAIL CLOSED: stagnation age is only computed when a reliable basis timestamp
// can be proven for the stage. If no basis timestamp is parseable — or it is in
// the future — the matter is reported as INSUFFICIENT_EVIDENCE with no fabricated
// age and no amber alarm. No SLA is asserted; thresholds are internal operating
// heuristics, not guarantees.

import {
  type CanonicalStatus,
  normalizeStatus,
  isTerminalCanonical,
  OPERATOR_LABELS,
  NEXT_ACTION,
} from "@/lib/matter/status";

export type StagnationSeverity =
  | "OK"
  | "WATCH"
  | "ALERT"
  | "CRITICAL"
  | "INSUFFICIENT_EVIDENCE";

// Which timestamp proves how long the matter has been in this stage.
//  - "stage_entry": a dedicated column records when the stage began (true age).
//  - "last_activity": no stage-entry column exists, so the last-touch timestamp
//    (updated_at) measures inactivity. The backlog frames Review / Awaiting
//    Payment exactly this way ("no operator touch / no activity after 24h").
export type StagnationBasis = "stage_entry" | "last_activity";

export interface StagePolicy {
  basis: StagnationBasis;
  timestampFields: string[]; // first parseable field wins
  watchHours: number; // approaching threshold
  alertHours: number; // Alarm Amber — overdue
  criticalHours: number; // escalation
  rationale: string;
}

// Only stages with a defensible timestamp basis are monitored. Every threshold
// is an internal operating heuristic, aligned to the backlog where it gives one.
export const STAGNATION_POLICY: Partial<Record<CanonicalStatus, StagePolicy>> = {
  under_review: {
    basis: "last_activity",
    timestampFields: ["updated_at", "created_at"],
    watchHours: 18,
    alertHours: 24,
    criticalHours: 48,
    rationale: "Review with no operator touch (backlog: 24h)",
  },
  awaiting_payment: {
    basis: "last_activity",
    timestampFields: ["updated_at", "created_at"],
    watchHours: 18,
    alertHours: 24,
    criticalHours: 48,
    rationale: "Awaiting Payment with no activity (backlog: 24h)",
  },
  scheduled: {
    basis: "stage_entry",
    timestampFields: ["scheduled_at", "updated_at"],
    watchHours: 48,
    alertHours: 72,
    criticalHours: 120,
    rationale: "Scheduled but execution not started",
  },
  in_execution: {
    basis: "last_activity",
    timestampFields: ["updated_at"],
    watchHours: 24,
    alertHours: 48,
    criticalHours: 96,
    rationale: "In Execution with no progress update",
  },
  apostille_processing: {
    basis: "stage_entry",
    timestampFields: ["apostille_at", "updated_at"],
    watchHours: 48,
    alertHours: 72,
    criticalHours: 120,
    rationale: "Apostille with no update (backlog: 48–72h)",
  },
  shipped: {
    basis: "stage_entry",
    timestampFields: ["shipped_at", "updated_at"],
    watchHours: 24,
    alertHours: 48,
    criticalHours: 96,
    rationale: "Courier / in transit with no update (backlog: 24–48h)",
  },
};

export interface StagnationSourceRow {
  id?: string | null;
  deal_id?: string | null;
  client_name?: string | null;
  destination_country?: string | null;
  document_type?: string | null;
  status?: string | null;
  deal_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  scheduled_at?: string | null;
  apostille_at?: string | null;
  shipped_at?: string | null;
  [key: string]: unknown;
}

export interface StagnationEvaluation {
  matterId: string;
  displayId: string;
  clientName: string | null;
  destinationCountry: string | null;
  documentType: string | null;
  canonicalStatus: CanonicalStatus;
  stageLabel: string;
  monitored: boolean;
  severity: StagnationSeverity;
  basis: StagnationBasis | null;
  basisField: string | null;
  stageSince: string | null; // ISO timestamp the age is measured from
  ageHours: number | null; // null when age cannot be proven
  alertHours: number | null; // the overdue threshold for this stage
  overdueByHours: number | null; // ageHours - alertHours when positive
  nextAction: string;
  reason: string;
  href: string;
}

const SEVERITY_RANK: Record<StagnationSeverity, number> = {
  CRITICAL: 0,
  ALERT: 1,
  WATCH: 2,
  INSUFFICIENT_EVIDENCE: 3,
  OK: 4,
};

function parseTimestampMs(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function resolveBasisTimestamp(
  row: StagnationSourceRow,
  fields: string[],
): { field: string; iso: string; ms: number } | null {
  for (const field of fields) {
    const raw = row[field];
    const ms = parseTimestampMs(raw);
    if (ms !== null) return { field, iso: String(raw).trim(), ms };
  }
  return null;
}

/**
 * Evaluate a single matter for stage stagnation.
 * `nowMs` is injected so evaluation is fully deterministic and testable.
 */
export function evaluateMatterStagnation(
  row: StagnationSourceRow,
  nowMs: number,
): StagnationEvaluation {
  const matterId = firstString(row.id, row.deal_id) ?? "";
  const displayId = firstString(row.deal_id, row.id) ?? matterId;
  const canonicalStatus = normalizeStatus(
    firstString(row.status, row.deal_status) ?? null,
  );
  const stageLabel = OPERATOR_LABELS[canonicalStatus];
  const href = matterId
    ? `/dashboard/matters/${encodeURIComponent(matterId)}`
    : "/dashboard/matters";

  const base = {
    matterId,
    displayId,
    clientName: firstString(row.client_name),
    destinationCountry: firstString(row.destination_country),
    documentType: firstString(row.document_type),
    canonicalStatus,
    stageLabel,
    nextAction: NEXT_ACTION[canonicalStatus],
    href,
  };

  // Terminal / dormant matters are never stagnant.
  if (isTerminalCanonical(canonicalStatus) || canonicalStatus === "dormant") {
    return {
      ...base,
      monitored: false,
      severity: "OK",
      basis: null,
      basisField: null,
      stageSince: null,
      ageHours: null,
      alertHours: null,
      overdueByHours: null,
      reason: "Terminal or dormant stage — not monitored for stagnation.",
    };
  }

  const policy = STAGNATION_POLICY[canonicalStatus];
  if (!policy) {
    return {
      ...base,
      monitored: false,
      severity: "OK",
      basis: null,
      basisField: null,
      stageSince: null,
      ageHours: null,
      alertHours: null,
      overdueByHours: null,
      reason: "Stage is not on the monitored stagnation list.",
    };
  }

  const resolved = resolveBasisTimestamp(row, policy.timestampFields);
  // FAIL CLOSED: no basis timestamp → do not fabricate an age.
  if (!resolved) {
    return {
      ...base,
      monitored: true,
      severity: "INSUFFICIENT_EVIDENCE",
      basis: policy.basis,
      basisField: null,
      stageSince: null,
      ageHours: null,
      alertHours: policy.alertHours,
      overdueByHours: null,
      reason:
        "No reliable stage-entry or last-activity timestamp — stagnation age cannot be proven.",
    };
  }

  const ageMs = nowMs - resolved.ms;
  // FAIL CLOSED: a future timestamp is not provable elapsed time.
  if (ageMs < 0) {
    return {
      ...base,
      monitored: true,
      severity: "INSUFFICIENT_EVIDENCE",
      basis: policy.basis,
      basisField: resolved.field,
      stageSince: resolved.iso,
      ageHours: null,
      alertHours: policy.alertHours,
      overdueByHours: null,
      reason: "Basis timestamp is in the future — age cannot be trusted.",
    };
  }

  const ageHours = ageMs / 3_600_000;
  let severity: StagnationSeverity;
  if (ageHours >= policy.criticalHours) severity = "CRITICAL";
  else if (ageHours >= policy.alertHours) severity = "ALERT";
  else if (ageHours >= policy.watchHours) severity = "WATCH";
  else severity = "OK";

  const overdueByHours =
    ageHours > policy.alertHours
      ? Math.round((ageHours - policy.alertHours) * 10) / 10
      : null;

  const basisPhrase =
    policy.basis === "stage_entry" ? "in stage" : "without activity";

  return {
    ...base,
    monitored: true,
    severity,
    basis: policy.basis,
    basisField: resolved.field,
    stageSince: resolved.iso,
    ageHours: Math.round(ageHours * 10) / 10,
    alertHours: policy.alertHours,
    overdueByHours,
    reason:
      severity === "OK"
        ? `${Math.round(ageHours)}h ${basisPhrase} — within threshold.`
        : `${Math.round(ageHours)}h ${basisPhrase} (threshold ${policy.alertHours}h) — ${policy.rationale}.`,
  };
}

export interface PipelineStagnationSummary {
  generatedAt: string;
  evaluatedCount: number;
  counts: Record<StagnationSeverity, number>;
  alerts: StagnationEvaluation[]; // WATCH / ALERT / CRITICAL, most severe first
  insufficientEvidence: StagnationEvaluation[]; // monitored but unprovable
}

/**
 * Evaluate every matter and return the operator stagnation summary.
 * Alerts are sorted most-severe first, then by greatest age.
 */
export function evaluatePipelineStagnation(
  rows: StagnationSourceRow[],
  nowMs: number,
): PipelineStagnationSummary {
  const counts: Record<StagnationSeverity, number> = {
    OK: 0,
    WATCH: 0,
    ALERT: 0,
    CRITICAL: 0,
    INSUFFICIENT_EVIDENCE: 0,
  };

  const alerts: StagnationEvaluation[] = [];
  const insufficientEvidence: StagnationEvaluation[] = [];

  for (const row of rows) {
    const evaluation = evaluateMatterStagnation(row, nowMs);
    counts[evaluation.severity] += 1;
    if (
      evaluation.severity === "WATCH" ||
      evaluation.severity === "ALERT" ||
      evaluation.severity === "CRITICAL"
    ) {
      alerts.push(evaluation);
    } else if (evaluation.severity === "INSUFFICIENT_EVIDENCE") {
      insufficientEvidence.push(evaluation);
    }
  }

  alerts.sort((a, b) => {
    const rank = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (rank !== 0) return rank;
    return (b.ageHours ?? 0) - (a.ageHours ?? 0);
  });

  return {
    generatedAt: new Date(nowMs).toISOString(),
    evaluatedCount: rows.length,
    counts,
    alerts,
    insufficientEvidence,
  };
}
