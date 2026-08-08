/**
 * channelRegistry — the ten connected revenue channels. Each references existing
 * verticals/engines (procurement, maritime, high-value assets) rather than
 * duplicating them. Config-only; no fabricated clients or revenue.
 */

import type { RevenueChannel, RevenueModel } from "@/lib/revenue-stack/types";

export interface RevenueChannelConfig {
  channel: RevenueChannel;
  name: string;
  audience: string;
  primaryCta: string;
  models: RevenueModel[];
  /** Existing vertical/engine this channel reuses, when applicable. */
  reusesVertical: string | null;
  publicServiceRoute: string;
}

export const REVENUE_CHANNELS: RevenueChannelConfig[] = [
  {
    channel: "consumer_international",
    name: "Consumer International Document Execution",
    audience: "U.S. citizens abroad, foreign nationals, dual-citizenship & private clients",
    primaryCta: "Begin Secure Intake",
    models: ["one_time_matter", "project_fee", "priority_fee"],
    reusesVertical: null,
    publicServiceRoute: "/services/international-document-execution",
  },
  {
    channel: "legal_professional",
    name: "Law Firms & Attorneys",
    audience: "International, estate, immigration, maritime & corporate attorneys",
    primaryCta: "Request Attorney Capability Packet",
    models: ["project_fee", "monthly_retainer", "referral_attribution"],
    reusesVertical: null,
    publicServiceRoute: "/services/attorney-document-execution",
  },
  {
    channel: "corporate_international",
    name: "International Corporate Clients",
    audience: "Corporate legal, HR/global mobility, multinationals",
    primaryCta: "Request Corporate Execution Review",
    models: ["project_fee", "monthly_retainer", "annual_agreement", "custom_scope"],
    reusesVertical: null,
    publicServiceRoute: "/services/corporate-international-document-execution",
  },
  {
    channel: "government_procurement",
    name: "Government Procurement Contracts",
    audience: "Federal, state, county, municipal, institutional buyers",
    primaryCta: "Request Government Capability Statement",
    models: ["task_order", "institutional_contract", "project_fee"],
    reusesVertical: "procurement (lib/procurement, government dashboard)",
    publicServiceRoute: "/services/government-document-execution",
  },
  {
    channel: "maritime_logistics",
    name: "Maritime & Global Logistics",
    audience: "Customs brokers, freight forwarders, shipping, yacht brokerages, marinas",
    primaryCta: "Begin Commercial Maritime Intake",
    models: ["urgent_response", "after_hours", "project_fee", "monthly_retainer"],
    reusesVertical: "maritime + high-value-assets",
    publicServiceRoute: "/services/maritime-global-logistics-document-execution",
  },
  {
    channel: "university_education",
    name: "Universities & Education",
    audience: "Students, registrars, credential evaluators, licensing boards",
    primaryCta: "Start Education Credential Review",
    models: ["one_time_matter", "project_fee", "institutional_contract"],
    reusesVertical: null,
    publicServiceRoute: "/services/education-credential-apostille",
  },
  {
    channel: "healthcare_medical",
    name: "Healthcare Systems",
    audience: "Hospitals, credentialing teams, staffing, international physicians",
    primaryCta: "Request Healthcare Document Review",
    models: ["project_fee", "monthly_retainer", "institutional_contract"],
    reusesVertical: null,
    publicServiceRoute: "/services/healthcare-credential-document-execution",
  },
  {
    channel: "enterprise_retainer",
    name: "Enterprise Retainers",
    audience: "High-volume organizations across legal, corporate, logistics, institutions",
    primaryCta: "Request Enterprise Scope",
    models: ["monthly_retainer", "annual_agreement", "custom_scope"],
    reusesVertical: null,
    publicServiceRoute: "/services/enterprise-document-execution",
  },
  {
    channel: "strategic_referral",
    name: "Strategic Referral Partners",
    audience: "Attorneys, brokers, translators, apostille & fingerprint providers, partners",
    primaryCta: "Apply to Alliance",
    models: ["referral_attribution", "partner_execution"],
    reusesVertical: "referrals (lib/referrals) + alliance",
    publicServiceRoute: "/partners",
  },
  {
    channel: "executive_concierge",
    name: "Premium Executive Concierge Execution",
    audience: "Executives, founders, family offices, private & high-net-worth clients",
    primaryCta: "Request Executive Review",
    models: ["priority_fee", "urgent_response", "after_hours", "annual_agreement"],
    reusesVertical: "high-value-assets (private client)",
    publicServiceRoute: "/services/executive-concierge-document-execution",
  },
];

export function getRevenueChannel(channel: RevenueChannel): RevenueChannelConfig | null {
  return REVENUE_CHANNELS.find((c) => c.channel === channel) ?? null;
}
