// Receiving-authority requirements (B10): pure evaluation.
//
// Each requirement of a receiving authority is a sourced statement in
// public.receiving_authority_requirements. This module decides, for one authority and one document
// category, whether every requirement is currently known. An unknown is never read as "required"
// or as "not required": it is reported as unknown and the final route is blocked.
//
// The legacy booleans on public.receiving_authorities (apostille_required, translation_required,
// ron_accepted, ...) default to false and carry no source, so they are not consulted here.

export const RECEIVING_REQUIREMENTS = [
  "ORIGINAL_DOCUMENT",
  "CERTIFIED_COPY",
  "NOTARIAL_ACT",
  "RON_ACCEPTANCE",
  "WITNESSES",
  "TRANSLATION",
  "RECENCY",
  "ELECTRONIC_FORMAT",
  "PHYSICAL_DELIVERY",
  "DESTINATION_FORMALITIES",
] as const;
export type ReceivingRequirement = (typeof RECEIVING_REQUIREMENTS)[number];

export const RECEIVING_REQUIREMENT_LABELS: Record<ReceivingRequirement, string> = {
  ORIGINAL_DOCUMENT: "Original document must be presented",
  CERTIFIED_COPY: "Certified copy accepted in place of the original",
  NOTARIAL_ACT: "Notarial act required",
  RON_ACCEPTANCE: "Remote online notarization accepted",
  WITNESSES: "Witnesses required",
  TRANSLATION: "Translation required",
  RECENCY: "Document must be recently issued",
  ELECTRONIC_FORMAT: "Electronic document accepted in place of paper",
  PHYSICAL_DELIVERY: "Physical delivery required",
  DESTINATION_FORMALITIES: "Further formalities in the destination country",
};

export const RECEIVING_STATUSES = ["REQUIRED", "NOT_REQUIRED", "CONDITIONAL", "UNKNOWN"] as const;
export type ReceivingStatus = (typeof RECEIVING_STATUSES)[number];
export const RECEIVING_SOURCE_TYPES = ["RECEIVING_AUTHORITY", "OFFICIAL_GUIDANCE"] as const;
export type ReceivingSourceType = (typeof RECEIVING_SOURCE_TYPES)[number];
export const ALL_DOCUMENT_CATEGORIES = "*";

export interface ReceivingRequirementRule {
  id: string;
  authority_id: string;
  document_category: string;
  requirement: string;
  status: string;
  detail: string | null;
  source_url: string | null;
  source_type: string | null;
  source_title: string | null;
  verified_at: string | null;
  verified_by: string | null;
  review_due_at: string | null;
  superseded_at: string | null;
  created_at: string;
}

export interface ReceivingAuthorityStanding {
  id: string;
  routing_status?: string | null;
  manual_review_required?: boolean | null;
}

export type RequirementState = "REQUIRED" | "NOT_REQUIRED" | "CONDITIONAL" | "UNKNOWN" | "CONFLICT";

export interface RequirementFinding {
  requirement: ReceivingRequirement;
  label: string;
  state: RequirementState;
  detail: string | null;
  reason: string | null;
  ruleIds: string[];
  sources: string[];
  reviewDueAt: string | null;
}

export interface ReceivingRequirementsEvaluation {
  authorityId: string;
  documentCategory: string;
  decision: "REQUIREMENTS_VERIFIED" | "REVIEW_REQUIRED";
  finalRouteAllowed: boolean;
  findings: RequirementFinding[];
  blockers: string[];
}

export function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || /\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.includes(".");
  } catch {
    return false;
  }
}

const instant = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
};

export const normalizeCategory = (value: unknown): string => {
  const text = typeof value === "string" ? value.trim().toLowerCase().replace(/\s+/g, "_") : "";
  return text || ALL_DOCUMENT_CATEGORIES;
};

