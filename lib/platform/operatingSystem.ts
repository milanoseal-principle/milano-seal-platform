export type PlatformLayerId = "client-experience" | "execution-engine" | "operations" | "trust-network" | "intelligence" | "enterprise";

export interface PlatformLayer {
  id: PlatformLayerId;
  layer: number;
  name: string;
  purpose: string;
  modules: string[];
}

export const MILANO_OPERATING_SYSTEM_LAYERS: PlatformLayer[] = [
  {
    id: "client-experience",
    layer: 1,
    name: "Client Experience",
    purpose: "Convert inquiries into controlled matters with secure intake, quote visibility, payment authorization, and Matter Control Portal status.",
    modules: ["Website", "Secure Records Intake", "Quote Engine", "Pricing Engine", "Matter Control Portal", "Matter Tracking", "Payment Center", "Document Vault"],
  },
  {
    id: "execution-engine",
    layer: 2,
    name: "Execution Engine",
    purpose: "Route each matter through the best operational pathway without hard-coding digital, field, or hybrid delivery.",
    modules: ["Intake Intelligence", "Compliance Review", "Execution Pathway Intelligence", "Three-Tier Execution Engine", "RON Coordination", "Field Coordination", "Witness Coordination", "Apostille Coordination", "Translation Coordination", "Courier Coordination", "QA Engine", "Chain-of-Custody Visibility"],
  },
  {
    id: "operations",
    layer: 3,
    name: "Operations",
    purpose: "Give operators one next action per matter across dashboards, procurement, revenue, workflow automation, notifications, and reporting.",
    modules: ["Operator Dashboard", "Matter Command Center", "Procurement Center", "Government Response Center", "Revenue Dashboard", "Workflow Automation", "Notifications", "Reporting"],
  },
  {
    id: "trust-network",
    layer: 4,
    name: "Trust Network",
    purpose: "Progress partners through operational maturity instead of selling membership access.",
    modules: ["Alliance Directory", "Verified Partners", "Coverage Map", "Trust Scores", "Partner Passport", "Dispatch Center", "Opportunity Exchange", "Continuing Education"],
  },
  {
    id: "intelligence",
    layer: 5,
    name: "Intelligence",
    purpose: "Continuously enrich country, government, healthcare, airport, procurement, case study, and knowledge graph intelligence from completed matters.",
    modules: ["Country Intelligence", "Hague Intelligence", "Embassy Intelligence", "Government Intelligence", "Healthcare Intelligence", "Airport Intelligence", "Procurement Intelligence", "Knowledge Graph", "Case Study Intelligence", "Future AI Recommendations"],
  },
  {
    id: "enterprise",
    layer: 6,
    name: "Enterprise",
    purpose: "Support white label, API, multi-tenant, and enterprise buyer pathways without creating standalone product islands.",
    modules: ["White Label", "API", "Multi-Tenant", "Enterprise Clients", "Government Agencies", "Law Firms", "Healthcare Systems", "Universities", "Financial Institutions"],
  },
];

export const PLATFORM_GOVERNANCE_RULES = [
  "The Milano Seal is a single operating system.",
  "Every module must belong to one architecture layer.",
  "Do not create standalone feature islands.",
  "All modules must connect to Matter, Contact, Organization, Jurisdiction, Country, Partner, Procurement, and Intelligence.",
  "Every screen should answer: what action does the operator take next?",
  "No orphan dashboards, duplicate engines, duplicate pricing logic, duplicate intake forms, duplicate compliance logic, or duplicate country databases.",
  "One source of truth for every entity.",
] as const;

export const PLATFORM_UI_STANDARD = ["Header", "Title", "Status", "Quick Actions", "Primary KPI Row", "Operational Content", "Intelligence Sidebar", "Timeline", "Recent Activity", "Footer"] as const;
