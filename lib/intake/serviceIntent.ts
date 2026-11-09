/**
 * Progressive Smart Intake — public service-intent vocabulary and the one
 * central question plan.
 *
 * Service intent is CONTEXT ONLY. It decides which questions a visitor sees
 * first; it never establishes RON eligibility, execution method, witness
 * requirement, apostille eligibility, authentication route, translation,
 * receiving-authority requirement, tier, price, payment or scheduling.
 * Governed Matter review decides all of those.
 *
 * This module is pure and imports nothing from pricing, payment or Matter
 * state so it is safe for the public browser bundle.
 */

export const SMART_INTAKE_INTENTS = [
  "ron",
  "notary",
  "witness",
  "apostille",
  "international",
  "counsel",
  "unsure",
] as const;

export type SmartIntakeIntent = (typeof SMART_INTAKE_INTENTS)[number];

const ALIASES: Readonly<Record<string, SmartIntakeIntent>> = {
  ron: "ron",
  online: "ron",
  online_notary: "ron",
  online_notarization: "ron",
  remote_online_notary: "ron",
  remote_online_notarization: "ron",
  notary: "notary",
  domestic: "notary",
  domestic_notary: "notary",
  domestic_execution: "notary",
  in_person: "notary",
  mobile: "notary",
  mobile_notary: "notary",
  witness: "witness",
  witness_support: "witness",
  witnesses: "witness",
  apostille: "apostille",
  authentication: "apostille",
  legalization: "international",
  international: "international",
  international_execution: "international",
  counsel: "counsel",
  foreign_counsel: "counsel",
  professional: "counsel",
  professional_counsel: "counsel",
  lawyer: "counsel",
  unsure: "unsure",
  not_sure: "unsure",
};

/** Normalizes any query/route value. Unknown or missing → "unsure" (broad intake). */
export function normalizeSmartIntakeIntent(value?: string | null): SmartIntakeIntent {
  if (typeof value !== "string") return "unsure";
  const key = value.trim().toLowerCase().replace(/[-\s]+/g, "_").slice(0, 64);
  return Object.prototype.hasOwnProperty.call(ALIASES, key) ? ALIASES[key] : "unsure";
}

/** Maps onto the existing canonical concierge/pricing-request vocabulary. */
export function toConciergeServiceIntent(intent: SmartIntakeIntent):
  "ron" | "domestic_execution" | "apostille" | "international_execution" | "foreign_counsel" | "unsure" {
  switch (intent) {
    case "ron": return "ron";
    case "notary":
    case "witness": return "domestic_execution";
    case "apostille": return "apostille";
    case "international": return "international_execution";
    case "counsel": return "foreign_counsel";
    default: return "unsure";
  }
}

export interface ServiceLane {
  intent: SmartIntakeIntent;
  title: string;
  customerPhrase: string;
  cta: string;
  href: string;
}

/** Homepage / service-page entry lanes. All converge on the one canonical intake. */
export const SERVICE_LANES: readonly ServiceLane[] = [
  { intent: "ron", title: "Online Notary / RON", customerPhrase: "I need something notarized online.", cta: "Start Online Notary", href: "/intake?intent=ron" },
  { intent: "notary", title: "Domestic / In-Person Notary", customerPhrase: "I need a notary.", cta: "Request a Notary", href: "/intake?intent=notary" },
  { intent: "witness", title: "Witness Support", customerPhrase: "My document says I need a witness.", cta: "Request Witness Support", href: "/intake?intent=witness" },
  { intent: "apostille", title: "Apostille", customerPhrase: "I need a document apostilled.", cta: "Start Apostille Review", href: "/intake?intent=apostille" },
  { intent: "international", title: "International Document Execution", customerPhrase: "My document will be used in another country.", cta: "Begin Matter Review", href: "/intake?intent=international" },
  { intent: "counsel", title: "Professional / Counsel", customerPhrase: "I represent a client who needs U.S. execution.", cta: "Send a Matter", href: "/counsel" },
  { intent: "unsure", title: "Not Sure", customerPhrase: "I have a document but I'm not sure what I need.", cta: "Tell Us What You Need", href: "/intake?intent=unsure" },
] as const;

export function serviceLane(intent: SmartIntakeIntent): ServiceLane {
  return SERVICE_LANES.find((lane) => lane.intent === intent) ?? SERVICE_LANES[SERVICE_LANES.length - 1];
}

// ── Central question plan ─────────────────────────────────────────────────

export type SmartIntakeQuestion =
  | "description"
  | "upload"
  | "contact"
  | "signerCount"
  | "signerLocation"
  | "inPersonLocation"
  | "timeline"
  | "witnessContext"
  | "internationalUse"
  | "destinationCountry"
  | "originState"
  | "alreadyExecuted"
  | "apostilleRequest"
  | "translationRequest"
  | "delivery"
  | "documentDetails";

