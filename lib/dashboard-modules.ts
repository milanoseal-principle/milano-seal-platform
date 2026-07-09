export interface DashboardModule {
  name: string;
  route: string;
  icon: string;
  description: string;
  group: string;
  roles?: string[]; // if set, only show to these role families; omit = operator+founder only
}

export const DASHBOARD_MODULES: DashboardModule[] = [
  // ── ADMIN ────────────────────────────────────────────────────────────────
  {
    name: "Command",
    route: "command",
    icon: "Terminal",
    description: "Nicholas Milano Command Center — full OS overview",
    group: "Admin",
  },
  {
    name: "Command Center",
    route: "command-center",
    icon: "Crown",
    description: "Every Matter. Every Dollar. Every Step.",
    group: "Admin",
  },
  {
    name: "Command Center",
    route: "admin",
    icon: "ShieldAlert",
    description: "SLA alerts, conversion scoring, recent activity",
    group: "Admin",
  },
  {
    name: "Copilot",
    route: "copilot",
    icon: "Sparkles",
    description: "Daily operator briefing — top actions, risk, opportunities",
    group: "Admin",
  },
  {
    name: "New Matter",
    route: "intake",
    icon: "FilePlus2",
    description: "Admin intake with live pricing preview",
    group: "Admin",
  },
  {
    name: "Matters",
    route: "deals",
    icon: "Briefcase",
    description: "Filterable list of every matter",
    group: "Admin",
  },
  {
    name: "Pipeline",
    route: "pipeline",
    icon: "Kanban",
    description: "Kanban view by execution stage",
    group: "Admin",
  },
  {
    name: "Follow-ups",
    route: "follow-ups",
    icon: "ListTodo",
    description: "Auto-scheduled touchpoints",
    group: "Admin",
  },
  {
    name: "Invoice Studio",
    route: "invoices",
    icon: "Receipt",
    description: "Matter invoices and payment records",
    group: "Admin",
  },
  {
    name: "Discounts",
    route: "discounts",
    icon: "Tag",
    description: "Discount code manager",
    group: "Admin",
  },
  {
    name: "Global Document Intelligence",
    route: "compliance",
    icon: "Globe",
    description: "Hague + RON + witness rules per jurisdiction",
    group: "Admin",
  },
  // ── CORE ─────────────────────────────────────────────────────────────────
  {
    name: "KPI Dashboard",
    route: "kpi",
    icon: "BarChart3",
    description: "Revenue, pipeline, system health",
    group: "Core",
  },
  {
    name: "Clients",
    route: "clients",
    icon: "Users",
    description: "Lifetime value & relationship intel",
    group: "Core",
  },
  {
    name: "Analytics",
    route: "analytics",
    icon: "BarChart3",
    description: "Revenue, destinations, documents, growth signals",
    group: "Core",
  },
  {
    name: "Opportunities",
    route: "opportunities",
    icon: "Target",
    description: "Global vertical opportunity engine — 22 B2B ecosystems",
    group: "Core",
  },
  {
    name: "Trust Network Intelligence",
    route: "alliance/intelligence-platform",
    icon: "Network",
    description: "Partner Passport, trust progression, dispatch readiness, and Alliance intelligence graph",
    group: "Core",
  },
  {
    name: "Government Intelligence",
    route: "government-intelligence",
    icon: "Landmark",
    description: "Agency registry, procurement watch, relationship memory, and public-sector capability routing",
    group: "Core",
  },
  // ── PIPELINE ─────────────────────────────────────────────────────────────
  {
    name: "Leads",
    route: "leads",
    icon: "Funnel",
    description: "Inbound + outbound acquisition",
    group: "Pipeline",
  },
  {
    name: "Prospects",
    route: "prospects",
    icon: "Search",
    description: "Google extraction engine",
    group: "Pipeline",
  },
  {
    name: "Forecast",
    route: "forecast",
    icon: "TrendingUp",
    description: "Stage probability & revenue projection",
    group: "Pipeline",
  },
  {
    name: "Financials",
    route: "financials",
    icon: "DollarSign",
    description: "Deal revenue, cost & profitability",
    group: "Pipeline",
  },
  // ── EXECUTION ────────────────────────────────────────────────────────────
  {
    name: "Apostille",
    route: "apostille",
    icon: "Stamp",
    description: "Apostille submission tracker",
    group: "Execution",
  },
  {
    name: "Pricing",
    route: "pricing",
    icon: "Tag",
    description: "Internal pricing engine — do not share",
    group: "Execution",
  },
  {
    name: "Intelligence",
    route: "intelligence",
    icon: "Lightbulb",
    description: "High-value bundle & market intel",
    group: "Execution",
  },
  {
    name: "Runbook",
    route: "runbook",
    icon: "ClipboardList",
    description: "Daily & weekly operator playbook",
    group: "Execution",
  },
  // ── OPERATIONS ───────────────────────────────────────────────────────────
  {
    name: "Execution Control",
    route: "execution-control",
    icon: "AlertTriangle",
    description: "Real-time matter escalation and execution queue",
    group: "Operations",
  },
  {
    name: "Deliveries",
    route: "deliveries",
    icon: "Package",
    description: "Shipment tracking and delivery status",
    group: "Operations",
  },
  {
    name: "Courier",
    route: "courier",
    icon: "Truck",
    description: "Courier management and label generation",
    group: "Operations",
  },
  {
    name: "Shipping",
    route: "shipping",
    icon: "Send",
    description: "Shipping labels and Shippo integration",
    group: "Operations",
  },
  {
    name: "Releases",
    route: "releases",
    icon: "Send",
    description: "Document release queue and courier readiness",
    group: "Operations",
  },
  {
    name: "Release Certificates",
    route: "releases/certificates",
    icon: "Award",
    description: "Generate and print release and completion certificates",
    group: "Operations",
  },
  {
    name: "Rejections",
    route: "rejections",
    icon: "XCircle",
    description: "Rejection intelligence and institutional memory",
    group: "Operations",
  },
  {
    name: "Incidents",
    route: "incidents",
    icon: "ShieldAlert",
    description: "Compliance incident center",
    group: "Operations",
  },
  {
    name: "Notary Network",
    route: "notary-network",
    icon: "BadgeCheck",
    description: "Notary network applications and credentials",
    group: "Operations",
  },
  {
    name: "Execution QA",
    route: "execution-qa",
    icon: "CheckSquare",
    description: "Matter execution quality assurance",
    group: "Operations",
  },
  {
    name: "Execution Jobs",
    route: "execution-jobs",
    icon: "Zap",
    description: "Active execution job queue",
    group: "Operations",
  },
  {
    name: "Needs Review",
    route: "needs-review",
    icon: "AlertCircle",
    description: "Matters flagged for review",
    group: "Operations",
  },
  {
    name: "Exceptions",
    route: "exceptions",
    icon: "AlertTriangle",
    description: "Exception handling and escalation log",
    group: "Operations",
  },
  {
    name: "Witness Network",
    route: "witness-network",
    icon: "Users",
    description: "RON witness availability and scheduling",
    group: "Operations",
  },
  {
    name: "Packet Builder",
    route: "packet-builder",
    icon: "Package",
    description: "Document packet assembly",
    group: "Operations",
  },
  {
    name: "Tools",
    route: "tools",
    icon: "Wrench",
    description: "Operator tools and utilities",
    group: "Operations",
  },
  {
    name: "SOPs",
    route: "sops",
    icon: "BookOpen",
    description: "Standard operating procedures",
    group: "Operations",
  },
  // ── MATTER INTELLIGENCE ──────────────────────────────────────────────────
  {
    name: "Matter Intelligence",
    route: "matter-intelligence",
    icon: "Brain",
    description: "Per-matter execution intelligence and routing",
    group: "Matter Intelligence",
  },
  {
    name: "Reconciliation",
    route: "matter-intelligence/reconciliation",
    icon: "GitMerge",
    description: "Payment and status reconciliation",
    group: "Matter Intelligence",
  },
  {
    name: "Packet Review",
    route: "matter-intelligence/packet-review",
    icon: "FileSearch",
    description: "Document packet review queue",
    group: "Matter Intelligence",
  },
  {
    name: "Routing Rules",
    route: "matter-intelligence/routing-rules",
    icon: "Route",
    description: "Execution routing rule engine",
    group: "Matter Intelligence",
  },
  {
    name: "Operational Ledger",
    route: "ledger",
    icon: "BookOpen",
    description: "Operational financial ledger",
    group: "Matter Intelligence",
  },
  // ── OUTREACH ─────────────────────────────────────────────────────────────
  {
    name: "Scripts",
    route: "scripts",
    icon: "MessageSquare",
    description: "Inbound response scripts by channel",
    group: "Outreach",
  },
  {
    name: "Emails",
    route: "emails",
    icon: "Mail",
    description: "Stage-by-stage email templates",
    group: "Outreach",
  },
  {
    name: "Referral",
    route: "referral",
    icon: "Share2",
    description: "Attorney & partner referral engine",
    group: "Outreach",
  },
  {
    name: "Reviews",
    route: "reviews",
    icon: "Star",
    description: "Post-completion reputation system",
    group: "Outreach",
  },
  {
    name: "Outreach",
    route: "outreach",
    icon: "Send",
    description: "Professional outreach templates for attorneys, partners, authorities",
    group: "Outreach",
  },
  // ── GROWTH ───────────────────────────────────────────────────────────────
  {
    name: "Content",
    route: "content",
    icon: "FileText",
    description: "Authority content & social pipeline",
    group: "Growth",
  },
  {
    name: "Ads",
    route: "ads",
    icon: "Megaphone",
    description: "Paid acquisition performance",
    group: "Growth",
  },
  {
    name: "SEO",
    route: "seo",
    icon: "Globe",
    description: "KG SEO map — page generation matrix",
    group: "Growth",
  },
  {
    name: "Automation",
    route: "automation",
    icon: "Zap",
    description: "Trigger rules & automation engine",
    group: "Growth",
  },
  // ── INTELLIGENCE ─────────────────────────────────────────────────────────
  {
    name: "Executive",
    route: "executive",
    icon: "Crown",
    description: "Executive financial and operational intelligence",
    group: "Intelligence",
  },
  {
    name: "Relationships",
    route: "relationships",
    icon: "Network",
    description: "Client, attorney, partner relationship registry",
    group: "Intelligence",
  },
  {
    name: "Autopilot",
    route: "intelligence/autopilot",
    icon: "Zap",
    description: "Operator-confirmed task automation across active matters",
    group: "Intelligence",
  },
  {
    name: "Countries",
    route: "countries",
    icon: "Map",
    description: "Global apostille intelligence database",
    group: "Intelligence",
  },
  {
    name: "Documents",
    route: "documents",
    icon: "BookOpen",
    description: "Global document classification system",
    group: "Intelligence",
  },
  {
    name: "Lanes",
    route: "lanes",
    icon: "Route",
    description: "Execution routing by destination",
    group: "Intelligence",
  },
  {
    name: "Execution DNA",
    route: "dna",
    icon: "Dna",
    description: "Route intelligence from completed matter history",
    group: "Intelligence",
  },
  {
    name: "Corridors",
    route: "corridors",
    icon: "Route",
    description: "Verified execution corridor registry",
    group: "Intelligence",
  },
  {
    name: "Trust Engine",
    route: "trust",
    icon: "ShieldCheck",
    description: "Verified delivery and authority trust metrics",
    group: "Intelligence",
  },
  {
    name: "Authority Verify",
    route: "authorities/verify",
    icon: "BadgeCheck",
    description: "Authority confidence promotion workflow",
    group: "Intelligence",
  },
  {
    name: "System Truth",
    route: "truth",
    icon: "Activity",
    description: "Milano Seal system health across all 7 pillars",
    group: "Intelligence",
  },
  {
    name: "Memory Engine",
    route: "memory",
    icon: "BookMarked",
    description: "Institutional memory — incidents, corrections, known patterns",
    group: "Intelligence",
  },
  {
    name: "Authority Acquisition",
    route: "authority-acquisition",
    icon: "TrendingUp",
    description: "Systematic authority confidence promotion scoreboard",
    group: "Intelligence",
  },
  {
    name: "Auth Research Queue",
    route: "authority-research",
    icon: "Search",
    description: "Authority verification work queue",
    group: "Intelligence",
  },
  {
    name: "Observations",
    route: "observations",
    icon: "Eye",
    description: "Authority observation request templates",
    group: "Intelligence",
  },
  {
    name: "Document Demand",
    route: "demand",
    icon: "FileSearch",
    description: "Real-time document demand by type, country, and source",
    group: "Intelligence",
  },
  {
    name: "Corridor Certification",
    route: "corridors/certification",
    icon: "Award",
    description: "Priority corridor certification program",
    group: "Intelligence",
  },
  // ── VA OPERATIONS ────────────────────────────────────────────────────────
  {
    name: "VA Hub",
    route: "va",
    icon: "Users",
    description: "Virtual assistant management",
    group: "VA Operations",
  },
  // ── ALLIANCE ─────────────────────────────────────────────────────────────
  {
    name: "Alliance",
    route: "alliance",
    icon: "Network",
    description: "Alliance partner management",
    group: "Alliance",
    roles: ["alliance"],
  },
  {
    name: "Alliance Dispatch",
    route: "alliance/dispatch",
    icon: "Send",
    description: "Alliance job dispatch",
    group: "Alliance",
    roles: ["alliance"],
  },
  {
    name: "Alliance Referrals",
    route: "alliance/referrals",
    icon: "Share2",
    description: "Alliance referral management",
    group: "Alliance",
    roles: ["alliance"],
  },
  // ── SYSTEM ───────────────────────────────────────────────────────────────
  {
    name: "Legal",
    route: "legal",
    icon: "Scale",
    description: "Entity, banking & compliance records",
    group: "System",
  },
  {
    name: "Credentials",
    route: "credentials",
    icon: "Lock",
    description: "Platform logins — operator only",
    group: "System",
  },
  {
    name: "Ideas",
    route: "ideas",
    icon: "Sparkles",
    description: "Product, revenue & system upgrades",
    group: "System",
  },
  {
    name: "Assets",
    route: "assets",
    icon: "FolderOpen",
    description: "Drive folder index & asset map",
    group: "System",
  },
  {
    name: "Deployment",
    route: "deployment",
    icon: "Server",
    description: "Infrastructure and deployment validation",
    group: "System",
  },
  {
    name: "Monitoring",
    route: "monitoring",
    icon: "Activity",
    description: "System monitoring and health checks",
    group: "System",
  },
  {
    name: "Build Center",
    route: "build-center",
    icon: "Wrench",
    description: "Platform build and release management",
    group: "System",
  },
  {
    name: "Terminal",
    route: "terminal",
    icon: "Terminal",
    description: "Operator terminal",
    group: "System",
  },
  {
    name: "Human Touch Trust Engine",
    route: "docs/human-touch-trust-engine",
    icon: "Heart",
    description: "Human touch delivery and trust documentation",
    group: "System",
  },
  {
    name: "Security",
    route: "security",
    icon: "Shield",
    description: "Security audit and access controls",
    group: "System",
  },
];

