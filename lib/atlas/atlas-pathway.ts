import {
  getAtlasCountry,
  getAtlasCountries,
  getPrimaryAtlasCountries,
  type AtlasCountry,
} from "./atlas-countries";

export { getAtlasCountry, getAtlasCountries, getPrimaryAtlasCountries };
export type { AtlasCountry };

// Returns the public-facing pathway label for a country.
export function getCountryPathwayLabel(country: AtlasCountry): string {
  if (country.apostillePathway === "apostille") return "Hague Apostille Pathway";
  if (country.apostillePathway === "legalization") return "Consular Legalization Required";
  return "Destination-Specific Review";
}

// Returns the operator-facing route status string.
export function getCountryRouteStatus(country: AtlasCountry): string {
  if (country.hagueStatus === "hague") return "Hague Convention Member";
  if (country.hagueStatus === "non_hague") return "Non-Hague — Legalization Chain";
  return "Status Under Review";
}

// Returns the client-safe country summary (never includes operatorSummary).
export function getClientSafeCountrySummary(country: AtlasCountry): string {
  return country.clientSafeSummary;
}

// Returns the client-safe summary by slug — undefined if country not found.
export function getClientSafeCountrySummaryBySlug(slug: string): string | undefined {
  const c = getAtlasCountry(slug);
  return c ? c.clientSafeSummary : undefined;
}

// Returns the intake href with destination prefilled.
export function getIntakeHref(country: AtlasCountry): string {
  return country.intakeHref;
}

// Returns the authority/country page href.
export function getAuthorityHref(country: AtlasCountry): string {
  return country.authorityHref;
}

// Normalizes common country name variants to a slug.
// Used for matching destination_country strings from DB or intake params.
const NAME_TO_SLUG: Record<string, string> = {
  "italy": "italy",
  "greece": "greece",
  "portugal": "portugal",
  "spain": "spain",
  "uae": "uae",
  "united arab emirates": "uae",
  "france": "france",
  "germany": "germany",
  "brazil": "brazil",
  "mexico": "mexico",
  "united kingdom": "united-kingdom",
  "uk": "united-kingdom",
  "canada": "canada",
  "colombia": "colombia",
  "chile": "chile",
  "argentina": "argentina",
  "australia": "australia",
  "ireland": "ireland",
  "netherlands": "netherlands",
  "switzerland": "switzerland",
  "austria": "austria",
  "belgium": "belgium",
  "india": "india",
  "japan": "japan",
  "south africa": "south-africa",
};

export function countryNameToSlug(name: string): string | undefined {
  return NAME_TO_SLUG[name.toLowerCase().trim()];
}

// Looks up an AtlasCountry from a display name string (e.g. from DB destination_country field).
export function getAtlasCountryByName(name: string): AtlasCountry | undefined {
  const slug = countryNameToSlug(name);
  return slug ? getAtlasCountry(slug) : undefined;
}

// Returns operator pathway signals for a given destination country.
// Safe for dashboard only — never expose to client surfaces.
export function getOperatorAtlasSignals(destinationCountry: string | null): {
  pathwayLabel: string | null;
  routeStatus: string | null;
  translationLikely: boolean | null;
  ronLikelihood: string | null;
} {
  if (!destinationCountry) return { pathwayLabel: null, routeStatus: null, translationLikely: null, ronLikelihood: null };
  const c = getAtlasCountryByName(destinationCountry);
  if (!c) return { pathwayLabel: null, routeStatus: null, translationLikely: null, ronLikelihood: null };
  return {
    pathwayLabel: getCountryPathwayLabel(c),
    routeStatus: getCountryRouteStatus(c),
    translationLikely: c.translationLikely,
    ronLikelihood: c.ronLikelihood,
  };
}
