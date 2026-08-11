import type { TrustNetworkRevenueLine } from "./types";

export const TRUST_NETWORK_REVENUE_LINES: TrustNetworkRevenueLine[] = [
  { id: "member-license", label: "Membership license revenue", model: "license", description: "Recurring Trust Network license revenue from Seal Start, Seal Pro, and Seal Elite.", publicClaimSafe: true },
  { id: "partner-verification", label: "Partner verification fees", model: "application", description: "Application and review fees for Alliance verification workflows.", publicClaimSafe: true },
  { id: "routed-margin", label: "Routed matter margin", model: "margin", description: "Platform margin from eligible routed matters where Milano Seal controls intake, quote, payment, dispatch, QA, and release.", publicClaimSafe: true },
  { id: "training-office-hours", label: "Training and office hours", model: "service", description: "Paid implementation sessions, workshops, and office hours.", publicClaimSafe: true },
  { id: "capability-statements", label: "Capability statement creation", model: "service", description: "Government, healthcare, airport, attorney, and enterprise capability statement buildouts.", publicClaimSafe: true },
  { id: "government-setup", label: "Government vendor setup packages", model: "service", description: "Vendor readiness support, code mapping, procurement profile setup, and proposal templates.", publicClaimSafe: true },
  { id: "apostille-kits", label: "Apostille SOP kits", model: "service", description: "Workflow kits for state, federal, Hague, non-Hague, and embassy coordination.", publicClaimSafe: true },
  { id: "ron-readiness", label: "RON readiness packages", model: "service", description: "RON onboarding, readiness checklists, pricing setup, and session workflow support.", publicClaimSafe: true },
  { id: "directory-sponsorship", label: "Partner directory sponsorship", model: "sponsorship", description: "Sponsored visibility inside approved partner directories without guaranteed referrals.", publicClaimSafe: true },
  { id: "corridor-sponsorship", label: "International corridor sponsorship", model: "sponsorship", description: "Approved visibility for country, language, and corridor-specific partners.", publicClaimSafe: true },
  { id: "attorney-accounts", label: "Attorney referral accounts", model: "enterprise", description: "Professional account support for attorneys and firms requiring document execution coordination.", publicClaimSafe: true },
  { id: "enterprise-accounts", label: "Enterprise partner accounts", model: "enterprise", description: "Institutional and enterprise operating workflows, white-label deployments, and executive support.", publicClaimSafe: true }
];
