import type { OpportunitySignal } from "./types";

export const GOVERNMENT_OPPORTUNITY_SIGNALS: OpportunitySignal[] = [
  { id: "county-vendor", source: "County procurement", description: "Vendor registration, ITQ, RFP, or RFQ opportunity that maps to document execution, records support, courier coordination, or administrative services.", action: "Review fit, no-bid unrelated categories, prepare capability package." },
  { id: "airport-authority", source: "Airport authority", description: "Airport, travel, executive, or emergency document coordination opportunity.", action: "Map to airport operations, RON, courier, and emergency document workflows." },
  { id: "healthcare-public", source: "Public healthcare", description: "Hospital, facility, directive, patient authorization, or records workflow opportunity.", action: "Apply healthcare execution vertical and facility-access safeguards." },
  { id: "university", source: "University or school system", description: "Credential, registrar, international records, or public institution documentation opportunity.", action: "Map to education credential and apostille workflows." },
  { id: "emergency", source: "Emergency management", description: "Disaster response, continuity, administrative support, affidavits, and records coordination opportunity.", action: "Use operational readiness and response-time language without guaranteed deployment." }
];

export const GOVERNMENT_CENTER_CAPABILITIES = [
  "Vendor registrations",
  "Capability statements",
  "NAICS / NIGP / UNSPSC mapping",
  "Bid alerts",
  "Proposal support",
  "Grant alerts",
  "Contract renewals",
  "Agency intelligence",
  "Pricing strategy",
  "Compliance checklist support"
] as const;
