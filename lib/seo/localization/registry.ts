import type { LocalizedSeoRecord } from "./types";

// Phase-one route reservations remain fail-closed until complete human-reviewed copy is supplied.
export const LOCALIZED_SEO_RECORDS: LocalizedSeoRecord[] = [
  ["it-IT", "/it/apostille-documenti-usa", "/services/us-documents-abroad"],
  ["it-IT", "/it/procura-apostille-stati-uniti", "/documents/power-of-attorney-apostille"],
  ["it-IT", "/it/servizi-documenti-usa-per-avvocati", "/professional"],
  ["es-ES", "/es/apostilla-documentos-estados-unidos", "/services/us-documents-abroad"],
  ["es-ES", "/es/poder-notarial-apostilla-estados-unidos", "/documents/power-of-attorney-apostille"],
  ["es-ES", "/es/servicios-documentos-usa-abogados", "/professional"],
  ["pt-BR", "/pt/apostila-documentos-estados-unidos", "/services/us-documents-abroad"],
  ["pt-BR", "/pt/procuracao-apostila-estados-unidos", "/documents/power-of-attorney-apostille"],
].map(([locale, path, englishEquivalent]) => ({
  locale,
  path,
  englishEquivalent,
  title: "",
  description: "",
  h1: "",
  bodySections: {},
  ctaLabel: "",
  englishVersionLabel: "",
  legalBoundary: "",
  translationStatus: "HUMAN_REVIEW_REQUIRED",
  indexStatus: "NOINDEX",
})) as LocalizedSeoRecord[];