// Why a recorded statement cannot be relied on today, or null when it can.
function unusable(rule: ReceivingRequirementRule, now: number): string | null {
  if (!(RECEIVING_STATUSES as readonly string[]).includes(rule.status)) return "recorded status is not recognised";
  if (rule.status === "UNKNOWN") return "recorded as unknown";
  if (!isHttpsUrl(rule.source_url)) return "no official source is recorded";
  if (!(RECEIVING_SOURCE_TYPES as readonly string[]).includes(String(rule.source_type))) return "source is not the receiving authority or official guidance";
  if (!rule.verified_by) return "no verifying operator is recorded";
  const verified = instant(rule.verified_at);
  const due = instant(rule.review_due_at);
  if (verified === null || due === null) return "verification or review date is missing";
  if (verified > now) return "verification date is in the future";
  if (due <= now) return "verification has passed its review date";
  if (rule.status === "CONDITIONAL" && !rule.detail?.trim()) return "the condition is not described";
  return null;
}

export function evaluateReceivingRequirements(input: {
  authority: ReceivingAuthorityStanding;
  rules: ReceivingRequirementRule[];
  documentCategory?: string | null;
  now?: Date;
}): ReceivingRequirementsEvaluation {
  const now = (input.now ?? new Date()).getTime();
  const category = normalizeCategory(input.documentCategory);
  const current = input.rules.filter((rule) => rule.authority_id === input.authority.id && !rule.superseded_at);
  const blockers: string[] = [];

  if (input.authority.routing_status !== "ACTIVE" || input.authority.manual_review_required !== false) {
    blockers.push("The receiving authority record itself is not verified for routing.");
  }

  const findings = RECEIVING_REQUIREMENTS.map((requirement): RequirementFinding => {
    const label = RECEIVING_REQUIREMENT_LABELS[requirement];
    const forRequirement = current.filter((rule) => rule.requirement === requirement);
    // A statement for this document category replaces the authority-wide one; it never merges with it.
    const specific = forRequirement.filter((rule) => normalizeCategory(rule.document_category) === category);
    const scoped = specific.length || category === ALL_DOCUMENT_CATEGORIES
      ? specific
      : forRequirement.filter((rule) => normalizeCategory(rule.document_category) === ALL_DOCUMENT_CATEGORIES);
    const base = { requirement, label, ruleIds: scoped.map((rule) => rule.id), sources: [] as string[], reviewDueAt: null as string | null };

    if (!scoped.length) return { ...base, state: "UNKNOWN", detail: null, reason: "no statement is recorded" };

    const problems = scoped.map((rule) => unusable(rule, now));
    const firstProblem = problems.find((problem) => problem !== null);
    // Every current statement must be reliable: one stale or unsourced statement is not outvoted.
    if (firstProblem) return { ...base, state: "UNKNOWN", detail: null, reason: firstProblem };

    const statuses = new Set(scoped.map((rule) => rule.status));
    const details = new Set(scoped.map((rule) => (rule.detail ?? "").trim().toLowerCase()));
    const sources = [...new Set(scoped.map((rule) => String(rule.source_url)))];
    if (statuses.size > 1 || details.size > 1) {
      return { ...base, sources, state: "CONFLICT", detail: null, reason: "current statements disagree" };
    }
    const earliestDue = scoped.map((rule) => rule.review_due_at as string).sort((a, b) => (instant(a) ?? 0) - (instant(b) ?? 0))[0];
    return { ...base, sources, reviewDueAt: earliestDue, state: scoped[0].status as RequirementState, detail: scoped[0].detail?.trim() || null, reason: null };
  });

  for (const finding of findings) {
    if (finding.state === "UNKNOWN" || finding.state === "CONFLICT") {
      blockers.push(`${finding.label}: ${finding.state === "CONFLICT" ? "conflicting statements" : "unknown"} (${finding.reason}).`);
    }
  }

  const allowed = blockers.length === 0;
  return {
    authorityId: input.authority.id,
    documentCategory: category,
    decision: allowed ? "REQUIREMENTS_VERIFIED" : "REVIEW_REQUIRED",
    finalRouteAllowed: allowed,
    findings,
    blockers,
  };
}
