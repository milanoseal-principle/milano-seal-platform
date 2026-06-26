import { getCountryRule, type CountryRule } from "./countryRules";

export interface ComplianceRouteResult extends CountryRule {
  compliance_review_required: boolean;
}

export function routeCompliance(country?: string | null): ComplianceRouteResult {
  const rule = getCountryRule(country);
  return {
    ...rule,
    compliance_review_required: rule.hague_status !== "hague" || rule.estimated_risk_level === "high" || rule.estimated_risk_level === "review",
  };
}
