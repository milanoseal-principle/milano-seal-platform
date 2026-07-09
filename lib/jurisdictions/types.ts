export type HagueStatus = "Hague" | "Non-Hague" | "Verify";
export interface CountryJurisdictionRecord { slug: string; name: string; hagueStatus: HagueStatus; translationRequired: string; processingNote: string; manualReviewFlags: string[]; }
