// Milano Seal — Execution Intelligence Matrix
// Role-aware projection over the country execution intelligence registry.
// Public client/lawyer views never expose margin, payout logic, or operator notes.

import {
  getCountryExecutionIntelligence,
  type CountryExecutionIntelligence,
} from "@/data/country-execution-intelligence";

export type ExecutionAudience =
  | "client"
  | "lawyer"
  | "alliance_notary"
  | "virtual_assistant"
  | "operator"
  | "founder";

export type ExecutionIntelligenceSignal = {
  id: string;
  label: string;
  value: string;
  severity: "info" | "watch" | "escalate" | "blocked" | "revenue";
  audience: ExecutionAudience[];
};

export type ExecutionIntelligencePanel = {
  slug: string;
  title: string;
  audience: ExecutionAudience;
  primaryUse: string;
  keySignals: ExecutionIntelligenceSignal[];
  actionLine: string;
  revenueLine?: string;
  complianceLine: string;
};

const PUBLIC_AUDIENCES: ExecutionAudience[] = ["client", "lawyer", "alliance_notary", "virtual_assistant"];
const ALL_AUDIENCES: ExecutionAudience[] = [
  "client",
  "lawyer",
  "alliance_notary",
  "virtual_assistant",
  "operator",
  "founder",
];
const OPERATOR_AUDIENCES: ExecutionAudience[] = ["operator", "founder"];

const ACTION_LINES: Record<ExecutionAudience, (c: CountryExecutionIntelligence) => string> = {
  client: () =>
    "Start controlled intake, upload the document, confirm destination use, and wait for route review before execution is scheduled.",
  lawyer: (c) => c.lawyerClientUse,
  alliance_notary: (c) => c.allianceNotaryUse,
  virtual_assistant: (c) => c.virtualAssistantUse,
  operator: (c) => c.operatorUse,
  founder: (c) => c.founderUse,
};

const PRIMARY_USE: Record<ExecutionAudience, string> = {
  client: "Understand the route before paying",
  lawyer: "Explain the route to clients without guarantees",
  alliance_notary: "Gauge assignment readiness",
  virtual_assistant: "Review, route, and escalate intake",
  operator: "Drive the matter to the next gate",
  founder: "See safe revenue and completion risk",
};

export function getExecutionSignals(slug: string): ExecutionIntelligenceSignal[] {
  const c = getCountryExecutionIntelligence(slug);
  const signals: ExecutionIntelligenceSignal[] = [];

  signals.push({
    id: "route",
    label: c.routeType === "hague_apostille" ? "Hague Route" : "Authority Route",
    value: c.routeLabel,
    severity: "info",
    audience: ALL_AUDIENCES,
  });
  signals.push({
    id: "notarial",
    label: "Notarial Readiness",
    value: "Signer, ID, certificate, witness reviewed",
    severity: "watch",
    audience: ALL_AUDIENCES,
  });
  if (c.translationRisk !== "none") {
    signals.push({
      id: "translation",
      label: "Translation Review",
      value: `Translation ${c.translationRisk.replace("_", " ")}`,
      severity: c.translationRisk === "likely" || c.translationRisk === "authority_specific" ? "escalate" : "watch",
      audience: ALL_AUDIENCES,
    });
  }
  signals.push({
    id: "courier",
    label: "Courier Release",
    value: c.courierRisk === "custody_required" ? "Custody-controlled release" : "Standard release",
    severity: c.courierRisk === "custody_required" ? "escalate" : "info",
    audience: ALL_AUDIENCES,
  });
  if (c.routeType !== "hague_apostille") {
    signals.push({
      id: "escalation",
      label: "Escalation Watch",
      value: c.escalationTriggers[0] ?? "Authority review",
      severity: "escalate",
      audience: ALL_AUDIENCES,
    });
  }
  signals.push({
    id: "revenue",
    label: "Revenue Opportunity",
    value: c.revenueUse,
    severity: "revenue",
    audience: OPERATOR_AUDIENCES,
  });

  return signals;
}

export function getRevenueSignals(slug: string): ExecutionIntelligenceSignal[] {
  return getExecutionSignals(slug).filter((s) => s.severity === "revenue");
}

export function getComplianceSignals(slug: string): ExecutionIntelligenceSignal[] {
  const c = getCountryExecutionIntelligence(slug);
  return [
    {
      id: "compliance",
      label: "Compliance Boundary",
      value: c.complianceBoundary,
      severity: "info",
      audience: ALL_AUDIENCES,
    },
  ];
}

export function getExecutionIntelligenceForAudience(
  slug: string,
  audience: ExecutionAudience,
): ExecutionIntelligencePanel {
  const c = getCountryExecutionIntelligence(slug);
  const isOperator = OPERATOR_AUDIENCES.includes(audience);

  const keySignals = getExecutionSignals(slug).filter((s) => {
    if (!s.audience.includes(audience)) return false;
    // Revenue signals are operator/founder only — never leak to public audiences.
    if (s.severity === "revenue" && !isOperator) return false;
    return true;
  });

  return {
    slug,
    title: c.displayName,
    audience,
    primaryUse: PRIMARY_USE[audience],
    keySignals,
    actionLine: ACTION_LINES[audience](c),
    revenueLine: isOperator ? c.revenueUse : undefined,
    complianceLine: c.complianceBoundary,
  };
}

export const PUBLIC_CARD_AUDIENCES = PUBLIC_AUDIENCES;
export const COMPACT_CARD_AUDIENCES: ExecutionAudience[] = ["client", "lawyer", "operator"];
export const FULL_CARD_AUDIENCES: ExecutionAudience[] = [
  "client",
  "lawyer",
  "alliance_notary",
  "virtual_assistant",
  "operator",
];
