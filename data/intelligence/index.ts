export type { Country, DocumentType, RejectionTrigger, Workflow } from "./types";
export { COUNTRIES } from "./countries";
export { DOCUMENT_TYPES } from "./documents";
export { WORKFLOWS } from "./workflows";

import { COUNTRIES } from "./countries";
import { DOCUMENT_TYPES } from "./documents";
import { WORKFLOWS } from "./workflows";
import type { Country, DocumentType, Workflow } from "./types";

export function getAllCountries(): Country[] {
  return COUNTRIES;
}

export function getAllDocumentTypes(): DocumentType[] {
  return DOCUMENT_TYPES;
}

export function getCountry(id: string): Country | undefined {
  return COUNTRIES.find((c) => c.id === id);
}

export function getDocumentType(id: string): DocumentType | undefined {
  return DOCUMENT_TYPES.find((d) => d.id === id);
}

export function getWorkflowsForCountry(countryId: string): Workflow[] {
  return WORKFLOWS.filter((w) => w.countryId === countryId);
}

export function getWorkflow(countryId: string, documentId: string): Workflow | undefined {
  return WORKFLOWS.find(
    (w) => w.countryId === countryId && w.documentId === documentId
  );
}
