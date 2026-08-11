export const INTELLIGENCE_FEEDBACK_TARGETS = [
  "Pricing Engine",
  "Country Intelligence",
  "Embassy Procedures",
  "QA Rules",
  "Templates",
  "Execution Standards",
  "Proposal Library",
  "Knowledge Graph",
  "Alliance Reputation",
  "Government Intelligence",
  "International Corridor Intelligence",
  "Risk Alerts",
] as const;

export const CASE_STUDY_001_ITALY_BASELINE = {
  id: "case-study-001-italy",
  label: "Case Study 001 — Italy baseline",
  leadSource: "Instagram",
  verifiedRevenue: null,
  timeline: ["Discovery", "Quote", "Wise Payment", "Document Drafting", "RON", "Apostille", "Courier", "Delivery", "Client Confirmation"],
  generatedAssets: ["SOP Changes", "QA Rules", "Knowledge Graph Nodes"],
  governance: "Use as a training baseline only. Do not publish client identity, revenue, or private facts without explicit approval and verified source records.",
} as const;
