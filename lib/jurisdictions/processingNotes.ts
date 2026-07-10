import type { ProcessingNote } from "./types";
import { getCountryByIso } from "./countryRegistry";

// Operational processing / courier notes. Estimates are illustrative and NOT
// commitments. Unknown destinations default to manual review.

const PROCESSING_NOTES: ProcessingNote[] = [
  {
    destinationIso: "IT",
    courierNote: "Tracked international courier with custody handoff.",
    processingNote: "Estimate spans notarization through delivery; not a guarantee.",
    estimatedBusinessDays: 12,
    requiresManualReview: false,
  },
  {
    destinationIso: "ES",
    courierNote: "Tracked international courier.",
    processingNote: "Verify current authority turnaround before quoting.",
    estimatedBusinessDays: 12,
    requiresManualReview: false,
  },
  {
    destinationIso: "AE",
    courierNote: "Consular legalization steps may add courier legs.",
    processingNote: "Multi-step legalization — timeline uncertain, verify.",
    estimatedBusinessDays: null,
    requiresManualReview: true,
  },
];

export function getProcessingNote(destinationIso: string): ProcessingNote {
  const target = destinationIso.trim().toUpperCase();
  const found = PROCESSING_NOTES.find(
    (n) => n.destinationIso.toUpperCase() === target,
  );
  if (found) return found;

  const known = getCountryByIso(target);
  return {
    destinationIso: known?.iso ?? target,
    courierNote: "No sourced courier note — manual review required.",
    processingNote: "No sourced processing note — do not quote a timeline until verified.",
    estimatedBusinessDays: null,
    requiresManualReview: true,
  };
}

export function listProcessingNotes(): ProcessingNote[] {
  return [...PROCESSING_NOTES];
}
