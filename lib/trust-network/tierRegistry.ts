import type { TrustNetworkTier } from "./types";

export const TRUST_NETWORK_TIERS: TrustNetworkTier[] = [
  {
    id: "seal_start",
    name: "Seal Start™",
    tagline: "Launch your professional document execution business.",
    purpose: "Entry operating system for professionals building document execution capability.",
    monthlyPrice: 49,
    annualPrice: 490,
    applicationRequired: false,
    audience: ["New mobile notaries", "New RON providers", "Administrative professionals", "Legal assistants", "Translators", "Professionals expanding into document execution"],
    includes: ["Milano Seal Academy™", "Smart Intake templates", "Quote and invoice templates", "Apostille checklists", "International document guides", "SOP Library", "Client email and text templates", "Affidavit templates", "Pricing calculator", "Three-Tier Pricing Engine", "Monthly Live Intelligence Briefing™", "Government opportunity alerts", "Hague and embassy updates", "Government Ready Starter™"],
    valuePosition: ["Save 100+ hours creating systems.", "Avoid expensive execution mistakes.", "Operate with professional workflows.", "Stay informed without manual research."],
    safetyNotes: ["No guaranteed referrals.", "No guaranteed income.", "No legal advice."]
  },
  {
    id: "seal_pro",
    name: "Seal Pro™",
    tagline: "Scale your document execution company.",
    purpose: "Professional infrastructure for active operators handling client work and seeking verified routing eligibility.",
    monthlyPrice: 129,
    annualPrice: 1290,
    applicationRequired: false,
    audience: ["Working RON providers", "Apostille coordinators", "Couriers", "Translators", "Interpreters", "Legal support vendors", "Healthcare document contacts", "Airport-area mobile providers"],
    includes: ["Everything in Seal Start™", "Partner Directory™ profile", "Verified specialty profile", "Coverage map", "Language profile", "Matter routing eligibility", "Smart Dispatch eligibility", "AI Pricing Engine", "QA Engine", "Government Vendor Center", "Proposal Library™", "Business Development OS™", "Government Intelligence™", "International Intelligence™", "Quarterly Executive Workshops™", "Partner scorecard", "Trust Score™"],
    valuePosition: ["Become eligible for professionally routed opportunities.", "Reduce mistakes.", "Quote faster.", "Operate like a larger company.", "Grow credibility."],
    safetyNotes: ["Routing eligibility is not a referral guarantee.", "No guaranteed assignments.", "No false verification claims."]
  },
  {
    id: "seal_elite",
    name: "Seal Elite™",
    tagline: "Enterprise Intelligence & Strategic Partnership.",
    purpose: "Application-based annual license for firms, enterprise partners, and high-trust operators requiring advanced infrastructure.",
    annualPrice: 2500,
    applicationFee: 499,
    applicationRequired: true,
    audience: ["Law firms", "Title companies", "Citizenship firms", "Translation companies", "Enterprise clients", "Healthcare networks", "Airport partners", "Government contractors", "Corporate legal departments", "Apostille agencies"],
    includes: ["Everything in Seal Pro™", "Executive Advisory™", "White Label OS™", "Executive Partner Badge™ only after verification", "Enterprise Opportunity Desk™", "International Corridor Intelligence™", "Procurement Intelligence™", "Executive Dashboard™", "Executive AI™", "Proposal drafting", "Capability statement generation", "SOW generation", "Pricing guidance", "Government readiness support", "Quarterly strategy review", "Annual Executive Summit™"],
    valuePosition: ["Operate inside a premium execution ecosystem.", "Gain strategic guidance.", "Increase visibility.", "Strengthen the business.", "Access advanced operational intelligence."],
    safetyNotes: ["Application required.", "Verification must be completed before public status display.", "No government endorsement claims."]
  }
];

export const TRUST_NETWORK_POSITIONING = {
  product: "The Milano Seal™ Trust Network™",
  category: "Global Document Execution Intelligence Platform",
  coreMessage: "The Milano Seal™ Trust Network is not a networking community. It is a professional operating system and intelligence platform for document execution businesses.",
  taglines: ["Professional Intelligence. Trusted Execution. Global Opportunity.", "Trusted Professionals. One Global Standard.", "Where Professional Document Businesses Scale."]
} as const;
