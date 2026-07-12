import type { AcquisitionSignal } from "./types";
export function scoreLead(signal: AcquisitionSignal): number { return Math.min(100, Math.max(0, signal.score)); }
export const ACQUISITION_SIGNALS: AcquisitionSignal[] = [
  { id: "italy-intake", label: "Italy document intake", stage: "intake", audience: "country", score: 72, nextAction: "Route to Secure Records Intake and verify destination requirements.", safetyNote: "No guaranteed outcome copy." },
  { id: "airport-emergency", label: "Airport-area emergency execution", stage: "founder_review", audience: "airport_emergency", score: 88, nextAction: "Founder review for timing, availability, and restricted-area safety language.", safetyNote: "No travel clearance or airline approval claims." },
];
