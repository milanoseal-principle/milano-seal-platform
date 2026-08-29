import type { LocalizedSeoRecord, SupportedSeoLocale } from "./types";

const RESERVED_LOCALIZED_ROUTES: Array<[SupportedSeoLocale, string, string]> = [
  ["it-IT", "/it/apostille-documenti-usa", "/services/us-documents-abroad"],
  ["it-IT", "/it/procura-apostille-stati-uniti", "/documents/power-of-attorney-apostille"],
  ["it-IT", "/it/servizi-documenti-usa-per-avvocati", "/professional"],
  ["es-ES", "/es/apostilla-documentos-estados-unidos", "/services/us-documents-abroad"],
  ["es-ES", "/es/poder-notarial-apostilla-estados-unidos", "/documents/power-of-attorney-apostille"],
  ["es-ES", "/es/servicios-documentos-usa-abogados", "/professional"],
  ["pt-BR", "/pt/apostila-documentos-estados-unidos", "/services/us-documents-abroad"],
  ["pt-BR", "/pt/procuracao-apostila-estados-unidos", "/documents/power-of-attorney-apostille"],
];

/** Route reservations only. They produce no public route or hreflang until reviewed. */
export const LOCALIZED_SEO_RECORDS: LocalizedSeoRecord[] = RESERVED_LOCALIZED_ROUTES.map(
  ([locale, path, englishEquivalent]) => ({
    locale,
    path,
    englishEquivalent,
    title: "",
    description: "",
    h1: "",
    bodySections: {},
    translationStatus: "HUMAN_REVIEW_REQUIRED",
    indexationState: "approved_noindex",
  }),
);
