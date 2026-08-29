import { getCountryBySlug } from "@/lib/compliance/countries";
import type { SeoPillar } from "../authority/types";
import type { CountryDocumentSeoRecord } from "./types";

const matrix = {
  italy: ["power-of-attorney", "vital-records", "affidavits", "corporate-documents", "fbi-background-check", "citizenship-records", "inheritance-estate"],
  spain: ["power-of-attorney", "vital-records", "corporate-documents", "affidavits", "inheritance-estate"],
  mexico: ["power-of-attorney", "corporate-documents", "vital-records", "affidavits"],
  brazil: ["power-of-attorney", "corporate-documents", "vital-records"],
  portugal: ["power-of-attorney", "vital-records", "citizenship-records", "inheritance-estate"],
  germany: ["corporate-documents", "vital-records", "power-of-attorney"],
  france: ["power-of-attorney", "corporate-documents", "inheritance-estate"],
  switzerland: ["corporate-documents", "power-of-attorney", "private-client-documents"],
  canada: ["corporate-documents", "vital-records", "power-of-attorney"],
} as const;

const documents: Record<string, { name: string; pillar: SeoPillar; purpose: string; execution: string }> = {
  "power-of-attorney": { name: "Power of Attorney", pillar: "power_of_attorney", purpose: "delegating authority for a property, corporate, estate, or private matter", execution: "Confirm the requested form, signer capacity, acknowledgment, witnesses, and original-document posture before execution." },
  "vital-records": { name: "Vital Records", pillar: "vital_records", purpose: "citizenship, civil-status, family, immigration, or estate use", execution: "Identify the issuing state and obtain the form of certified record eligible for the applicable authority path." },
  affidavits: { name: "Affidavits", pillar: "affidavits", purpose: "sworn identity, status, factual, or supporting statements", execution: "Confirm the required declaration, notarial act, signer identity, and any witness or exhibit requirements." },
  "corporate-documents": { name: "Corporate Documents", pillar: "corporate_documents", purpose: "entity formation, authority, transaction, banking, or regulatory use", execution: "Separate state-issued entity records from privately executed resolutions, certificates, and signatory documents." },
  "fbi-background-check": { name: "FBI Background Check", pillar: "apostille_authentication", purpose: "citizenship, immigration, licensing, employment, or residence use", execution: "Confirm that the record is federally issued; federal and state records do not share the same competent-authority path." },
  "citizenship-records": { name: "Citizenship Records", pillar: "vital_records", purpose: "citizenship recognition, descent, registration, or civil-status proceedings", execution: "Inventory every issuing jurisdiction and distinguish certified public records from supporting private statements." },
  "inheritance-estate": { name: "Inheritance and Estate Documents", pillar: "international_document_execution", purpose: "probate, succession, property, fiduciary, or beneficiary matters", execution: "Classify court records, vital records, powers, and private declarations separately before selecting any authority path." },
  "private-client-documents": { name: "Private Client and Fiduciary Documents", pillar: "chain_of_custody", purpose: "fiduciary, wealth, family-office, banking, or private-client administration", execution: "Confirm signer authority, confidentiality needs, document origin, and the receiving institution's requested format." },
};

const countryFacts: Record<string, string> = {
  italy: "Italian communes, courts, notaries, consulates, and professional recipients may request different wording, originals, translations, or supporting records.",
  spain: "Spanish civil, notarial, property, and commercial recipients may apply matter-specific form and translation requirements.",
  mexico: "Mexican notarial, civil-registry, property, and corporate recipients should confirm the required original, translation, and presentation format.",
  brazil: "Brazilian notarial, registry, court, and corporate recipients may require Portuguese translation and destination-side formalities.",
  portugal: "Portuguese civil, notarial, property, and citizenship recipients should confirm current record and translation requirements.",
  germany: "German courts, registries, notaries, and commercial recipients may impose matter-specific form and German-language requirements.",
  france: "French civil, notarial, estate, and corporate recipients should confirm document form, translation, and recency requirements.",
  switzerland: "Swiss cantonal, notarial, banking, and fiduciary recipients may differ by canton, institution, language, and transaction.",
  canada: "Canadian federal, provincial, professional, and private recipients may differ by province, document origin, and intended use.",
};

export const COUNTRY_DOCUMENT_SEO_RECORDS: CountryDocumentSeoRecord[] = Object.entries(matrix).flatMap(([countrySlug, slugs]) => {
  const country = getCountryBySlug(countrySlug);
  if (!country) throw new Error(`Missing canonical country record: ${countrySlug}`);
  return slugs.map((documentSlug) => {
    const doc = documents[documentSlug];
    const siblings = slugs.filter((slug) => slug !== documentSlug).slice(0, 3);
    return {
      countrySlug, documentSlug, documentName: doc.name,
      primaryQuery: `US ${doc.name.toLowerCase()} apostille ${country.name}`,
      secondaryQueries: [`U.S. ${doc.name.toLowerCase()} for use in ${country.name}`, `${doc.name} document execution ${country.name}`],
      audience: documentSlug === "corporate-documents" ? ["law_firm", "business", "professional_advisor"] : ["private_client", "international_attorney", "professional_advisor"],
      pillar: doc.pillar,
      title: `U.S. ${doc.name} Apostille for ${country.name} | The Milano Seal™`,
      description: `Coordinate U.S. ${doc.name.toLowerCase()} execution, authentication routing, and controlled international release for use in ${country.name}, subject to document origin and receiving-authority requirements.`,
      h1: `U.S. ${doc.name} Execution and Apostille for ${country.name}`,
      intro: `U.S. ${doc.name.toLowerCase()} intended for ${country.name} require an origin-first review before any apostille or authentication route is selected. This route supports ${doc.purpose}. ${countryFacts[countrySlug]}`,
      commonUseCases: [doc.purpose, `Professional coordination with a ${country.name} receiving authority`, "Controlled international release after route review"],
      executionQuestions: [doc.execution, "Which U.S. state or federal authority issued or will receive the document?", "Is an original, certified copy, or privately executed instrument required?"],
      receivingAuthorityQuestions: [`Which authority or professional in ${country.name} will receive the document?`, "Has that recipient confirmed wording, recency, translation, copy, and delivery requirements?", "Does the recipient require any destination-side step after U.S. authentication?"],
      rejectionRiskChecks: ["Document origin and competent authority do not align", "Signer, notarial certificate, certified-copy, or issuance format is incomplete", "Translation, recency, attachment, or receiving-format instructions remain unconfirmed"],
      relatedDocumentSlugs: siblings,
      relatedCountrySlugs: Object.keys(matrix).filter((slug) => slug !== countrySlug && matrix[slug as keyof typeof matrix].includes(documentSlug as never)).slice(0, 4),
      evidenceIds: documentSlug === "fbi-background-check" ? ["hcch-apostille-status", "us-authentications"] : ["hcch-apostille-status", "florida-apostille"],
      indexStatus: "INDEXABLE" as const,
    };
  });
});

export const getCountryDocumentSeoRecord = (country: string, document: string) => COUNTRY_DOCUMENT_SEO_RECORDS.find((record) => record.countrySlug === country && record.documentSlug === document);
export const getCountryDocumentPath = (record: Pick<CountryDocumentSeoRecord, "countrySlug" | "documentSlug">) => `/apostille/${record.countrySlug}/${record.documentSlug}`;