export const MODULE_GROUPS = [
  "Admin",
  "Core",
  "Pipeline",
  "Execution",
  "Operations",
  "Matter Intelligence",
  "Intelligence",
  "VA Operations",
  "Alliance",
  "Outreach",
  "Growth",
  "System",
];

// Role families for nav filtering
export type RoleFamily = "operator" | "alliance" | "va" | "founder";

export function getRoleFamilyModules(roleFamily: RoleFamily): DashboardModule[] {
  if (roleFamily === "founder") return DASHBOARD_MODULES;
  if (roleFamily === "operator") {
    return DASHBOARD_MODULES.filter(
      (m) => !m.roles || m.roles.includes("operator")
    );
  }
  if (roleFamily === "alliance") {
    const ALLIANCE_ROUTES = new Set([
      "alliance", "alliance/dispatch", "alliance/referrals",
      "alliance/trust-graph", "alliance/vault",
    ]);
    return DASHBOARD_MODULES.filter(
      (m) => ALLIANCE_ROUTES.has(m.route) || (m.roles && m.roles.includes("alliance"))
    );
  }
  if (roleFamily === "va") {
    const VA_ROUTES = new Set([
      "va", "deals", "follow-ups", "sops", "tools",
    ]);
    return DASHBOARD_MODULES.filter((m) => VA_ROUTES.has(m.route));
  }
  return [];
}

export function getModuleGroups(modules: DashboardModule[]): string[] {
  const seen = new Set<string>();
  return MODULE_GROUPS.filter((g) => {
    const has = modules.some((m) => m.group === g);
    if (has && !seen.has(g)) { seen.add(g); return true; }
    return false;
  });
}

