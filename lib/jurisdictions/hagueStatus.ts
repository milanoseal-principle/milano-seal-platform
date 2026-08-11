import { COUNTRY_JURISDICTION_REGISTRY } from "./countryRegistry";
export function getHagueStatus(slug: string) { return COUNTRY_JURISDICTION_REGISTRY.find((country) => country.slug === slug)?.hagueStatus ?? "Verify"; }
