// Autonomous Matter Resolution (v1) — post-intake missing-fact collection.
//
// Given what Milano has already recorded for a Matter (intake facts, canonical
// execution truth, operator route evidence) and the client's latest portal
// declarations, decide which client-answerable facts are still missing, and
// re-run the existing execution-truth validator over a provisional overlay.
//
// Governance:
// - Client answers are UNVERIFIED declarations. They are stored in the evidence
//   ledger and shown to the operator as labelled hints; they never write
//   execution truth, pricing, payment or scheduling state.
// - Legal determinations (notarial act, authentication requirement, execution
//   eligibility) stay with the operator's execution review. The client is asked
//   for the facts behind them (receiving-party instructions), not to choose them.
// - A fact already recorded, or already declared, is never asked again.
// - Questions stop once a quote is approved or payment activity begins.
//
// Pure and deterministic; no I/O.

import { normalizeExecutionTruth, validateExecutionTruth } from "@/lib/matter/executionTruth";

export const RESOLUTION_FACTS = [
  "execution_preference",
  "signer_location",
  "execution_location",
  "document_origin",
  "document_issuer",
  "authentication_needed",
  "receiving_instructions",
] as const;
export type ResolutionFact = (typeof RESOLUTION_FACTS)[number];

export interface ResolutionQuestion {
  fact: ResolutionFact;
  prompt: string;
  help?: string;
  kind: "choice" | "text";
  options?: Array<{ value: string; label: string }>;
}

export type ClientDeclarations = Partial<Record<ResolutionFact, { value: string; declaredAt: string | null }>>;

export interface MatterResolutionInput {
  originState: string | null | undefined;
  executionTruth: Record<string, unknown> | null | undefined;
  // Client's intake request (customer_execution_preference / intake metadata); non-authoritative.
  intakeExecutionPreference: string | null | undefined;
  intakeMobile?: boolean | null;
  // True when an operator has recorded the issuing authority with a governed quote attempt.
  issuingAuthorityRecorded: boolean;
  quoteApproved: boolean;
  paymentActivity: boolean;
  declarations: ClientDeclarations;
}

export type ResolutionStatus = "closed" | "needs_client_input" | "awaiting_milano_review" | "review_confirmed";

export interface MatterResolution {
  status: ResolutionStatus;
  questions: ResolutionQuestion[];
  answered: ResolutionFact[];
  // Existing validator over truth + client declarations (provisional, never saved).
  provisionalBlockers: string[];
}

const CHOICES: Partial<Record<ResolutionFact, Array<{ value: string; label: string }>>> = {
  execution_preference: [
    { value: "in_person", label: "In person with a notary" },
    { value: "ron", label: "Online (remote video notarization)" },
    { value: "already_notarized", label: "My document is already signed and notarized" },
    { value: "not_sure", label: "Not sure" },
  ],
  document_issuer: [
    { value: "self_prepared", label: "I (or my company or attorney) prepared it, and it will be signed" },
    { value: "state_government", label: "A U.S. state or local government office issued it" },
    { value: "federal_agency", label: "A U.S. federal agency issued it" },
    { value: "court", label: "A court issued it" },
    { value: "not_sure", label: "Not sure" },
  ],
  authentication_needed: [
    { value: "apostille", label: "Yes, an apostille" },
    { value: "legalization", label: "Yes, embassy or consular legalization" },
    { value: "none", label: "No, notarization only" },
    { value: "not_sure", label: "Not sure" },
  ],
};

const PROMPTS: Record<ResolutionFact, { prompt: string; help?: string }> = {
  execution_preference: { prompt: "How would you like the document to be signed?" },
  signer_location: {
    prompt: "Where will the signer be at the time of signing?",
    help: "City and state (or country). This determines which notaries may act.",
  },
  execution_location: {
    prompt: "Where should the in-person signing take place?",
    help: "Address or city. Milano confirms the appointment details with you before scheduling.",
  },
  document_origin: { prompt: "Which U.S. state or country issued or prepared this document?" },
  document_issuer: { prompt: "Who issued or prepared this document?" },
  authentication_needed: {
    prompt: "Has the person or office receiving the document asked for an apostille or other authentication?",
  },
  receiving_instructions: {
    prompt: "What does the receiving party require for this document?",
    help: "Paste any instructions you received (for example \"sworn before a notary\", \"acknowledged\", or \"notarized original\"). Write \"none\" if you have no instructions.",
  },
};

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const resolved = (value: unknown) => {
  const v = text(value);
  return Boolean(v) && v !== "review_required";
};

function question(fact: ResolutionFact): ResolutionQuestion {
  const choices = CHOICES[fact];
  return { fact, ...PROMPTS[fact], kind: choices ? "choice" : "text", ...(choices ? { options: choices } : {}) };
}

/** The client's effective execution request: latest declaration, else the intake request. */
function requestedMethod(input: MatterResolutionInput): string | null {
  const declared = input.declarations.execution_preference?.value;
  if (declared && declared !== "not_sure") return declared;
  const intake = text(input.intakeExecutionPreference);
  if (intake && intake !== "review_required") return intake;
  return input.intakeMobile ? "mobile" : null;
}

