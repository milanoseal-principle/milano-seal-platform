export interface StateAuthority {
  state: string;
  slug: string;
  iso2: string;
  competentAuthority: string;
  requiresPriorCertification: boolean;
  operatorReviewRequired: boolean;
  processingDisclaimer: string;
}

const STD = "Processing times vary by state authority and current workload.";

export const usApostilleAuthorities: StateAuthority[] = [
  { state: "Alabama", slug: "alabama", iso2: "AL", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Alaska", slug: "alaska", iso2: "AK", competentAuthority: "Lieutenant Governor", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Arizona", slug: "arizona", iso2: "AZ", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Arkansas", slug: "arkansas", iso2: "AR", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "California", slug: "california", iso2: "CA", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Colorado", slug: "colorado", iso2: "CO", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Connecticut", slug: "connecticut", iso2: "CT", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Delaware", slug: "delaware", iso2: "DE", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  {
    state: "District of Columbia",
    slug: "district-of-columbia",
    iso2: "DC",
    competentAuthority: "Office of the Secretary, District of Columbia",
    requiresPriorCertification: true,
    operatorReviewRequired: false,
    processingDisclaimer: STD,
  },
  {
    state: "Florida",
    slug: "florida",
    iso2: "FL",
    competentAuthority: "Secretary of State (Division of Corporations)",
    requiresPriorCertification: true,
    operatorReviewRequired: false,
    processingDisclaimer: "Processing times vary by state authority and current workload. Vital records (birth, death, marriage certificates) require prior certification from the Florida Department of Health before apostille submission.",
  },
  { state: "Georgia", slug: "georgia", iso2: "GA", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Hawaii", slug: "hawaii", iso2: "HI", competentAuthority: "Lieutenant Governor", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Idaho", slug: "idaho", iso2: "ID", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Illinois", slug: "illinois", iso2: "IL", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Indiana", slug: "indiana", iso2: "IN", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Iowa", slug: "iowa", iso2: "IA", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Kansas", slug: "kansas", iso2: "KS", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Kentucky", slug: "kentucky", iso2: "KY", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Louisiana", slug: "louisiana", iso2: "LA", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Maine", slug: "maine", iso2: "ME", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Maryland", slug: "maryland", iso2: "MD", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Massachusetts", slug: "massachusetts", iso2: "MA", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Michigan", slug: "michigan", iso2: "MI", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Minnesota", slug: "minnesota", iso2: "MN", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Mississippi", slug: "mississippi", iso2: "MS", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Missouri", slug: "missouri", iso2: "MO", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Montana", slug: "montana", iso2: "MT", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Nebraska", slug: "nebraska", iso2: "NE", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Nevada", slug: "nevada", iso2: "NV", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "New Hampshire", slug: "new-hampshire", iso2: "NH", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "New Jersey", slug: "new-jersey", iso2: "NJ", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "New Mexico", slug: "new-mexico", iso2: "NM", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "New York", slug: "new-york", iso2: "NY", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "North Carolina", slug: "north-carolina", iso2: "NC", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "North Dakota", slug: "north-dakota", iso2: "ND", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Ohio", slug: "ohio", iso2: "OH", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Oklahoma", slug: "oklahoma", iso2: "OK", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Oregon", slug: "oregon", iso2: "OR", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Pennsylvania", slug: "pennsylvania", iso2: "PA", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Rhode Island", slug: "rhode-island", iso2: "RI", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "South Carolina", slug: "south-carolina", iso2: "SC", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "South Dakota", slug: "south-dakota", iso2: "SD", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Tennessee", slug: "tennessee", iso2: "TN", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Texas", slug: "texas", iso2: "TX", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Utah", slug: "utah", iso2: "UT", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Vermont", slug: "vermont", iso2: "VT", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Virginia", slug: "virginia", iso2: "VA", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Washington", slug: "washington", iso2: "WA", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "West Virginia", slug: "west-virginia", iso2: "WV", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Wisconsin", slug: "wisconsin", iso2: "WI", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
  { state: "Wyoming", slug: "wyoming", iso2: "WY", competentAuthority: "Secretary of State", requiresPriorCertification: true, operatorReviewRequired: false, processingDisclaimer: STD },
];
