// Stage 3 (cross-surface) — the ONE pricing entry every surface calls.
//
// intake / dashboard / founder / portal / payment-preparation must all price a
// Matter through THIS function, so the same canonical Matter yields the same
// commercial result everywhere. Only the client/operator/founder VISIBILITY
// projection differs by role — the underlying result does not.
//
// Deterministic and pure: it maps a CanonicalMatterObject to the Stage 2/3
// classification + pricing truth. No second engine, no per-surface math.

import type { CanonicalMatterObject } from "../platform/canonicalMatter";
import type { SmartIntakeClassification, ServiceState } from "../intake/smartClassification";
import { priceSmartIntake, type MilanoPricingResult, type CommercialContext } from "./milanoPricingTruth";

// A canonical status string → service state (already-completed never re-priced).
function statusToState(status?: string | null): ServiceState {
  const s = (status ?? "").toLowerCase();
  if (!s) return "unknown";
  if (/(complete|done|issued|received|already)/.test(s)) return "already_completed";
  if (/(required|requested|pending|needed)/.test(s)) return "required";
  if (/(not_required|not required|none|na|n\/a|declined)/.test(s)) return "not_required";
  return "unknown";
}

function laneFromTier(tier?: string): "signature" | "priority" | "executive" | undefined {
  const t = (tier ?? "").toLowerCase();
  if (t.includes("executive")) return "executive";
  if (t.includes("priority")) return "priority";
  if (t.includes("signature")) return "signature";
  return undefined;
}

function commercialContextOf(m: Partial<CanonicalMatterObject>): CommercialContext {
  if (m.governmentContractId) return "government";
  return "consumer";
}

/** Build the canonical classification view of a Matter (structured truth). */
export function matterToClassification(m: Partial<CanonicalMatterObject>): SmartIntakeClassification {
  const destination = m.destinationCountry ?? m.country;
  const apostille = statusToState(m.apostilleStatus);
  const translation = statusToState(m.translationStatus);
  const mobile: ServiceState = m.mobile === true ? "required" : m.mobile === false ? "not_required" : "unknown";
  const urgency: SmartIntakeClassification["urgency"] =
    m.urgency === "same_day" || m.urgency === "urgent" || m.urgency === "normal" ? m.urgency : "unknown";

  return {
    documentType: undefined,
    documentFamily: m.documentFamily,
    documentCount: 1,
    originJurisdiction: undefined,
    destinationCountry: destination,
    signerLocation: m.signerLocation,
    signerCount: 1,
    notarization: "unknown",
    ron: m.ron === true ? "required" : "unknown",
    apostille,
    apostilleQuantity: 1,
    authentication: "unknown",
    translation,
    witness: "unknown",
    mobile,
    courier: "unknown",
    shipping: "unknown",
    urgency,
    deadline: null,
    explicitNegatives: [],
    contradictions: [],
    missingCriticalFacts: [],
    manualReviewReasons: [],
    classificationConfidence: "medium",
    routingConfidence: destination ? "medium" : "low",
  };
}

/** THE canonical pricing entry. Same Matter → same MilanoPricingResult. */
export function priceCanonicalMatter(m: Partial<CanonicalMatterObject>): MilanoPricingResult {
  return priceSmartIntake({
    classification: matterToClassification(m),
    selectedLane: laneFromTier(m.executionTier),
    commercialContext: commercialContextOf(m),
  });
}