export function resolveMatter(input: MatterResolutionInput): MatterResolution {
  const truth = input.executionTruth ?? {};
  const declared = input.declarations;
  const answered = RESOLUTION_FACTS.filter((fact) => declared[fact] !== undefined);
  const has = (fact: ResolutionFact) => declared[fact] !== undefined;

  if (input.quoteApproved || input.paymentActivity) {
    return { status: "closed", questions: [], answered, provisionalBlockers: [] };
  }

  const recordedMethod = resolved(truth.execution_method) ? text(truth.execution_method) : null;
  const method = recordedMethod ?? requestedMethod(input);
  const facts: ResolutionFact[] = [];

  if (!recordedMethod && !method && !has("execution_preference")) facts.push("execution_preference");
  if (!resolved(truth.signer_location) && !has("signer_location")) facts.push("signer_location");
  if ((method === "in_person" || method === "mobile") && !resolved(truth.execution_location) && !has("execution_location")) {
    facts.push("execution_location");
  }
  if (!text(input.originState) && !has("document_origin")) facts.push("document_origin");
  if (!input.issuingAuthorityRecorded && !has("document_issuer")) facts.push("document_issuer");
  if (!resolved(truth.authentication_requirement) && !has("authentication_needed")) facts.push("authentication_needed");
  if (
    !resolved(truth.notarial_act) &&
    text(truth.notarization_requirement) !== "not_required" &&
    method !== "already_notarized" &&
    !has("receiving_instructions")
  ) {
    facts.push("receiving_instructions");
  }

  // Revalidate with the existing validator over a provisional overlay. Only the
  // location facts are overlaid; legal determinations stay as recorded.
  const provisional = normalizeExecutionTruth({
    ...truth,
    execution_method: recordedMethod ?? (method === "mobile" ? "mobile" : method ?? "review_required"),
    signer_location: resolved(truth.signer_location) ? truth.signer_location : declared.signer_location?.value,
    execution_location: resolved(truth.execution_location) ? truth.execution_location : declared.execution_location?.value,
  });
  const validation = validateExecutionTruth(provisional);
  const provisionalBlockers = [...validation.errors];
  if (validation.reviewRequired && provisionalBlockers.length === 0) provisionalBlockers.push("EXECUTION_REVIEW_REQUIRED");

  const status: ResolutionStatus = facts.length > 0
    ? "needs_client_input"
    : truth.review_confirmed_at
      ? "review_confirmed"
      : "awaiting_milano_review";
  return { status, questions: facts.map(question), answered, provisionalBlockers };
}

const TEXT_LIMIT = 300;
// Drop control characters and collapse whitespace; the result is rendered as text, never HTML.
const clean = (value: string) =>
  value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();

/**
 * Validates a client submission against the questions currently outstanding.
 * Only those facts are accepted; choice answers must be one of the offered values.
 */
export function validateDeclarationSubmission(
  questions: ResolutionQuestion[],
  submitted: unknown,
): { ok: true; declarations: Partial<Record<ResolutionFact, string>> } | { ok: false; error: string } {
  if (!submitted || typeof submitted !== "object" || Array.isArray(submitted)) return { ok: false, error: "INVALID_ANSWERS" };
  const outstanding = new Map(questions.map((q) => [q.fact, q]));
  const declarations: Partial<Record<ResolutionFact, string>> = {};
  for (const [key, raw] of Object.entries(submitted as Record<string, unknown>)) {
    const q = outstanding.get(key as ResolutionFact);
    if (!q) return { ok: false, error: "QUESTION_NOT_OUTSTANDING" };
    if (typeof raw !== "string") return { ok: false, error: "INVALID_ANSWER" };
    const value = clean(raw);
    if (q.kind === "choice") {
      if (!q.options?.some((option) => option.value === value)) return { ok: false, error: "INVALID_ANSWER" };
    } else if (value.length < 2 || value.length > TEXT_LIMIT) {
      return { ok: false, error: "INVALID_ANSWER" };
    }
    declarations[q.fact] = value;
  }
  if (Object.keys(declarations).length === 0) return { ok: false, error: "NO_ANSWERS" };
  return { ok: true, declarations };
}

/** Latest declaration per fact from evidence-ledger rows (any order). */
export function declarationsFromLedger(
  rows: Array<{ occurred_at?: unknown; new_value?: unknown }> | null | undefined,
): ClientDeclarations {
  const result: ClientDeclarations = {};
  const sorted = [...(rows ?? [])].sort((a, b) => String(a.occurred_at ?? "").localeCompare(String(b.occurred_at ?? "")));
  for (const row of sorted) {
    const value = row.new_value && typeof row.new_value === "object" ? (row.new_value as Record<string, unknown>).declarations : null;
    if (!value || typeof value !== "object") continue;
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      if ((RESOLUTION_FACTS as readonly string[]).includes(key) && typeof raw === "string" && raw.trim()) {
        result[key as ResolutionFact] = { value: raw.trim().slice(0, TEXT_LIMIT), declaredAt: typeof row.occurred_at === "string" ? row.occurred_at : null };
      }
    }
  }
  return result;
}

export const CLIENT_DECLARATION_EVENT = "client_clarification_declared";
export const CLIENT_DECLARATION_SOURCE = "client_portal_clarification";

/** Human label for a declared value (operator view). */
export function declarationLabel(fact: ResolutionFact, value: string): string {
  return CHOICES[fact]?.find((option) => option.value === value)?.label ?? value;
}
