import type { CountryComplianceProfile } from "./countries";

type CountryOverride = Partial<CountryComplianceProfile> & {
  faqs?: CountryComplianceProfile["faqs"];
};

const VERIFIED_OVERRIDES: Record<string, CountryOverride> = {
  italy: {
    hagueMember: "member",
    hagueMemberSince: "1978-02-11",
    apostilleRequired: true,
    consularLegalizationRequired: false,
    seoTitle: "U.S. Apostille & Document Execution for Italy | The Milano Seal™",
    seoDescription:
      "Authority-aware U.S. document execution and apostille coordination for Italy, including powers of attorney, affidavits, vital records, estate matters, corporate records, and qualifying federal documents.",
    faqs: [
      {
        q: "Does Italy accept apostilles issued in the United States?",
        a: "Italy is a Contracting Party to the Hague Apostille Convention. The correct U.S. competent authority depends on who issued or notarized the document, and the receiving Italian authority may impose document-specific or translation requirements.",
      },
      {
        q: "Does every U.S. document for Italy need notarization first?",
        a: "No. The execution and apostille path depends on the document. Private documents may require notarization, state public records typically route through the competent authority for the issuing state, and federal documents follow the applicable federal authentication path.",
      },
      {
        q: "Can The Milano Seal coordinate a U.S. matter for an Italian attorney?",
        a: "Yes. The professional intake lane is designed to coordinate U.S.-side execution, authority routing, custody, and release while keeping the receiving authority's requirements explicit.",
      },
    ],
  },
  switzerland: {
    hagueMember: "member",
    hagueMemberSince: "1973-03-11",
    apostilleRequired: true,
    consularLegalizationRequired: false,
    seoTitle:
      "U.S. Apostille & Document Execution for Switzerland | The Milano Seal™",
    seoDescription:
      "U.S. document execution and apostille coordination for Swiss legal, fiduciary, private-client, corporate, estate, banking, and cross-border matters.",
    faqs: [
      {
        q: "Does Switzerland accept U.S. apostilles?",
        a: "Switzerland is a Contracting Party to the Hague Apostille Convention. The U.S. apostille authority depends on the document's origin, and the Swiss receiving authority determines any additional document or translation requirements.",
      },
      {
        q: "Can a Swiss attorney or fiduciary coordinate U.S. documents through The Milano Seal?",
        a: "Yes. The professional lane coordinates the U.S.-side execution and authority path while preserving the receiving professional's matter-specific instructions.",
      },
    ],
  },
  germany: {
    hagueMember: "member",
    hagueMemberSince: "1966-02-13",
    apostilleRequired: true,
    consularLegalizationRequired: false,
    seoTitle: "U.S. Apostille & Document Execution for Germany | The Milano Seal™",
    seoDescription:
      "Authority-aware U.S. apostille and document execution coordination for German corporate, probate, academic, private-client, and legal matters.",
    faqs: [
      {
        q: "Does Germany accept U.S. apostilles?",
        a: "Germany is a Contracting Party to the Hague Apostille Convention. The competent U.S. authority depends on whether the document is state-issued, federally issued, or privately executed and notarized.",
      },
      {
        q: "Does The Milano Seal notarize every document before apostille?",
        a: "No. Notarization is used only when required by the document and authority path. State public records and federal documents follow their own competent-authority routes.",
      },
    ],
  },
  france: {
    hagueMember: "member",
    hagueMemberSince: "1965-01-24",
    apostilleRequired: true,
    consularLegalizationRequired: false,
    seoTitle: "U.S. Apostille & Document Execution for France | The Milano Seal™",
    seoDescription:
      "U.S. apostille and document execution coordination for French property, succession, corporate, family, and professional matters with authority review before release.",
    faqs: [
      {
        q: "Does France accept U.S. apostilles?",
        a: "France is a Contracting Party to the Hague Apostille Convention. The U.S. competent authority depends on the document origin, and the French receiving authority determines any matter-specific requirements.",
      },
      {
        q: "Can a French avocat or notaire send U.S.-side execution instructions?",
        a: "Yes. The professional intake lane can preserve the receiving professional's instructions while The Milano Seal coordinates the appropriate U.S. execution and authentication path.",
      },
    ],
  },
  spain: {
    hagueMember: "member",
    hagueMemberSince: "1978-09-25",
    apostilleRequired: true,
    consularLegalizationRequired: false,
    seoTitle: "U.S. Apostille & Document Execution for Spain | The Milano Seal™",
    seoDescription:
      "U.S. apostille and document execution coordination for Spanish property, inheritance, residency, corporate, and private-client matters.",
    faqs: [
      {
        q: "Does Spain accept U.S. apostilles?",
        a: "Spain is a Contracting Party to the Hague Apostille Convention. The correct U.S. apostille authority depends on the document's origin and execution, and the Spanish receiving authority may impose document-specific requirements.",
      },
      {
        q: "What U.S. documents are commonly coordinated for Spain?",
        a: "Common matters include powers of attorney, vital records, property and inheritance documents, academic records, corporate records, and qualifying federal documents.",
      },
    ],
  },
  brazil: {
    hagueMember: "member",
    hagueMemberSince: "2016-08-14",
    apostilleRequired: true,
    consularLegalizationRequired: false,
    seoTitle: "U.S. Apostille & Document Authentication for Brazil | The Milano Seal™",
    seoDescription:
      "Authority-aware U.S. apostille and document execution coordination for Brazilian business, property, family, vital-record, and private-client matters.",
    faqs: [
      {
        q: "Is Brazil a Hague Apostille Convention country?",
        a: "Yes. The Apostille Convention entered into force for Brazil on August 14, 2016. The competent U.S. authority still depends on the origin and type of document.",
      },
    ],
  },
  mexico: {
    hagueMember: "member",
    hagueMemberSince: "1995-08-14",
    apostilleRequired: true,
    consularLegalizationRequired: false,
    seoTitle: "U.S. Apostille & Document Execution for Mexico | The Milano Seal™",
    seoDescription:
      "U.S. apostille and document execution coordination for Mexican property, corporate, family, immigration, and private-client matters.",
    faqs: [
      {
        q: "Is Mexico a Hague Apostille Convention country?",
        a: "Yes. The Apostille Convention entered into force for Mexico on August 14, 1995. The U.S. competent authority depends on whether the document is state-issued, federal, or privately executed and notarized.",
      },
    ],
  },
  portugal: {
    hagueMember: "member",
    hagueMemberSince: "1969-02-04",
    apostilleRequired: true,
    consularLegalizationRequired: false,
    seoTitle: "U.S. Apostille & Document Execution for Portugal | The Milano Seal™",
    seoDescription:
      "Authority-aware U.S. apostille and document execution coordination for Portuguese residency, property, estate, citizenship, corporate, and private-client matters.",
    faqs: [
      {
        q: "Is Portugal a Hague Apostille Convention country?",
        a: "Yes. The Apostille Convention entered into force for Portugal on February 4, 1969. The proper U.S. apostille authority depends on the document origin and execution path.",
      },
    ],
  },
  greece: {
    hagueMember: "member",
    hagueMemberSince: "1985-05-18",
    apostilleRequired: true,
    consularLegalizationRequired: false,
    seoTitle: "U.S. Apostille & Document Execution for Greece | The Milano Seal™",
    seoDescription:
      "U.S. apostille and document execution coordination for Greek citizenship, succession, property, maritime, corporate, and private-client matters.",
    faqs: [
      {
        q: "Is Greece a Hague Apostille Convention country?",
        a: "Yes. The Apostille Convention entered into force for Greece on May 18, 1985. The competent U.S. authority depends on the origin and type of the document.",
      },
    ],
  },
  canada: {
    hagueMember: "member",
    hagueMemberSince: "2024-01-11",
    apostilleRequired: true,
    consularLegalizationRequired: false,
    executionTiers: ["ink+apostille"],
    seoTitle: "U.S. Apostille for Canada | The Milano Seal™",
    seoDescription:
      "U.S. apostille and document-authentication coordination for Canada following the Apostille Convention's entry into force for Canada on January 11, 2024.",
    faqs: [
      {
        q: "Is Canada part of the Hague Apostille Convention?",
        a: "Yes. The Apostille Convention entered into force for Canada on January 11, 2024.",
      },
      {
        q: "Which U.S. authority apostilles a document for Canada?",
        a: "The competent authority depends on the document's origin. State-issued or state-notarized documents generally follow the relevant state authority, while federal documents follow the applicable federal route.",
      },
    ],
  },
  uae: {
    hagueMember: "non-member",
    hagueMemberSince: undefined,
    apostilleRequired: false,
    consularLegalizationRequired: true,
    executionTiers: ["apostille+consular"],
    verificationStatus: "VERIFICATION_REQUIRED",
    seoTitle: "U.S. Document Authentication for UAE | The Milano Seal™",
    seoDescription:
      "U.S. document authentication and legalization pathway review for the United Arab Emirates. The current receiving-authority requirements are confirmed before execution or release.",
    notes:
      "UAE is not listed as a Contracting Party on the current HCCH Apostille Convention status table. U.S. State Department guidance describes authentication of U.S. documents for UAE use. Confirm the current embassy/receiving-authority chain before release.",
    faqs: [
      {
        q: "Does a standard Hague apostille route apply to the UAE?",
        a: "Do not assume a Hague apostille-only route. The current authentication and legalization requirements must be confirmed for the document type and UAE receiving authority before execution or release.",
      },
      {
        q: "How are U.S. documents prepared for use in the UAE?",
        a: "The pathway depends on the document and receiving authority. The Milano Seal reviews the U.S. issuing authority and current authentication/legalization requirements before confirming the route.",
      },
    ],
  },
};

export function applyVerifiedCountryOverride(
  profile: CountryComplianceProfile,
): CountryComplianceProfile {
  const override = VERIFIED_OVERRIDES[profile.slug];
  if (!override) return profile;
  return {
    ...profile,
    ...override,
    faqs: override.faqs ?? profile.faqs,
  };
}

/**
 * True only when the destination carries a reviewed override whose Hague
 * membership has been confirmed. Absence of an override is never verification.
 */
export function hasVerifiedHagueOverride(slug: string): boolean {
  const override = VERIFIED_OVERRIDES[slug];
  return Boolean(
    override &&
      override.hagueMember === "member" &&
      override.verificationStatus !== "VERIFICATION_REQUIRED",
  );
}
