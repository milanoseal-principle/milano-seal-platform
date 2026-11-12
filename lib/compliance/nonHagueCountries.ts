import { HCCH_APOSTILLE_SOURCE, hcchParty } from "@/lib/treaty/hcchApostilleStatus";

export interface NonHagueCountry {
  iso2: string;
  iso3: string;
  name: string;
  legalizationPath: 'consular_legalization' | 'operator_review_required';
  notes?: string;
}

const LEGALIZATION_DESTINATIONS: NonHagueCountry[] = [
  { iso2: "CN", iso3: "CHN", name: "China", legalizationPath: "consular_legalization" },
  { iso2: "VN", iso3: "VNM", name: "Vietnam", legalizationPath: "consular_legalization" },
  { iso2: "SA", iso3: "SAU", name: "Saudi Arabia", legalizationPath: "operator_review_required" },
  { iso2: "KW", iso3: "KWT", name: "Kuwait", legalizationPath: "operator_review_required" },
  { iso2: "QA", iso3: "QAT", name: "Qatar", legalizationPath: "operator_review_required" },
  { iso2: "EG", iso3: "EGY", name: "Egypt", legalizationPath: "consular_legalization" },
  { iso2: "JO", iso3: "JOR", name: "Jordan", legalizationPath: "consular_legalization" },
  { iso2: "PK", iso3: "PAK", name: "Pakistan", legalizationPath: "consular_legalization" },
  { iso2: "BD", iso3: "BGD", name: "Bangladesh", legalizationPath: "consular_legalization" },
  { iso2: "ID", iso3: "IDN", name: "Indonesia", legalizationPath: "consular_legalization" },
  { iso2: "TH", iso3: "THA", name: "Thailand", legalizationPath: "consular_legalization" },
  { iso2: "MY", iso3: "MYS", name: "Malaysia", legalizationPath: "consular_legalization" },
  { iso2: "PH", iso3: "PHL", name: "Philippines", legalizationPath: "consular_legalization" },
  { iso2: "NG", iso3: "NGA", name: "Nigeria", legalizationPath: "consular_legalization" },
  { iso2: "KE", iso3: "KEN", name: "Kenya", legalizationPath: "consular_legalization" },
  { iso2: "ET", iso3: "ETH", name: "Ethiopia", legalizationPath: "operator_review_required" },
  { iso2: "IQ", iso3: "IRQ", name: "Iraq", legalizationPath: "operator_review_required" },
  { iso2: "IR", iso3: "IRN", name: "Iran", legalizationPath: "operator_review_required" },
  { iso2: "LY", iso3: "LBY", name: "Libya", legalizationPath: "operator_review_required" },
];

// Only destinations the canonical HCCH registry does not list as a Contracting Party in force at
// its last official verification. Entries that have since joined the Convention drop out here
// automatically, so this list can never contradict the registry.
export const nonHagueCountries: NonHagueCountry[] = LEGALIZATION_DESTINATIONS.filter((country) => {
  const party = hcchParty(country.iso2);
  return !party || party.entryIntoForce > HCCH_APOSTILLE_SOURCE.verifiedAt;
});
