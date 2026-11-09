/**
 * Operator view of two distinct truths:
 *   CLIENT REQUESTED SERVICE — immutable acquisition context captured at intake
 *   CONFIRMED EXECUTION ROUTE — governed execution truth set by Milano review
 * The requested service is never used to fill in the confirmed route, and route
 * review never rewrites what the client originally asked for.
 */
import { SMART_INTAKE_INTENTS, serviceLane, type SmartIntakeIntent } from "@/lib/intake/serviceIntent";

const TAG = /\[client_requested_service\]\s+([a-z_]+)/;
const METADATA = /\[intake_metadata:(\{[\s\S]*?\})\]\s*$/m;

/** Reads the requested service from persisted intake notes. Unknown → null (not "unsure"). */
export function requestedServiceFromNotes(notes: string | null | undefined): SmartIntakeIntent | null {
  if (!notes) return null;
  const tagged = TAG.exec(notes)?.[1];
  let fromMetadata: string | undefined;
  const meta = METADATA.exec(notes)?.[1];
  if (meta) {
    try { fromMetadata = (JSON.parse(meta) as { client_requested_service?: unknown }).client_requested_service as string | undefined; } catch { /* ignore malformed */ }
  }
  const value = fromMetadata ?? tagged;
  return typeof value === "string" && (SMART_INTAKE_INTENTS as readonly string[]).includes(value) ? (value as SmartIntakeIntent) : null;
}

const METHOD_LABEL: Record<string, string> = {
  ron: "Remote online notarization (RON)",
  in_person: "In-person execution",
  mobile: "Mobile in-person execution",
  already_notarized: "Already notarized — no new execution",
  third_party_notary: "Third-party notary",
};
const ACT_LABEL: Record<string, string> = {
  acknowledgment: "acknowledgment",
  jurat: "jurat",
  oath_affirmation: "oath / affirmation",
  signature_witnessing: "signature witnessing",
  other: "other confirmed act",
};
const AUTH_LABEL: Record<string, string> = {
  apostille: "apostille",
  authentication_legalization: "authentication / legalization",
  not_required: "no authentication",
};

export interface ConfirmedRoute {
  confirmed: boolean;
  label: string;
  parts: string[];
}

/** Derived only from canonical execution truth (+ governed witness count). */
export function confirmedExecutionRoute(executionTruth: Record<string, unknown> | null | undefined, witnesses?: number | null): ConfirmedRoute {
  const truth = executionTruth ?? {};
  const method = typeof truth.execution_method === "string" ? truth.execution_method : "review_required";
  if (!(method in METHOD_LABEL)) return { confirmed: false, label: "Awaiting Milano route review", parts: [] };
  const parts = [METHOD_LABEL[method]];
  const act = typeof truth.notarial_act === "string" ? ACT_LABEL[truth.notarial_act] : undefined;
  if (act) parts.push(act);
  if (Number(witnesses) > 0) parts.push(`witness coordination (${Number(witnesses)})`);
  const auth = typeof truth.authentication_requirement === "string" ? AUTH_LABEL[truth.authentication_requirement] : undefined;
  if (auth) parts.push(auth);
  return { confirmed: true, label: parts.join(" + "), parts };
}

export function requestedServiceLabel(intent: SmartIntakeIntent | null): string {
  return intent ? serviceLane(intent).title : "Not captured (pre-dates service lanes or direct entry)";
}
