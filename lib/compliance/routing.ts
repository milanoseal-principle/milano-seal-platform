import { getCountryBySlug } from "./countries";
import { getDocumentBySlug } from "./documents";
import { buildCountryDocumentRoute, type CountryDocumentRoute } from "./countryDocumentMatrix";

export interface ExecutionRouteResult {
  found: boolean;
  route?: CountryDocumentRoute;
  summary?: string;
  disclaimer: string;
}

const DISCLAIMER =
  "The Milano Seal provides document coordination, notarization support, apostille/authentication routing review, courier custody, and release support. International use remains subject to destination-country, receiving-authority, document-type, and signer-location requirements. This assistant does not provide legal advice or guarantee foreign acceptance.";

export function evaluateExecutionRoute(
  countrySlug: string,
  documentSlug: string
): ExecutionRouteResult {
  const country = getCountryBySlug(countrySlug);
  const document = getDocumentBySlug(documentSlug);

  if (!country || !document) {
    return { found: false, disclaimer: DISCLAIMER };
  }

  const route = buildCountryDocumentRoute(country, document);

  const summaries: Record<string, string> = {
    "notarize-only": `${document.name} for ${country.name} requires notarization. No apostille is required for this document type.`,
    "notarize-apostille": `${document.name} for ${country.name} requires notarization followed by state apostille through the Florida Secretary of State.`,
    "notarize-apostille-translate": `${document.name} for ${country.name} requires notarization, state apostille, and certified translation into ${country.primaryLanguage}.`,
    "certified-copy-apostille": `${document.name} for ${country.name} requires a certified copy from the issuing authority, followed by state apostille.`,
    "certified-copy-apostille-translate": `${document.name} for ${country.name} requires a certified copy, state apostille, and certified translation into ${country.primaryLanguage}.`,
    "consular-legalization": `${country.name} is not a Hague Convention member. ${document.name} requires consular legalization rather than a standard apostille.`,
    "federal-apostille": `${document.name} for ${country.name} requires federal-level authentication through the US Department of State.`,
  };

  return {
    found: true,
    route,
    summary: summaries[route.routePath],
    disclaimer: DISCLAIMER,
  };
}
