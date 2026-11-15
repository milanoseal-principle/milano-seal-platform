// Operator Quote Builder prefill with provenance.
//
// The builder is a verification surface over facts Milano already holds. This
// module decides which existing value to show first and labels where it came
// from. It never decides a legal fact, never upgrades a client request or an
// inference into a confirmed value, and has no effect on pricing: the governed
// composer still re-derives everything server-side on preview and commit.
//
// Precedence (highest first):
//   1. Canonical execution truth recorded on the Matter (operator-authored).
//   2. Operator route facts recorded with the latest governed quote attempt
//      (matter_evidence_ledger, pricing domain); approved → CONFIRMED,
//      a review-held attempt → SUGGESTED.
//   3. Explicit Smart Intake client requests → FROM INTAKE hint only.
//   4. Otherwise MISSING (review required). Nothing is invented.

import {
  AUTHENTICATION_REQUIREMENTS,
  EXECUTION_METHODS,
  NOTARIAL_ACTS,
  NOTARIZATION_REQUIREMENTS,
} from "@/lib/matter/executionTruth";

export type PrefillStatus = "confirmed" | "from_intake" | "suggested" | "conflict" | "missing" | "edited";

/** A field the operator changed in this session is unsaved input, not a recorded fact. */
export const OPERATOR_EDIT_PROVENANCE: FieldProvenance = {
  status: "edited",
  detail: "Operator edit (not saved). Confirm it through execution review / quote approval.",
};

/**
 * Displayed provenance follows the current value: once the operator changes a
 * field away from its prefilled value, the original source label no longer applies.
 */
export function provenanceForCurrentValues<K extends string>(
  provenance: Record<K, FieldProvenance>,
  current: Readonly<Record<string, unknown>>,
  prefilled: Readonly<Record<string, unknown>>,
): Record<K, FieldProvenance> {
  const result = { ...provenance };
  for (const key of Object.keys(provenance) as K[]) {
    if (key in current && key in prefilled && current[key] !== prefilled[key]) result[key] = OPERATOR_EDIT_PROVENANCE;
  }
  return result;
}

export interface FieldProvenance {
  status: PrefillStatus;
  detail: string;
}

export const ISSUING_AUTHORITIES = ["state", "federal", "county", "court", "private"] as const;
export type KnownIssuingAuthority = (typeof ISSUING_AUTHORITIES)[number];

export const MATTER_BASES = [
  "authentication",
  "signature",
  "priority",
  "executive",
  "international_passport_execution",
] as const;
export type PrefillMatterBase = (typeof MATTER_BASES)[number];

// Builder execution-method options: canonical truth values the builder can
// state. "review_required" is shown as unresolved, never as "no new execution".
export const BUILDER_EXECUTION_METHODS = [
  "review_required",
  "ron",
  "in_person",
  "already_notarized",
  "third_party_notary",
] as const;
export type BuilderExecutionMethod = (typeof BUILDER_EXECUTION_METHODS)[number];

/** Operator route facts recorded with a governed quote attempt (sanitized, server-read). */
export interface RecordedRouteEvidence {
  approved: boolean;
  recordedAt: string | null;
  documentCategory: string | null;
  issuingAuthority: KnownIssuingAuthority | null;
  issuingAgency: string | null;
  receivingAuthority: string | null;
}

/** What the client asked for at intake (non-authoritative). */
export interface ClientExecutionRequest {
  executionPreference: string | null;
  notarizationPreference: string | null;
  authenticationPreference: string | null;
  requestedNotarialAct: string | null;
  mobileFlag?: boolean;
}

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const oneOf = <T extends string>(value: unknown, allowed: readonly T[]): T | null =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : null;
const real = (value: string | null) => (value && value !== "review_required" ? value : null);

/**
 * Sanitizes the latest pricing-domain ledger row into the four operator route
 * facts. A document category is kept only when the operator set it (heuristic
 * categories are recomputed live by the composer, mirroring loadMatterRoute).
 */
export function sanitizeRouteEvidence(
  row: { event_type?: unknown; occurred_at?: unknown; new_value?: unknown } | null | undefined,
  allowedCategories: readonly string[],
): RecordedRouteEvidence | null {
  const value = row?.new_value && typeof row.new_value === "object" ? (row.new_value as Record<string, unknown>) : null;
  const route = value?.route_intelligence && typeof value.route_intelligence === "object"
    ? (value.route_intelligence as Record<string, unknown>)
    : null;
  if (!route) return null;
  const category = route.document_category_source === "operator" ? oneOf(route.document_category, allowedCategories) : null;
  const agency = str(route.federal_agency);
  const receiving = str(route.receiving_authority);
  return {
    approved: row?.event_type === "canonical_quote_approved",
    recordedAt: typeof row?.occurred_at === "string" ? row.occurred_at : null,
    documentCategory: category,
    issuingAuthority: oneOf(route.issuing_authority, ISSUING_AUTHORITIES),
    issuingAgency: agency || null,
    receivingAuthority: receiving || null,
  };
}

const ACT_LABEL: Record<string, string> = {
  acknowledgment: "acknowledgment",
  jurat: "jurat",
  oath_affirmation: "oath / affirmation",
  signature_witnessing: "signature witnessing",
  other: "other act",
  required: "required",
  not_required: "not required",
  apostille: "apostille",
  authentication_legalization: "authentication / legalization",
  ron: "RON",
  in_person: "in person",
  mobile: "mobile in person",
  already_notarized: "already notarized",
  third_party_notary: "third-party notary",
};
const label = (value: string) => ACT_LABEL[value] ?? value.replaceAll("_", " ");

