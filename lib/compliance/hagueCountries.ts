import { HCCH_APOSTILLE_SOURCE, HCCH_CONTRACTING_PARTIES } from "@/lib/treaty/hcchApostilleStatus";

export interface HagueCountry {
  iso2: string;
  name: string;
  hagueEntryDate?: string;
  operatorReviewRequired: boolean;
  notes?: string;
}

// A view of the canonical HCCH registry (lib/treaty/hcchApostilleStatus.ts); never edited by hand.
// Lists the Contracting Parties for which the Convention was in force at the last official
// verification. Membership alone does not decide a country pair: see evaluateApostilleRelationship.
export const hagueCountries: HagueCountry[] = HCCH_CONTRACTING_PARTIES
  .filter((party) => party.entryIntoForce <= HCCH_APOSTILLE_SOURCE.verifiedAt)
  .map((party) => ({ iso2: party.iso2, name: party.name, hagueEntryDate: party.entryIntoForce, operatorReviewRequired: party.hasDeclarations }));
