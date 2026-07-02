export type InternalModuleStatus = "live" | "staged" | "planned" | "blocked" | "staged_only";
export type InternalModuleRiskLevel = "low" | "medium" | "high" | "payment_sensitive";
export type InternalModuleVisibility = "internal" | "founder" | "operator" | "staged_only";

export interface InternalModule {
  id: string;
  label: string;
  href: string;
  section: "Operations" | "Revenue" | "Growth" | "Execution" | "Intelligence" | "Documents" | "System" | "Staged";
  description: string;
  status: InternalModuleStatus;
  visibility: InternalModuleVisibility;
  riskLevel: InternalModuleRiskLevel;
  sourceStandard: string;
}

const SOURCE_STANDARD = "Final SOP / Command Center Runbook + Layer 1.8 Phase-Lock SOP + legacy Trust Engine extraction rules";

export const INTERNAL_MODULES: InternalModule[] = [
  {
    id: "command_center",
    label: "Command Center",
    href: "/dashboard/command-center",
    section: "Operations",
    description: "Internal operating menu for every matter, dollar, and step without fake live metrics.",
    status: "live",
    visibility: "internal",
    riskLevel: "medium",
    sourceStandard: SOURCE_STANDARD,
  },
  {
    id: "discounts",
    label: "Discount Control",
    href: "/dashboard/discounts",
    section: "Revenue",
    description: "Operator-only discount governance with payment-sensitive controls.",
    status: "live",
    visibility: "founder",
    riskLevel: "payment_sensitive",
    sourceStandard: SOURCE_STANDARD,
  },
  {
    id: "referrals",
    label: "Referral Intelligence",
    href: "/dashboard/referrals",
    section: "Revenue",
    description: "Relationship and referral intelligence for attorney, private-client, and partner channels.",
    status: "planned",
    visibility: "internal",
    riskLevel: "medium",
    sourceStandard: SOURCE_STANDARD,
  },
  {
    id: "seo_authority",
    label: "SEO Authority Engine",
    href: "/dashboard/seo-authority",
    section: "Growth",
    description: "Authority content and route planning without publishing staged programmatic pages.",
    status: "planned",
    visibility: "internal",
    riskLevel: "medium",
    sourceStandard: SOURCE_STANDARD,
  },
  {
    id: "compliance_atlas",
    label: "Compliance Atlas",
    href: "/dashboard/compliance-atlas",
    section: "Execution",
    description: "Internal destination intelligence and receiving-authority review controls.",
    status: "planned",
    visibility: "internal",
    riskLevel: "high",
    sourceStandard: SOURCE_STANDARD,
  },
  {
    id: "operator_terminal",
    label: "Operator Terminal",
    href: "/dashboard/operator-terminal",
    section: "Intelligence",
    description: "Private operator route for system actions, operational ledger review, and controlled execution checks.",
    status: "planned",
    visibility: "operator",
    riskLevel: "high",
    sourceStandard: SOURCE_STANDARD,
  },
  {
    id: "invoices",
    label: "Invoice Studio",
    href: "/dashboard/invoices",
    section: "Documents",
    description: "Internal invoice and payment authorization workspace.",
    status: "live",
    visibility: "internal",
    riskLevel: "payment_sensitive",
    sourceStandard: SOURCE_STANDARD,
  },
  {
    id: "sales_lab",
    label: "Sales Intelligence Lab",
    href: "/dashboard/intelligence/sales-lab",
    section: "Growth",
    description: "Internal growth and sales intelligence route for qualified operator review.",
    status: "planned",
    visibility: "internal",
    riskLevel: "medium",
    sourceStandard: SOURCE_STANDARD,
  },
  {
    id: "launch_status",
    label: "Launch Status",
    href: "/dashboard",
    section: "System",
    description: "Internal dashboard home and production launch status surface.",
    status: "live",
    visibility: "internal",
    riskLevel: "low",
    sourceStandard: SOURCE_STANDARD,
  },

  {
    id: "operator_intelligence_spine",
    label: "Operator Intelligence Spine",
    href: "/dashboard/operator-spine",
    section: "Intelligence",
    description: "Internal-only execution priorities, route plans, partner memory, revenue status, activity ledger, and closeout control.",
    status: "live",
    visibility: "internal",
    riskLevel: "medium",
    sourceStandard: SOURCE_STANDARD,
  },
  {
    id: "motion_preview",
    label: "Motion Preview",
    href: "/dashboard/motion-preview",
    section: "Staged",
    description: "Staged-only motion preview. Not production-live unless separately approved.",
    status: "staged_only",
    visibility: "staged_only",
    riskLevel: "low",
    sourceStandard: SOURCE_STANDARD,
  },
];
