export const CANONICAL_TECH_STACK = {
  frontend: "Next.js",
  hosting: "Vercel",
  database: "Supabase Postgres",
  payments: "Wise-first payment flow",
  optionalMirrors: ["Airtable", "Google Sheets"],
  rejectedPrimaryTracks: ["Webflow MVP", "Airtable as source of truth", "Stripe-first payment"],
  deployment: "Vercel",
  database: "Supabase Postgres",
  paymentRail: "Wise-first payment flow",
  rejectedPrimaryTracks: ["Webflow", "Airtable", "Make", "Stripe"],
  optionalMirrors: ["Airtable", "Google Sheets"],
  sourceOfTruth: "Supabase Postgres + deals",
} as const;

export const CANONICAL_PRICING = {
  signature: { lane: "Signature", publicLabel: "Signature Execution", internalBase: 750, cleanCompliantDraftInternalAdjustment: 650, publicDisplay: "Quote issued after review", publicPriceVisible: false },
  priority: { lane: "Priority", publicLabel: "Priority Execution", internalBase: 975, publicDisplay: "Quote issued after review", publicPriceVisible: false },
  executive: { lane: "Executive", publicLabel: "Executive Execution", internalBase: 1850, minimum: 1850, publicDisplay: "Quote issued after review", publicPriceVisible: false },
} as const;

export const CANONICAL_INTERNAL_ADJUSTMENTS = {
  signatureCostPerSignature: 25,
  additionalSignerCost: 75,
  firstApostille: 275,
  additionalApostille: 195,
  urgencyRange: [75, 300],
  weekendHolidayRange: [150, 300],
  rushRange: [100, 250],
  coordinationFeeRange: [50, 75],
  publicVisibility: "internal_only",
} as const;

export const CANONICAL_STATE_MACHINE = ["intake_received", "under_review", "quoted", "awaiting_payment", "scheduled", "in_execution", "apostille_processing", "completed"] as const;

export const CANONICAL_EXECUTION_MODEL = {
  launchModel: "founder_led",
  founderOperator: "Nicholas Milano",
  allianceNetwork: "staged_after_compliance",
  rule: "No alliance routing until vetting, Tool Belt completion, compliance readiness, and operator approval are satisfied.",
} as const;

export const CANONICAL_SEO_PHASES = {
  phase1: { label: "Launch Authority", pageCount: 5, pages: ["/pricing", "/secure-portal", "/intake", "/apostille/italy", "/apostille/brazil"] },
  phase2: { label: "Authority Expansion", pageCount: 60 },
  phase3: { label: "Programmatic Authority Engine", pageCountTarget: 2400, status: "staged_only" },
  signature: { label: "Signature Lane", internalBase: 750, publicPriceVisible: false },
  priority: { label: "Priority Lane", internalBase: 975, publicPriceVisible: false },
  executive: { label: "Executive Lane", internalBase: 1850, publicPriceVisible: false },
} as const;

export const CANONICAL_INTERNAL_ADJUSTMENTS = {
  cleanCompliantDraft: { internalAdjustment: 650, publicPriceVisible: false, scope: "internal-only" },
} as const;

export const CANONICAL_STATE_MACHINE = [
  "intake_received",
  "under_review",
  "quoted",
  "awaiting_payment",
  "scheduled",
  "in_execution",
  "apostille_processing",
  "completed",
] as const;

export const CANONICAL_EXECUTION_MODEL = {
  launchModel: "founder_led",
  allianceNetwork: "staged_after_compliance",
  allianceRoutingRule: "no alliance routing until vetting, Tool Belt completion, compliance readiness, and operator approval",
} as const;

export const CANONICAL_SEO_PHASES = {
  phase1: { label: "launch authority pages", targetPageCount: 5 },
  phase2: { label: "authority expansion pages", targetPageCount: 60 },
  phase3: { label: "programmatic engine", targetPageCount: 2400, status: "staged_only" },
} as const;

export const CANONICAL_CRM_RULE = {
  sourceOfTruth: "deals",
  referralAttachment: "Attorney/referral pipeline attaches to deals as referral/relationship intelligence",
  noCompetingCrm: true,
} as const;

export const CANONICAL_PUBLIC_COPY_LOCKS = {
  banned: ["Compliance Map", "Mission Control", "Sovereign Command", "RON Certified", "RON Specialist", "Hague Convention Compliant", "Hague Convention · 120+ Nations", "AES-256", "Stripe", "TIFFANYTEST", "TIFFANY100", "100% off", "free coupon", "payment bypass", "cheap", "fast notary", "notary near me", "guaranteed acceptance", "government approved", "legal advice", "accepted domestically and internationally"],
  required: ["Execution Quote", "Begin Secure Intake", "Global Document Intelligence", "International Document Execution", "U.S. Document Execution for International Use", "Payment-Gated Execution", "Secure Matter Portal", "Final acceptance remains subject to the receiving authority.", "Remote Online Notarization for eligible documents", "Apostille Coordination", "Florida Mobile Notary Coordination", "International Courier Release"],
  banned: [
    "Compliance Map",
    "Mission Control",
    "Sovereign Command",
    "RON Certified",
    "RON Specialist",
    "Hague Convention Compliant",
    "Hague Convention · 120+ Nations",
    "AES-256",
    "Stripe",
    "TIFFANYTEST",
    "TIFFANY100",
    "100% off",
    "free coupon",
    "payment bypass",
    "cheap",
    "fast notary",
    "notary near me",
    "guaranteed acceptance",
    "government approved",
    "accepted domestically and internationally",
  ],
  required: [
    "Execution Quote",
    "Begin Secure Intake",
    "Global Document Intelligence",
    "International Document Execution",
    "U.S. Document Execution for International Use",
    "Payment-Gated Execution",
    "Secure Matter Portal",
    "Final acceptance remains subject to the receiving authority.",
    "Remote Online Notarization for eligible documents",
    "Apostille Coordination",
    "Florida Mobile Notary Coordination",
    "International Courier Release",
  ],
} as const;