function truthField<T extends string>(
  truthValue: unknown,
  allowed: readonly T[],
  requested: string | null,
  name: string,
): { value: T | null; provenance: FieldProvenance } {
  const recorded = real(oneOf(truthValue, allowed));
  const asked = real(requested);
  if (recorded) {
    if (asked && asked !== recorded && !(name === "execution method" && recorded === "in_person" && asked === "mobile")) {
      return {
        value: recorded as T,
        provenance: { status: "conflict", detail: `Recorded ${label(recorded)}; client requested ${label(asked)}. Resolve before quoting.` },
      };
    }
    return { value: recorded as T, provenance: { status: "confirmed", detail: `Recorded in canonical execution truth (${label(recorded)}).` } };
  }
  if (asked) {
    return { value: null, provenance: { status: "from_intake", detail: `Client requested ${label(asked)}. Confirm before selecting.` } };
  }
  return { value: null, provenance: { status: "missing", detail: `No ${name} is recorded. Operator confirmation required.` } };
}

function routeField(
  value: string | null,
  evidence: RecordedRouteEvidence | null,
  name: string,
): FieldProvenance {
  if (value && evidence) {
    return evidence.approved
      ? { status: "confirmed", detail: `Recorded with the approved quote.` }
      : { status: "suggested", detail: `From the last operator quote attempt (held for review). Verify.` };
  }
  return { status: "missing", detail: `No ${name} is recorded. Do not guess.` };
}

export interface OperatorPrefillInput {
  executionTruth: Record<string, unknown> | null | undefined;
  routeEvidence: RecordedRouteEvidence | null;
  matterPricingType: string | null | undefined;
  quoteApproved: boolean;
  clientRequest: ClientExecutionRequest | null;
}

export interface OperatorPrefill {
  executionMethod: BuilderExecutionMethod;
  notarizationRequirement: (typeof NOTARIZATION_REQUIREMENTS)[number];
  notarialAct: (typeof NOTARIAL_ACTS)[number];
  authenticationRequirement: (typeof AUTHENTICATION_REQUIREMENTS)[number] | null;
  matterBase: PrefillMatterBase | "";
  documentCategory: string | null;
  issuingAuthority: KnownIssuingAuthority | null;
  issuingAgency: string | null;
  receivingAuthority: string | null;
  provenance: Record<
    | "execution_method"
    | "notarization_requirement"
    | "notarial_act"
    | "authentication_requirement"
    | "matter_base"
    | "document_category"
    | "issuing_authority"
    | "issuing_agency"
    | "receiving_authority",
    FieldProvenance
  >;
}

export function resolveOperatorPrefill(input: OperatorPrefillInput): OperatorPrefill {
  const truth = input.executionTruth ?? {};
  const request = input.clientRequest;
  const requestedMethod = request?.executionPreference ?? (request?.mobileFlag ? "mobile" : null);

  const method = truthField(truth.execution_method, EXECUTION_METHODS, requestedMethod, "execution method");
  const notarization = truthField(truth.notarization_requirement, NOTARIZATION_REQUIREMENTS, request?.notarizationPreference ?? null, "notarization requirement");
  const act = truthField(truth.notarial_act, NOTARIAL_ACTS, request?.requestedNotarialAct ?? null, "notarial act");
  const authentication = truthField(truth.authentication_requirement, AUTHENTICATION_REQUIREMENTS, request?.authenticationPreference ?? null, "authentication requirement");

  // Canonical truth "mobile" is in-person execution in the builder's pricing view.
  const methodValue = method.value === "mobile" ? "in_person" : method.value;
  const executionMethod: BuilderExecutionMethod = oneOf(methodValue, BUILDER_EXECUTION_METHODS) ?? "review_required";

  const pricingType = oneOf(input.matterPricingType, MATTER_BASES);
  const matterBaseProvenance: FieldProvenance = pricingType
    ? input.quoteApproved
      ? { status: "confirmed", detail: "Matter base of the approved quote." }
      : { status: "suggested", detail: "Matter base from the last operator quote attempt (held for review). Verify." }
    : { status: "suggested", detail: "Derived by the pricing engine from the confirmed execution facts." };

  const evidence = input.routeEvidence;
  return {
    executionMethod,
    notarizationRequirement: notarization.value ?? "review_required",
    notarialAct: act.value ?? "review_required",
    authenticationRequirement: authentication.value,
    matterBase: pricingType ?? "",
    documentCategory: evidence?.documentCategory ?? null,
    issuingAuthority: evidence?.issuingAuthority ?? null,
    issuingAgency: evidence?.issuingAgency ?? null,
    receivingAuthority: evidence?.receivingAuthority ?? null,
    provenance: {
      execution_method: method.provenance,
      notarization_requirement: notarization.provenance,
      notarial_act: act.provenance,
      authentication_requirement: authentication.provenance,
      matter_base: matterBaseProvenance,
      document_category: evidence?.documentCategory
        ? routeField(evidence.documentCategory, evidence, "document category")
        : { status: "suggested", detail: "Auto-classified by route intelligence from the document type. Verify." },
      issuing_authority: routeField(evidence?.issuingAuthority ?? null, evidence, "issuing authority"),
      issuing_agency: routeField(evidence?.issuingAgency ?? null, evidence, "federal issuing agency"),
      receiving_authority: routeField(evidence?.receivingAuthority ?? null, evidence, "receiving authority"),
    },
  };
}
