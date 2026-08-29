import { DESTINATIONS } from "@/data/destinations";
import {
  DOCUMENT_TAXONOMY,
  getDocumentBySlug,
} from "@/lib/compliance/documents";
import { getPillar } from "@/lib/topical-authority/topicRegistry";
import type { SearchIntent } from "@/lib/topical-authority/types";
import type { CountryDocumentSeoRecord } from "./types";

const PHASE_ONE_MATRIX = {
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

type EditorialDocument = {
  name: string;
  canonicalSlug: string;
  pillarId: string;
  purpose: string;
  execution: string;
};

const EDITORIAL_DOCUMENTS: Record<string, EditorialDocument> = {
  "power-of-attorney": { name: "Power of Attorney", canonicalSlug: "power-of-attorney", pillarId: "pillar-poa-affidavits", purpose: "property, corporate, estate, or private-client authority", execution: "Confirm signer capacity, requested notarial act, witness posture, original requirements, and receiving-party instructions." },
  "vital-records": { name: "Vital Records", canonicalSlug: "birth-certificate", pillarId: "pillar-citizenship-civil", purpose: "citizenship, civil-status, family, immigration, or estate matters", execution: "Identify the record type and issuing jurisdiction, then confirm the certified-record format required for the applicable authority path." },
  affidavits: { name: "Affidavits", canonicalSlug: "affidavit", pillarId: "pillar-poa-affidavits", purpose: "identity, status, factual, or supporting statements", execution: "Confirm the declaration, notarial act, signer identity, exhibits, and any witness instructions without selecting unresolved requirements." },
  "corporate-documents": { name: "Corporate Documents", canonicalSlug: "corporate-documents", pillarId: "pillar-corporate-enterprise", purpose: "entity authority, transactions, banking, or regulatory matters", execution: "Separate state-issued entity records from privately executed resolutions, certificates, and signatory documents before routing." },
  "fbi-background-check": { name: "FBI Background Check", canonicalSlug: "background-check", pillarId: "pillar-apostille-authentication", purpose: "citizenship, immigration, licensing, employment, or residence matters", execution: "Confirm federal issuance. Federal and state background records do not share the same competent-authority path." },
  "citizenship-records": { name: "Citizenship Records", canonicalSlug: "birth-certificate", pillarId: "pillar-citizenship-civil", purpose: "citizenship recognition, descent, registration, or civil-status matters", execution: "Inventory each issuing jurisdiction and distinguish certified public records from supporting private statements." },
  "inheritance-estate": { name: "Inheritance and Estate Documents", canonicalSlug: "real-estate-documents", pillarId: "pillar-poa-affidavits", purpose: "probate, succession, property, fiduciary, or beneficiary matters", execution: "Classify court records, vital records, powers, and private declarations separately before selecting an authority path." },
  "private-client-documents": { name: "Private Client and Fiduciary Documents", canonicalSlug: "financial-documents", pillarId: "pillar-executive-family-office", purpose: "fiduciary, wealth, banking, or family-office administration", execution: "Confirm signer authority, confidentiality posture, document origin, and the receiving institution's requested format." },
};

const OFFICIAL_SOURCE_CANDIDATES = [
  "https://www.hcch.net/en/instruments/conventions/status-table/?cid=41",
  "https://travel.state.gov/content/travel/en/replace-certify-docs/authenticate-your-document.html",
  "https://dos.fl.gov/sunbiz/other-services/apostille-notarial-certification/",
] as const;

function requireDestination(slug: string) {
  const destination = DESTINATIONS.find((item) => item.slug === slug);
  if (!destination) throw new Error(`Phase-one SEO route has no canonical destination: ${slug}`);
  return destination;
}

function requireDocument(slug: string) {
  const document = getDocumentBySlug(slug);
  if (!document) throw new Error(`Phase-one SEO route has no canonical document: ${slug}`);
  return document;
}

export const COUNTRY_DOCUMENT_SEO_RECORDS: CountryDocumentSeoRecord[] = Object.entries(PHASE_ONE_MATRIX).flatMap(([countrySlug, slugs]) => {
  const destination = requireDestination(countrySlug);

  return slugs.map((documentSlug) => {
    const editorial = EDITORIAL_DOCUMENTS[documentSlug];
    const document = requireDocument(editorial.canonicalSlug);
    const path = `/apostille/${countrySlug}/${documentSlug}`;
    const title = `U.S. ${editorial.name} Apostille for ${destination.name} | The Milano Seal™`;
    const description = `Coordinate U.S. ${editorial.name.toLowerCase()} execution and authentication review for use in ${destination.name}, subject to document origin and receiving-authority requirements.`;
    const h1 = `U.S. ${editorial.name} Execution and Apostille for ${destination.name}`;
    const intro = `U.S. ${editorial.name.toLowerCase()} intended for ${destination.name} require an origin-first review before an apostille or authentication path can be confirmed. This editorial route addresses ${editorial.purpose}. It does not replace the receiving authority's instructions or the canonical Matter review.`;
    const commonUseCases = [editorial.purpose, `Professional coordination with a receiving party in ${destination.name}`, "Controlled international release after route review"];
    const executionQuestions = [editorial.execution, "Which U.S. jurisdiction or federal authority issued or will govern the document?", "Is an original, certified copy, or privately executed instrument requested?"];
    const receivingAuthorityQuestions = [`Which authority or professional in ${destination.name} will receive the document?`, "Has the recipient confirmed wording, recency, translation, copy, and delivery requirements?", "Is any destination-side step required after U.S. authentication?"];
    const rejectionRiskChecks = ["Document origin and competent authority do not align", "Signer, certificate, certified-copy, or issuance format is unresolved", "Translation, recency, attachment, or receiving-format instructions remain unconfirmed"];
    const renderedText = [title, description, h1, intro, ...commonUseCases, ...executionQuestions, ...receivingAuthorityQuestions, ...rejectionRiskChecks].join(" ");
    const primaryQuery = `US ${editorial.name.toLowerCase()} apostille ${destination.name}`;
    const topic = {
      id: `topic-country-document-${countrySlug}-${documentSlug}`,
      slug: `${countrySlug}-${documentSlug}`,
      name: `${editorial.name} for ${destination.name}`,
      pillarId: editorial.pillarId,
      contentType: "document" as const,
      searchIntent: "transactional" as SearchIntent,
      primaryRoute: path,
      internalLinkTargets: [getPillar(editorial.pillarId)?.primaryRoute ?? "/map", `/apostille/${countrySlug}`, `/professional/${countrySlug}`, "/global-document-intelligence", `/intake?destination=${countrySlug}&document_type=${documentSlug}`],
      canonicalSource: "atlas + canonical document taxonomy",
      status: "planned" as const,
    };

    return {
      id: `${countrySlug}:${documentSlug}`,
      countrySlug,
      documentSlug,
      canonicalDocumentSlug: document.slug,
      destination,
      document,
      topic,
      page: {
        slug: topic.slug,
        route: path,
        operatorApproved: false,
        quality: {
          hasVerifiedDocumentRecord: DOCUMENT_TAXONOMY.includes(document),
          hasVerifiedCountryRecord: DESTINATIONS.includes(destination),
          authoritySourceCount: 0,
          bodyLength: renderedText.length,
          internalLinkCount: topic.internalLinkTargets.length,
          hasCountrySpecificContent: true,
          hasDocumentSpecificContent: true,
          hasRejectionRisks: true,
          hasConversionPath: true,
          humanReviewed: false,
          sourcesReviewedAtEpochDays: null,
          nowEpochDays: Math.floor(Date.now() / 86_400_000),
          renderedText,
          duplicateIntent: false,
        },
      },
      primaryQuery,
      secondaryQueries: [`U.S. ${editorial.name.toLowerCase()} for use in ${destination.name}`, `${editorial.name} document execution ${destination.name}`],
      content: { title, description, h1, intro, commonUseCases, executionQuestions, receivingAuthorityQuestions, rejectionRiskChecks },
      relatedDocumentSlugs: slugs.filter((slug) => slug !== documentSlug).slice(0, 3),
      sourceCandidates: [...OFFICIAL_SOURCE_CANDIDATES],
    };
  });
});

export function getCountryDocumentSeoRecord(country: string, document: string) {
  return COUNTRY_DOCUMENT_SEO_RECORDS.find((record) => record.countrySlug === country && record.documentSlug === document);
}

export function getCountryDocumentPath(record: Pick<CountryDocumentSeoRecord, "countrySlug" | "documentSlug">) {
  return `/apostille/${record.countrySlug}/${record.documentSlug}`;
}
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
