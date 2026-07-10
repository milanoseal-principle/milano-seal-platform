/**
 * maritimePricingAdapter — delegates to the CANONICAL pricing gateway. No new
 * calculator. Maritime/commercial quotes are operator-prepared (no automatic
 * public final price); internal margins never exposed. Notarial/government/
 * courier/translation/partner costs remain separately identifiable.
 */

import {
  quoteNonConsumer,
  type CanonicalQuoteResult,
  type QuoteContext,
} from "@/lib/pricing/canonicalPricingGateway";

export type MaritimeServiceLane =
  | "maritime_signature_execution"
  | "logistics_priority_execution"
  | "critical_shipment_response"
  | "executive_trade_execution"
  | "international_authentication_coordination"
  | "port_area_field_execution"
  | "after_hours_execution"
  | "commercial_account_retainer"
  | "customs_broker_priority_desk"
  | "law_firm_maritime_execution_desk";

export const MARITIME_SERVICE_LANES: { lane: MaritimeServiceLane; label: string }[] = [
  { lane: "maritime_signature_execution", label: "Maritime Signature Execution" },
  { lane: "logistics_priority_execution", label: "Logistics Priority Execution" },
  { lane: "critical_shipment_response", label: "Critical Shipment Response" },
  { lane: "executive_trade_execution", label: "Executive Trade Execution" },
  { lane: "international_authentication_coordination", label: "International Authentication Coordination" },
  { lane: "port_area_field_execution", label: "Port-Area Field Execution" },
  { lane: "after_hours_execution", label: "After-Hours Execution" },
  { lane: "commercial_account_retainer", label: "Commercial Account Retainer" },
  { lane: "customs_broker_priority_desk", label: "Customs Broker Priority Desk" },
  { lane: "law_firm_maritime_execution_desk", label: "Law Firm Maritime Execution Desk" },
];

export const MARITIME_PUBLIC_PRICING_STATEMENT =
  "Custom commercial quote issued after scope and deadline review. Notarial fees, government fees, courier costs, translation charges, partner costs, and other third-party expenses remain separately identifiable where applicable.";

/**
 * Prepare a maritime commercial quote — always operator-prepared via the
 * canonical gateway (internalOnly result; margins stay internal). Never returns
 * an automatic public final price.
 */
export function prepareMaritimeQuote(ctx: QuoteContext = {}): CanonicalQuoteResult {
  return quoteNonConsumer("enterprise", ctx);
}