export type TriState = "yes" | "no" | "unsure" | "";

export interface SmartIntakeAnswers {
  /** Visitor said the document will be used outside the U.S. */
  internationalUse?: TriState;
  /** Visitor said the document is already signed/notarized (no new execution requested). */
  alreadyExecuted?: TriState;
  /** Visitor said the document mentions witnesses. */
  witnessMentioned?: TriState;
  /** A non-U.S. destination is already known (prefill or selection). */
  destinationCountry?: string;
  /** Visitor asked for an apostille / authentication. */
  apostilleChoice?: TriState;
}

export interface SmartIntakeQuestionPlan {
  intent: SmartIntakeIntent;
  visible: SmartIntakeQuestion[];
  required: SmartIntakeQuestion[];
  /** True when international/route questions are shown. */
  international: boolean;
  /** True when signer/execution questions are shown. */
  execution: boolean;
  /** Plain-language framing for the first screen. */
  heading: string;
  descriptionPrompt: string;
  /** Always present: intent is context, never authority. */
  authorityNotice: string;
}

const AUTHORITY_NOTICE =
  "Your selection only tailors these questions. Milano review confirms the execution method, witness, apostille and route requirements, and your private quote. Scheduling unlocks only after verified payment settlement.";

function isForeignDestination(value?: string): boolean {
  const v = (value ?? "").trim().toLowerCase();
  return Boolean(v) && !["united states", "usa", "us", "u.s.", "united states of america", "america"].includes(v);
}

/**
 * The single source of truth for which questions a visitor sees. Pure and
 * deterministic. It never concludes legal or execution facts.
 */
export function getSmartIntakeQuestionPlan(context: { intent?: string | null; answers?: SmartIntakeAnswers }): SmartIntakeQuestionPlan {
  const intent = normalizeSmartIntakeIntent(context.intent ?? undefined);
  const a = context.answers ?? {};

  const internationalSignal =
    a.internationalUse === "yes" || isForeignDestination(a.destinationCountry) || a.apostilleChoice === "yes";
  const internationalLane = intent === "apostille" || intent === "international" || intent === "counsel";
  const international = internationalLane || internationalSignal;

  // Execution questions are hidden only when the visitor says the document is
  // already executed AND no new execution was requested via a domestic lane.
  const executionLane = intent === "ron" || intent === "notary" || intent === "witness";
  const execution = executionLane || a.alreadyExecuted !== "yes";

  const visible: SmartIntakeQuestion[] = ["description", "upload"];
  if (intent === "apostille") visible.push("alreadyExecuted");
  if (execution) visible.push("signerCount", "signerLocation");
  if (intent === "notary" || intent === "witness") visible.push("inPersonLocation");
  visible.push("timeline");
  if (executionLane || intent === "unsure" || a.witnessMentioned === "yes") visible.push("witnessContext");
  // Stays visible once answered so the visitor can always change it back.
  if (!internationalLane) visible.push("internationalUse");
  if (international) visible.push("destinationCountry", "originState", "apostilleRequest", "translationRequest", "delivery");
  visible.push("documentDetails", "contact");

  const required: SmartIntakeQuestion[] = ["description", "contact", "timeline"];
  if (international) required.push("delivery");

  const lane = serviceLane(intent);
  const headings: Record<SmartIntakeIntent, [string, string]> = {
    ron: ["Online notarization", "What document needs to be notarized online, and who is signing?"],
    notary: ["Request a notary", "What document needs to be notarized, and where are the signers?"],
    witness: ["Witness support", "What document are you signing, and what does it say about witnesses?"],
    apostille: ["Apostille review", "What document needs an apostille, and which country will receive it?"],
    international: ["International document execution", "What document will be used abroad, and where will it be used?"],
    counsel: ["U.S. execution for your client", "Describe your client's document, destination and instructions."],
    unsure: ["Tell us what you need", "What do you need done with your document? Plain English is perfect."],
  };
  return {
    intent,
    visible,
    required,
    international,
    execution,
    heading: headings[intent][0] || lane.title,
    descriptionPrompt: headings[intent][1],
    authorityNotice: AUTHORITY_NOTICE,
  };
}

/** Progress over the active plan only: completed visible steps / total visible steps. */
export function smartIntakeProgress(plan: SmartIntakeQuestionPlan, completed: ReadonlySet<SmartIntakeQuestion>): number {
  const total = plan.visible.length;
  if (total === 0) return 0;
  const done = plan.visible.filter((question) => completed.has(question)).length;
  return Math.round((done / total) * 100);
}
