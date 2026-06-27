import { DESTINATIONS } from "@/data/destinations";
import { getCountryExecutionIntelligence } from "@/data/country-execution-intelligence";

export type CountryRoleAudience =
  | "client"
  | "international_lawyer"
  | "foreign_counsel"
  | "us_counsel"
  | "private_client_advisor"
  | "family_office"
  | "yacht_broker"
  | "luxury_real_estate"
  | "equine_bloodstock"
  | "gemstone_diamond_jewelry"
  | "alliance_notary"
  | "virtual_assistant"
  | "operator";

export type CountryRoleUseCase = {
  countrySlug: string;
  audience: CountryRoleAudience;
  headline: string;
  howTheyUseMilanoSeal: string;
  documentsLikelyHandled: string[];
  clientInputsNeeded: string[];
  riskFlags: string[];
  publicCtaLabel: string;
  publicCtaHref: string;
  privateNextStep?: string;
};

const REQUIRED_AUDIENCES: CountryRoleAudience[] = [
  "client",
  "international_lawyer",
  "alliance_notary",
  "virtual_assistant",
  "operator",
  "foreign_counsel",
  "us_counsel",
  "private_client_advisor",
  "family_office",
  "yacht_broker",
  "luxury_real_estate",
  "equine_bloodstock",
  "gemstone_diamond_jewelry",
];

const DEFAULT_DOCUMENTS = ["Power of attorney", "Affidavit", "Corporate authorization", "Civil record"];
const DEFAULT_INPUTS = ["Destination country", "Receiving authority", "Document type", "Signer location", "Deadline"];

function headline(country: string, audience: CountryRoleAudience) {
  const labels: Record<CountryRoleAudience, string> = {
    client: `${country} private-client document execution`,
    international_lawyer: `${country} international counsel coordination`,
    foreign_counsel: `${country} receiving-counsel execution support`,
    us_counsel: `${country} outbound U.S. document support`,
    private_client_advisor: `${country} private-client advisor document control`,
    family_office: `${country} family office release coordination`,
    yacht_broker: `${country} yacht and maritime document execution`,
    luxury_real_estate: `${country} luxury real estate document release`,
    equine_bloodstock: `${country} equine and bloodstock document coordination`,
    gemstone_diamond_jewelry: `${country} gemstone, diamond, and jewelry document routing`,
    alliance_notary: `${country} alliance notary intake support`,
    virtual_assistant: `${country} VA follow-up and record support`,
    operator: `${country} operator-grade route review`,
  };
  return labels[audience];
}

function usage(country: string, audience: CountryRoleAudience) {
  if (country === "Brazil" && (audience === "international_lawyer" || audience === "foreign_counsel" || audience === "us_counsel")) {
    return "Brazilian attorneys and cross-border counsel can use The Milano Seal to coordinate U.S.-origin powers of attorney, affidavits, corporate authorizations, and private-client documents for notarization, apostille/authentication routing, controlled release, and tracked delivery.";
  }
  if (country === "Italy" && audience === "yacht_broker") {
    return "Italian yacht brokers and maritime transaction teams can use The Milano Seal to coordinate U.S.-origin vessel bills of sale, ownership declarations, seller authorizations, powers of attorney, and corporate documents that need controlled execution and international delivery.";
  }
  if (audience === "virtual_assistant") {
    return `Virtual assistants can support ${country} matters by confirming client inputs, monitoring missing records, and escalating receiving-authority questions without overriding payment or release controls.`;
  }
  if (audience === "operator") {
    return `Operators use The Milano Seal for ${country} matters to review notarial readiness, destination authority risk, route selection, payment gates, and custody-controlled release.`;
  }
  if (audience === "alliance_notary") {
    return `Alliance notaries can route ${country} document inquiries into controlled Milano Seal intake and coordinate client-safe handoff without changing payment or release gates.`;
  }
  return `${headline(country, audience)} uses The Milano Seal to coordinate U.S.-origin documents for notarization readiness, apostille/authentication routing, receiving-authority review, controlled release, and tracked delivery.`;
}

function buildUseCases(destination: (typeof DESTINATIONS)[number]): CountryRoleUseCase[] {
  const intelligence = getCountryExecutionIntelligence(destination.slug, destination.name);
  return REQUIRED_AUDIENCES.map((audience) => ({
    countrySlug: destination.slug,
    audience,
    headline: headline(intelligence.displayName, audience),
    howTheyUseMilanoSeal: usage(intelligence.displayName, audience),
    documentsLikelyHandled: audience === "yacht_broker"
      ? ["Vessel bill of sale", "Ownership declaration", "Seller authorization", "Power of attorney"]
      : DEFAULT_DOCUMENTS,
    clientInputsNeeded: DEFAULT_INPUTS,
    riskFlags: intelligence.executionFlags,
    publicCtaLabel: audience === "alliance_notary" ? "Apply for Alliance Access" : "Start Controlled Intake",
    publicCtaHref: audience === "alliance_notary" ? "/alliance/apply" : `/intake?destination=${destination.slug}`,
    privateNextStep: audience === "operator" || audience === "virtual_assistant" ? "Review private checklist in dashboard." : undefined,
  }));
}

export const COUNTRY_ROLE_USE_CASES: CountryRoleUseCase[] = DESTINATIONS.flatMap(buildUseCases);

export function getCountryRoleUseCases(countrySlug: string): CountryRoleUseCase[] {
  return COUNTRY_ROLE_USE_CASES.filter((useCase) => useCase.countrySlug === countrySlug);
}

export function getCountryRoleUseCase(countrySlug: string, audience: CountryRoleAudience): CountryRoleUseCase | undefined {
  return COUNTRY_ROLE_USE_CASES.find((useCase) => useCase.countrySlug === countrySlug && useCase.audience === audience);
}
