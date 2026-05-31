export type {
  Country,
  DocumentType,
  RejectionTrigger,
  Workflow,
  CorridorType,
  DocumentCategory,
  ClientDemographic,
  NotarizationType,
  RejectionSeverity,
  Region,
} from "./types";

export { COUNTRIES } from "./countries";
export { DOCUMENT_TYPES } from "./documents";
export { WORKFLOWS } from "./workflows";
export { deriveWorkflow } from "./derive";

import { COUNTRIES } from "./countries";
import { DOCUMENT_TYPES } from "./documents";
import { WORKFLOWS } from "./workflows";
import { deriveWorkflow } from "./derive";
import type {
  Country,
  DocumentType,
  Workflow,
  Region,
  ClientDemographic,
  DocumentCategory,
} from "./types";

// ── Basic lookups ──────────────────────────────────────────────────────────

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

// ── Workflow lookups ───────────────────────────────────────────────────────

export function getWorkflowsForCountry(countryId: string): Workflow[] {
  return WORKFLOWS.filter((w) => w.countryId === countryId);
}

export function getWorkflow(
  countryId: string,
  documentId: string
): Workflow | undefined {
  return WORKFLOWS.find(
    (w) => w.countryId === countryId && w.documentId === documentId
  );
}

/**
 * Returns the hand-authored workflow if one exists; otherwise derives a
 * workflow from the country and document properties.
 */
export function getWorkflowOrDerive(
  countryId: string,
  documentId: string
): Workflow | undefined {
  const country = getCountry(countryId);
  const document = getDocumentType(documentId);

  if (!country || !document) {
    return undefined;
  }

  const existing = getWorkflow(countryId, documentId);
  if (existing) {
    return existing;
  }

  return deriveWorkflow(country, document);
}

/**
 * Returns all hand-authored workflows plus derived workflows for every
 * country × document pair that does not already have a hand-authored entry.
 */
export function getAllWorkflowsOrDerived(): Workflow[] {
  const handAuthored = new Set(WORKFLOWS.map((w) => w.id));
  const derived: Workflow[] = [];

  for (const country of COUNTRIES) {
    for (const document of DOCUMENT_TYPES) {
      const id = `${country.id}-${document.id}`;
      if (!handAuthored.has(id)) {
        derived.push(deriveWorkflow(country, document));
      }
    }
  }

  return [...WORKFLOWS, ...derived];
}

// ── Country filters ────────────────────────────────────────────────────────

export function getCountriesByRegion(region: Region): Country[] {
  return COUNTRIES.filter((c) => c.region === region);
}

export function getCountriesByDemographic(
  demographic: ClientDemographic
): Country[] {
  return COUNTRIES.filter((c) => c.demographics.includes(demographic));
}

export function getHagueCountries(): Country[] {
  return COUNTRIES.filter((c) => c.corridorType === "hague");
}

export function getConsularCountries(): Country[] {
  return COUNTRIES.filter((c) => c.corridorType === "consular");
}

// ── Document filters ───────────────────────────────────────────────────────

export function getDocumentsByDemographic(
  demographic: ClientDemographic
): DocumentType[] {
  return DOCUMENT_TYPES.filter((d) => d.demographics.includes(demographic));
}

export function getDocumentsByCategory(
  category: DocumentCategory
): DocumentType[] {
  return DOCUMENT_TYPES.filter((d) => d.category === category);
}
