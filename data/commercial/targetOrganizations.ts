/**
 * Real commercial target organizations — Batch 1 (maritime cluster).
 *
 * REAL DATA (isSample: false). Sourced from public business directories/websites.
 * Only public firmographic fields are populated (organization name, website,
 * city/state). Decision-maker names, emails, phones, touchpoints, revenue, and
 * relationships are intentionally NULL — nothing fabricated. Every record starts
 * at `target_identified` and requires verification before outreach.
 */

import type { VerticalId } from "@/lib/vertical-intelligence/verticalRegistry";

export type PipelineStage =
  | "target_identified"
  | "contact_verified"
  | "introduction_requested"
  | "outreach_sent"
  | "conversation_started"
  | "discovery_scheduled"
  | "need_confirmed"
  | "capability_packet_sent"
  | "pilot_offered"
  | "pilot_active"
  | "pilot_completed"
  | "commercial_quote_sent"
  | "account_onboarding"
  | "priority_desk"
  | "recurring_account"
  | "enterprise_account"
  | "renewal_due"
  | "dormant"
  | "lost";

export interface TargetOrganization {
  id: string;
  organizationName: string;
  vertical: VerticalId;
  segment: string;
  website: string | null;
  cityState: string | null;
  decisionMakerName: string | null;
  decisionMakerTitle: string | null;
  email: string | null;
  phone: string | null;
  referralSource: string | null;
  pipelineStage: PipelineStage;
  lastRealTouchpoint: string | null;
  nextAction: string;
  notes: string | null;
  verificationStatus: "pending_verification" | "verified";
  isSample: false;
}

function target(
  id: string,
  organizationName: string,
  vertical: VerticalId,
  segment: string,
  website: string | null,
  cityState: string | null,
  nextAction: string,
): TargetOrganization {
  return {
    id,
    organizationName,
    vertical,
    segment,
    website,
    cityState,
    decisionMakerName: null,
    decisionMakerTitle: null,
    email: null,
    phone: null,
    referralSource: null,
    pipelineStage: "target_identified",
    lastRealTouchpoint: null,
    nextAction,
    notes: null,
    verificationStatus: "pending_verification",
    isSample: false,
  };
}

const VERIFY = "Verify current contact + identify decision maker before outreach";

export const TARGET_ORGANIZATIONS: TargetOrganization[] = [
  // ── Marine documentation agents ──
  target("org-mda-afys", "AFYS Marine Documentation Services", "maritime", "marine_documentation_agent", "afysmarinedoc.com", "Miami / Tampa, FL", VERIFY),
  target("org-mda-ngvd", "Northern Gulf Vessel Documentation (NGVD)", "maritime", "marine_documentation_agent", "ngvd.us", "Florida", VERIFY),
  target("org-mda-titling-fl", "Titling Services of Florida, Inc.", "maritime", "marine_documentation_agent", "tservicefl.com", "Florida", VERIFY),
  target("org-mda-mardoc", "Marine Documentation Inc", "maritime", "marine_documentation_agent", "mardoc.com", "Fort Lauderdale, FL", VERIFY),

  // ── Yacht brokerages ──
  target("org-yb-moran", "Moran Yacht & Ship", "maritime", "yacht_brokerage", "moranyachts.com", "Fort Lauderdale, FL", VERIFY),
  target("org-yb-northrop-johnson", "Northrop & Johnson", "maritime", "yacht_brokerage", "northropandjohnson.com", "Fort Lauderdale, FL", VERIFY),
  target("org-yb-iyc", "International Yacht Collection (IYC)", "maritime", "yacht_brokerage", "iyc.com", "Fort Lauderdale, FL", VERIFY),
  target("org-yb-fraser", "Fraser Yachts", "maritime", "yacht_brokerage", "fraseryachts.com", "Fort Lauderdale, FL", VERIFY),
  target("org-yb-gilman", "Gilman Yachts", "maritime", "yacht_brokerage", "gilmanyachts.com", "Fort Lauderdale, FL", VERIFY),

  // ── Maritime attorneys (verify transactional/document-execution fit) ──
  target("org-mla-stroup-martin", "Stroup & Martin, P.A.", "legal_professional", "maritime_attorney", "strouplaw.net", "Fort Lauderdale, FL", "Verify transactional fit + decision maker before outreach"),
  target("org-mla-horr-skipp-perez", "Horr, Skipp & Perez, P.A.", "legal_professional", "maritime_attorney", "horrskippandperez.com", "Miami, FL", "Verify transactional fit + decision maker before outreach"),
  target("org-mla-commette", "Peter M. Commette, P.A.", "legal_professional", "maritime_attorney", "commettelaw.com", "South Florida, FL", "Verify transactional fit + decision maker before outreach"),

  // ── Customs brokers ──
  target("org-cb-hw-stjohn", "H.W. St John & Company", "logistics_freight", "customs_broker", "hwstjohn.com", "Miami, FL", VERIFY),
  target("org-cb-lmb", "LMB Customs Brokers, LLC", "logistics_freight", "customs_broker", "lmbcustomsbrokers.com", "Miami, FL", VERIFY),
  target("org-cb-doral", "Doral Customs Brokers", "logistics_freight", "customs_broker", "doralcustomsbrokers.com", "Doral, FL", VERIFY),
  target("org-cb-us-ccb", "U.S. Customs Broker", "logistics_freight", "customs_broker", "us-ccb.com", "Miami, FL", VERIFY),

  // ── Freight forwarders ──
  target("org-ff-gm-intl", "GM International Freight Forwarders Corp", "logistics_freight", "freight_forwarder", "gmfreight.com", "Miami, FL", VERIFY),
  target("org-ff-terra-global", "Terra Global Logistics", "logistics_freight", "freight_forwarder", "terrafreightforwarder.com", "Miami, FL", VERIFY),
  target("org-ff-american-fargo", "American Fargo", "logistics_freight", "freight_forwarder", "americanfargo.com", "Miami, FL", VERIFY),
  target("org-ff-nxtpoint", "NXTPoint Logistics", "logistics_freight", "freight_forwarder", "nxtpointlogistics.com", "Miami, FL", VERIFY),
  target("org-ff-interwf", "InterWF", "logistics_freight", "freight_forwarder", "interwf.com", "Miami, FL", VERIFY),
];

/** Grouped counts by segment — for operator visibility. */
export function targetsBySegment(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of TARGET_ORGANIZATIONS) out[t.segment] = (out[t.segment] ?? 0) + 1;
  return out;
}
