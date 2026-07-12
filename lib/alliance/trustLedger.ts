import type { TrustLedgerEvent } from "./types";

export const TRUST_LEDGER_EVENT_TYPES: TrustLedgerEvent[] = [
  { type: "application", description: "Applicant submitted profile and service coverage.", immutable: true },
  { type: "training", description: "Training activity completed or assigned.", immutable: true, improvesScore: true },
  { type: "meeting", description: "Onboarding, review, or strategy meeting recorded.", immutable: true },
  { type: "referral", description: "Referral or routing opportunity logged without assignment guarantee.", immutable: true },
  { type: "assignment", description: "Matter assigned to a verified partner.", immutable: true, improvesScore: true },
  { type: "completed_matter", description: "Matter completed and closed with QA notes.", immutable: true, improvesScore: true },
  { type: "qa_review", description: "Execution quality review completed.", immutable: true, improvesScore: true },
  { type: "lesson_learned", description: "Operational lesson retained for future improvement.", immutable: true },
  { type: "client_feedback", description: "Client or operator feedback recorded.", immutable: true, improvesScore: true },
  { type: "dispute_resolution", description: "Issue, correction, or resolution event recorded.", immutable: true },
  { type: "performance_review", description: "Periodic partner performance review completed.", immutable: true, improvesScore: true }
];

export const TRUST_LEDGER_RULES = [
  "Nothing is overwritten.",
  "Everything is versioned.",
  "Every completed matter strengthens the Intelligence Platform.",
  "Sensitive client details must be minimized and protected.",
  "Ledger entries support operational learning and dispatch quality."
] as const;
