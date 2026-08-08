// Stage 4 — the canonical dynamic clarification engine.
//
// Given a SmartIntakeClassification, compute only the questions genuinely needed
// to safely ROUTE and PRICE the matter. Never re-asks a known fact. `origin` and
// `signer location` are CONDITIONAL — asked only when the route/execution needs
// them, not universally. Client-safe wording only (no internal terminology).
//
// Pure and deterministic.

import type { SmartIntakeClassification, ServiceState } from "./smartClassification";

export interface IntakeQuestion {
  id: string;
  prompt: string;
  kind: "contradiction" | "route" | "price" | "execution";
  options?: string[];
}

export interface IntakeClarifications {
  knownFacts: string[];
  contradictions: string[];
  routeDrivingUnknowns: string[];
  priceDrivingUnknowns: string[];
  executionCriticalUnknowns: string[];
  optionalUnknowns: string[];
  questions: IntakeQuestion[];
}

const resolved = (s: ServiceState) => s !== "unknown" && s !== "contradictory";

const ORIGIN_DRIVEN_FAMILIES = new Set([
  "birth_certificate",
  "marriage_certificate",
  "death_certificate",
  "divorce_record",
  "school_transcript",
  "court_document",
  "real_estate_document",
  "fbi_background_check",
  "certified_copy",
]);

// Only contradictions the current structured intake state can resolve without
// inventing a second service-state model are rendered to the client. Other
// contradictions remain operator/manual-review facts and never trap Step 2.
const CLIENT_RESOLVABLE_CONTRADICTIONS = new Set([
  "notarization",
  "apostille",
  "translation",
]);

export function buildIntakeClarifications(c: SmartIntakeClassification): IntakeClarifications {
  const knownFacts: string[] = [];
  const routeDrivingUnknowns: string[] = [];
  const priceDrivingUnknowns: string[] = [];
  const executionCriticalUnknowns: string[] = [];
  const optionalUnknowns: string[] = [];
  const questions: IntakeQuestion[] = [];

  if (c.documentFamily) knownFacts.push(`document:${c.documentFamily}`);
  if (c.destinationCountry) knownFacts.push(`destination:${c.destinationCountry}`);
  if (c.signerCount) knownFacts.push(`signers:${c.signerCount}`);
  if (c.documentCount) knownFacts.push(`documents:${c.documentCount}`);
  for (const [name, st] of [
    ["notarization", c.notarization], ["apostille", c.apostille], ["translation", c.translation],
    ["mobile", c.mobile], ["ron", c.ron],
  ] as Array<[string, ServiceState]>) {
    if (resolved(st)) knownFacts.push(`${name}:${st}`);
  }

  const resolvableContradictions = c.contradictions.filter((concept) => CLIENT_RESOLVABLE_CONTRADICTIONS.has(concept));
  for (const concept of resolvableContradictions) {
    questions.push({
      id: `resolve_${concept}`,
      kind: "contradiction",
      prompt:
        concept === "notarization"
          ? "Is the document already fully notarized, or do you need a new notarization?"
          : `Can you confirm whether you need ${concept} for this matter?`,
      options: concept === "notarization" ? ["Already notarized", "Need a new notarization"] : ["Yes", "No"],
    });
  }

  if (!c.destinationCountry) {
    routeDrivingUnknowns.push("destinationCountry");
    questions.push({ id: "destination", kind: "route", prompt: "Where will this document be used?" });
  }

  const originMatters =
    (c.documentFamily && ORIGIN_DRIVEN_FAMILIES.has(c.documentFamily)) || c.apostille === "required";
  if (originMatters && !c.originJurisdiction) {
    routeDrivingUnknowns.push("originJurisdiction");
    questions.push({ id: "document_origin", kind: "route", prompt: "Where was this document issued?" });
  }

  if (c.apostille === "unknown" && c.destinationCountry && c.destinationCountry !== "United States") {
    priceDrivingUnknowns.push("apostille");
    questions.push({ id: "apostille_needed", kind: "price", prompt: "Do you need us to arrange an apostille?", options: ["Yes", "No", "Not sure"] });
  }

  const executionNeedsSigner = c.mobile === "required" || c.ron === "required" || c.notarization === "required";
  if (executionNeedsSigner && !c.signerLocation) {
    executionCriticalUnknowns.push("signerLocation");
    questions.push({ id: "signer_location", kind: "execution", prompt: "Where will the signer be physically located?" });
  }

  if (c.urgency === "unknown") optionalUnknowns.push("deadline");

  const finalQuestions = resolvableContradictions.length === 0 ? questions.slice(0, 3) : questions;

  return {
    knownFacts,
    contradictions: c.contradictions.map(String),
    routeDrivingUnknowns,
    priceDrivingUnknowns,
    executionCriticalUnknowns,
    optionalUnknowns,
    questions: finalQuestions,
  };
}
