/**
 * Matter Criticality Engine
 *
 * Computes operator/VA attention priority from real matter fields.
 * No fake urgency. Output is only as accurate as the input fields.
 */

export type CriticalityLevel = "LOW" | "NORMAL" | "HIGH" | "CRITICAL" | "EXECUTIVE";

export interface CriticalityInput {
  // Timing signals
  travel_date?: string | null;
  court_date?: string | null;
  closing_date?: string | null;
  embassy_appointment?: string | null;
  // Matter state
  matter_status?: string | null;
  payment_status?: string | null;
  protected_identifier_status?: string | null;
  apostille_status?: string | null;
  courier_status?: string | null;
  release_status?: string | null;
  italy_qa_status?: string | null;
  // Destination signals
  destination_country?: string | null;
  receiving_authority_friction?: number | null;
  // Relationship
  client_tier?: string | null;
  relationship_state?: string | null;
}

export interface CriticalityResult {
  level: CriticalityLevel;
  score: number;             // 0–100, higher = more critical
  reasons: string[];         // Human-readable flags driving the level
  escalation: boolean;       // Requires immediate operator attention
  nextActionSuggestion: string;
}

// Days until a date from now
function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return Math.round(diff);
}

// Status-order index for quick comparison
const STATUS_ORDER = [
  "new", "intake_received", "under_review", "compliance_review",
  "quoted", "awaiting_payment", "payment_confirmed", "scheduled",
  "in_execution", "apostille_processing", "courier_ready",
  "shipped", "delivered", "completed", "closed",
];
function statusIndex(s: string | null | undefined): number {
  return STATUS_ORDER.indexOf(s ?? "");
}

export function computeCriticality(input: CriticalityInput): CriticalityResult {
  let score = 0;
  const reasons: string[] = [];

  // ── Timing pressure ───────────────────────────────────────────────────────
  const deadlines = [
    { label: "Travel date", date: input.travel_date },
    { label: "Court date", date: input.court_date },
    { label: "Closing date", date: input.closing_date },
    { label: "Embassy appointment", date: input.embassy_appointment },
  ];

  for (const { label, date } of deadlines) {
    const days = daysUntil(date);
    if (days === null) continue;
    if (days <= 0) {
      score += 40;
      reasons.push(`${label} has passed — immediate review required`);
    } else if (days <= 3) {
      score += 35;
      reasons.push(`${label} in ${days} day${days === 1 ? "" : "s"} — critical`);
    } else if (days <= 7) {
      score += 25;
      reasons.push(`${label} in ${days} days — urgent`);
    } else if (days <= 14) {
      score += 10;
      reasons.push(`${label} in ${days} days`);
    }
  }

  // ── Payment gate stalls ───────────────────────────────────────────────────
  const unpaid = ["awaiting_payment", "quoted"].includes(input.matter_status ?? "");
  if (unpaid && input.payment_status !== "paid" && input.payment_status !== "payment_confirmed") {
    score += 15;
    reasons.push("Payment not confirmed — scheduling blocked");
  }

  // ── QA gate failures ──────────────────────────────────────────────────────
  if (input.italy_qa_status === "FAILED" || input.italy_qa_status === "REQUIRED") {
    score += 30;
    reasons.push("Italy QA not passed — apostille blocked");
  }

  // ── Protected identifier issues ───────────────────────────────────────────
  if (
    input.protected_identifier_status === "PROTECTED_IDENTIFIER_MISMATCH" ||
    input.protected_identifier_status === "RELEASE_HOLD" ||
    input.protected_identifier_status === "POST_RELEASE_CORRECTION_REQUIRED"
  ) {
    score += 35;
    reasons.push("Protected identifier issue — execution hold");
  }

  // ── Release / correction holds ────────────────────────────────────────────
  if (input.release_status === "RELEASE_HOLD") {
    score += 30;
    reasons.push("Release hold active");
  }
  if (input.release_status === "POST_RELEASE_CORRECTION") {
    score += 25;
    reasons.push("Post-release correction required");
  }

  // ── Courier exception ─────────────────────────────────────────────────────
  if (input.courier_status === "exception" || input.courier_status === "returned") {
    score += 20;
    reasons.push("Courier exception or return — follow-up required");
  }

  // ── High-friction authority ───────────────────────────────────────────────
  const friction = input.receiving_authority_friction ?? 0;
  if (friction >= 9) {
    score += 20;
    reasons.push("Executive-attention authority (friction ≥9)");
  } else if (friction >= 7) {
    score += 10;
    reasons.push("High-friction authority");
  }

  // ── Italy-specific ────────────────────────────────────────────────────────
  const isItaly = (input.destination_country ?? "").toLowerCase().includes("italy") ||
                  (input.destination_country ?? "").toLowerCase() === "it";
  if (isItaly) {
    score += 5;
    reasons.push("Italy destination — 13-point QA required");
  }

  // ── Client tier ───────────────────────────────────────────────────────────
  const tier = (input.client_tier ?? "").toLowerCase();
  if (tier === "executive" || tier === "attorney") {
    score += 5;
    reasons.push("High-value client tier");
  }

  // ── LOST_BUT_WARM ─────────────────────────────────────────────────────────
  if (input.relationship_state === "LOST_BUT_WARM") {
    score += 5;
    reasons.push("High-value relationship — warm follow-up due");
  }

  // ── Clamp score ───────────────────────────────────────────────────────────
  score = Math.min(100, score);

  // ── Map to level ──────────────────────────────────────────────────────────
  let level: CriticalityLevel;
  if (score >= 80) level = "EXECUTIVE";
  else if (score >= 55) level = "CRITICAL";
  else if (score >= 35) level = "HIGH";
  else if (score >= 15) level = "NORMAL";
  else level = "LOW";

  const escalation = score >= 55;

  // ── Next action suggestion ────────────────────────────────────────────────
  let nextActionSuggestion = "No immediate action required.";
  if (reasons.length > 0) {
    const topReason = reasons[0];
    if (topReason.includes("Italy QA")) nextActionSuggestion = "Complete Italy 13-point QA before apostille submission.";
    else if (topReason.includes("identifier")) nextActionSuggestion = "Resolve protected identifier mismatch before proceeding.";
    else if (topReason.includes("Release hold")) nextActionSuggestion = "Clear release hold — review operator task queue.";
    else if (topReason.includes("Courier")) nextActionSuggestion = "Contact carrier and update client on courier exception.";
    else if (topReason.includes("Payment")) nextActionSuggestion = "Confirm payment receipt and reconcile before scheduling.";
    else if (topReason.includes("passed")) nextActionSuggestion = "Deadline passed — escalate immediately.";
    else if (topReason.includes("day")) nextActionSuggestion = "Urgent timeline — prioritize this matter now.";
    else if (topReason.includes("warm")) nextActionSuggestion = "Send relationship preservation follow-up to attorney.";
    else nextActionSuggestion = "Review matter for pending action.";
  }

  return { level, score, reasons, escalation, nextActionSuggestion };
}
