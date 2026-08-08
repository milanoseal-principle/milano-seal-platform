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

// Document families whose ORIGIN jurisdiction drives the apostille/authentication
// route (state/civil/federal records). Execution documents (POA/affidavit) are
// signer-driven, not origin-driven.
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

export function buildIntakeClarifications(c: SmartIntakeClassification): IntakeClarifications {
  const knownFacts: string[] = [];
  const routeDrivingUnknowns: string[] = [];
  const priceDrivingUnknowns: string[] = [];
  const executionCriticalUnknowns: string[] = [];
  const optionalUnknowns: string[] = [];
  const questions: IntakeQuestion[] = [];

  // Known facts (so they are never re-asked).
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

  // 1. Contradictions — highest priority.
  for (const concept of c.contradictions) {
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

  // 2. Route-driving: destination unknown (needed to route apostille/authentication).
  if (!c.destinationCountry) {
    routeDrivingUnknowns.push("destinationCountry");
    questions.push({ id: "destination", kind: "route", prompt: "Where will this document be used?" });
  }

  // Conditional ORIGIN — only for origin-driven document families (or apostille
  // requested) and only when origin is not already known. NEVER universal.
  const originMatters =
    (c.documentFamily && ORIGIN_DRIVEN_FAMILIES.has(c.documentFamily)) || c.apostille === "required";
  if (originMatters && !c.originJurisdiction) {
    routeDrivingUnknowns.push("originJurisdiction");
    questions.push({ id: "document_origin", kind: "route", prompt: "Where was this document issued?" });
  }

  // 3. Price-driving: apostille undetermined for an international destination.
  if (c.apostille === "unknown" && c.destinationCountry && c.destinationCountry !== "United States") {
    priceDrivingUnknowns.push("apostille");
    questions.push({ id: "apostille_needed", kind: "price", prompt: "Do you need us to arrange an apostille?", options: ["Yes", "No", "Not sure"] });
  }

  // 4. Execution-critical: signer location only when execution needs it (mobile /
  // RON / new notarization) and it is not known. Apostille-only/civil records
  // never trigger this.
  const executionNeedsSigner = c.mobile === "required" || c.ron === "required" || c.notarization === "required";
  if (executionNeedsSigner && !c.signerLocation) {
    executionCriticalUnknowns.push("signerLocation");
    questions.push({ id: "signer_location", kind: "execution", prompt: "Where will the signer be physically located?" });
  }

  // Timing is optional — only surfaced when nothing else is unknown (kept out of
  // the required 0–3 for straightforward matters unless useful).
  if (c.urgency === "unknown") optionalUnknowns.push("deadline");

  // Standard (non-contradictory) matters must never present more than 3 questions.
  // Questions are pushed in priority order (contradiction > route > price >
  // execution), so slicing keeps the highest-priority set. Contradictory matters
  // may exceed 3 only because unresolved contradictions must all be surfaced.
  const finalQuestions = c.contradictions.length === 0 ? questions.slice(0, 3) : questions;

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
