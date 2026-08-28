export const COUNSEL_INTELLIGENCE_REPORT = {
  code: "LAWYER_CLIENT_PACK_SINGLE",
  name: "Milano Cross-Border Execution Intelligence Report™",
  priceLabel: "$149 / Matter",
  audience: "U.S. and foreign counsel managing U.S.-origin documents for international use",
  promise:
    "A matter-specific execution intelligence and readiness dossier. It does not provide legal advice and does not replace receiving-authority confirmation.",
  sections: [
    "Executive Route Decision",
    "Authority Matrix",
    "Execution Requirements Matrix",
    "Failure / Rejection Risk",
    "Client Execution Instructions",
    "Notary Execution Brief",
    "Authentication Route",
    "Chain-of-Custody Plan",
    "Evidence Appendix",
  ],
  routeStatuses: ["EXECUTION READY", "REVIEW REQUIRED", "BLOCKED", "UNKNOWN"],
} as const;

export const COUNSEL_DESK = {
  code: "LAWYER_MONTHLY_ACCESS",
  name: "Milano Counsel Desk™",
  priceLabel: "$299 / month",
  description:
    "Recurring professional access for firms sending international document matters through The Milano Seal.",
  capabilities: [
    "Cross-border execution intelligence reports",
    "Jurisdiction route library",
    "Client-ready instruction packs",
    "Priority Matter review",
    "Matter status visibility",
    "Document readiness checks",
    "Concierge escalation",
    "Execution and courier tracking",
    "Reusable client intake links",
  ],
} as const;

export const COUNSEL_PRIMARY_PRACTICE_AREAS = [
  "International / private-client counsel",
  "Immigration and nationality",
  "International real estate",
  "Trusts, estates and private wealth",
  "Corporate / transactional",
  "Family law with cross-border matters",
  "Maritime / yacht transactions",
  "International litigation",
] as const;

export const COUNSEL_PRIORITY_CORRIDORS = [
  "United States → Italy",
  "United States → Spain",
  "United States → Portugal",
  "United States → Greece",
  "United States → Mexico",
  "United States → Brazil",
  "United States → UAE",
] as const;

export const COUNSEL_REPORT_BOUNDARY =
  "The Milano Seal is not a law firm and does not provide legal advice. Unknown remains UNKNOWN. Final document acceptance remains subject to the receiving authority and matter-specific requirements.";
