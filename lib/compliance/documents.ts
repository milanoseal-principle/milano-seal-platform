export type DocumentCategory =
  | "personal-status"
  | "education"
  | "business"
  | "legal"
  | "government"
  | "financial"
  | "real-estate";

export interface DocumentTaxonomyItem {
  slug: string;
  name: string;
  category: DocumentCategory;
  commonlyApostilled: boolean;
  requiresNotarizationFirst: boolean;
  requiresCertifiedCopy?: boolean;
  translationOftenRequired: boolean;
  notes?: string;
  seoTitle: string;
  seoDescription: string;
  faqs: { q: string; a: string }[];
}

export const DOCUMENT_TAXONOMY: DocumentTaxonomyItem[] = [
  {
    slug: "birth-certificate",
    name: "Birth Certificate",
    category: "personal-status",
    commonlyApostilled: true,
    requiresNotarizationFirst: false,
    requiresCertifiedCopy: true,
    translationOftenRequired: true,
    seoTitle: "Apostille for Birth Certificate | The Milano Seal™",
    seoDescription: "Birth certificate apostille preparation. Certified copy, notarization coordination, state apostille routing, and international courier custody.",
    faqs: [
      { q: "Can I apostille a birth certificate directly?", a: "Government-issued vital records typically require a certified copy from the issuing vital records office. The certified copy can then be apostilled through the Secretary of State." },
      { q: "Do I need a translation for my birth certificate?", a: "Most foreign receiving authorities require a certified translation into their local language. Translation requirements vary by destination country and receiving authority." },
    ],
  },
  {
    slug: "marriage-certificate",
    name: "Marriage Certificate",
    category: "personal-status",
    commonlyApostilled: true,
    requiresNotarizationFirst: false,
    requiresCertifiedCopy: true,
    translationOftenRequired: true,
    seoTitle: "Apostille for Marriage Certificate | The Milano Seal™",
    seoDescription: "Marriage certificate apostille preparation. State-issued certified copy, apostille routing, and international courier service.",
    faqs: [
      { q: "How do I apostille a Florida marriage certificate?", a: "Obtain a certified copy from the Florida Department of Health Bureau of Vital Statistics, then route through the Florida Secretary of State for apostille." },
    ],
  },
  {
    slug: "divorce-decree",
    name: "Divorce Decree",
    category: "personal-status",
    commonlyApostilled: true,
    requiresNotarizationFirst: true,
    translationOftenRequired: true,
    seoTitle: "Apostille for Divorce Decree | The Milano Seal™",
    seoDescription: "Divorce decree apostille preparation. Court-issued document notarization coordination, state apostille routing, and international delivery.",
    faqs: [
      { q: "Can a divorce decree be apostilled?", a: "Yes. Court-issued divorce decrees can generally be apostilled. The document typically needs to be a certified court copy, and in some cases notarization of a copy is required before apostille." },
    ],
  },
  {
    slug: "death-certificate",
    name: "Death Certificate",
    category: "personal-status",
    commonlyApostilled: true,
    requiresNotarizationFirst: false,
    requiresCertifiedCopy: true,
    translationOftenRequired: true,
    seoTitle: "Apostille for Death Certificate | The Milano Seal™",
    seoDescription: "Death certificate apostille preparation. Certified copy procurement, state apostille routing, and international courier service.",
    faqs: [],
  },
  {
    slug: "power-of-attorney",
    name: "Power of Attorney",
    category: "legal",
    commonlyApostilled: true,
    requiresNotarizationFirst: true,
    translationOftenRequired: true,
    seoTitle: "Apostille for Power of Attorney | The Milano Seal™",
    seoDescription: "Power of attorney apostille preparation. Notarization, state apostille, and international courier routing.",
    faqs: [
      { q: "Does a power of attorney need notarization before apostille?", a: "Yes. A power of attorney must be notarized before it can be apostilled. The notary acknowledgment is what the Secretary of State authenticates." },
    ],
  },
  {
    slug: "diploma",
    name: "Academic Diploma",
    category: "education",
    commonlyApostilled: true,
    requiresNotarizationFirst: true,
    translationOftenRequired: true,
    seoTitle: "Apostille for Diploma | The Milano Seal™",
    seoDescription: "Academic diploma apostille preparation. Notarization of original or certified copy, state apostille, and international delivery.",
    faqs: [
      { q: "How do I apostille a university diploma?", a: "Diplomas typically require notarization of a copy or certification from the institution before the Secretary of State can issue an apostille." },
    ],
  },
  {
    slug: "transcript",
    name: "Academic Transcript",
    category: "education",
    commonlyApostilled: true,
    requiresNotarizationFirst: true,
    translationOftenRequired: true,
    seoTitle: "Apostille for Academic Transcript | The Milano Seal™",
    seoDescription: "Academic transcript apostille preparation. Institution certification, notarization coordination, state apostille routing.",
    faqs: [],
  },
  {
    slug: "background-check",
    name: "FBI / Criminal Background Check",
    category: "government",
    commonlyApostilled: true,
    requiresNotarizationFirst: false,
    translationOftenRequired: false,
    seoTitle: "Apostille for FBI Background Check | The Milano Seal™",
    seoDescription: "FBI and state criminal background check apostille preparation. Federal and state-level apostille routing and international courier custody.",
    faqs: [
      { q: "Can an FBI background check be apostilled?", a: "Yes. The FBI Identity History Summary can be apostilled at the US federal level through the US Department of State. State background checks are apostilled through the relevant Secretary of State." },
    ],
  },
  {
    slug: "corporate-documents",
    name: "Corporate / Business Documents",
    category: "business",
    commonlyApostilled: true,
    requiresNotarizationFirst: true,
    translationOftenRequired: true,
    seoTitle: "Apostille for Corporate Documents | The Milano Seal™",
    seoDescription: "Business document apostille preparation. Articles of incorporation, corporate resolutions, certificates of good standing, and more.",
    faqs: [
      { q: "What business documents commonly need apostille?", a: "Common corporate documents include articles of incorporation, certificates of good standing, corporate resolutions, and authorized signatory certificates." },
    ],
  },
  {
    slug: "affidavit",
    name: "Affidavit",
    category: "legal",
    commonlyApostilled: true,
    requiresNotarizationFirst: true,
    translationOftenRequired: true,
    seoTitle: "Apostille for Affidavit | The Milano Seal™",
    seoDescription: "Affidavit apostille preparation. Notarization, state apostille routing, and international courier service.",
    faqs: [],
  },
  {
    slug: "medical-records",
    name: "Medical Records",
    category: "personal-status",
    commonlyApostilled: false,
    requiresNotarizationFirst: true,
    translationOftenRequired: true,
    seoTitle: "Notarization for Medical Records | The Milano Seal™",
    seoDescription: "Medical record notarization and document coordination. International routing support.",
    faqs: [],
  },
  {
    slug: "adoption-documents",
    name: "Adoption Documents",
    category: "legal",
    commonlyApostilled: true,
    requiresNotarizationFirst: true,
    translationOftenRequired: true,
    seoTitle: "Apostille for Adoption Documents | The Milano Seal™",
    seoDescription: "Adoption document apostille preparation. Court-certified documents, notarization coordination, and international routing.",
    faqs: [],
  },
  {
    slug: "real-estate-documents",
    name: "Real Estate Documents",
    category: "real-estate",
    commonlyApostilled: true,
    requiresNotarizationFirst: true,
    translationOftenRequired: true,
    seoTitle: "Apostille for Real Estate Documents | The Milano Seal™",
    seoDescription: "Real estate document apostille preparation. Deeds, titles, and related documents for international property transactions.",
    faqs: [],
  },
  {
    slug: "financial-documents",
    name: "Financial Documents",
    category: "financial",
    commonlyApostilled: true,
    requiresNotarizationFirst: true,
    translationOftenRequired: true,
    seoTitle: "Apostille for Financial Documents | The Milano Seal™",
    seoDescription: "Financial document apostille and notarization. Bank letters, financial statements, and related documents.",
    faqs: [],
  },
  {
    slug: "vehicle-title",
    name: "Vehicle Title",
    category: "government",
    commonlyApostilled: true,
    requiresNotarizationFirst: false,
    translationOftenRequired: false,
    seoTitle: "Apostille for Vehicle Title | The Milano Seal™",
    seoDescription: "Vehicle title apostille preparation. Florida DHSMV-issued titles and international routing.",
    faqs: [],
  },
  {
    slug: "notarized-letter",
    name: "Notarized Letter / Statement",
    category: "legal",
    commonlyApostilled: true,
    requiresNotarizationFirst: true,
    translationOftenRequired: true,
    seoTitle: "Apostille for Notarized Letter | The Milano Seal™",
    seoDescription: "Notarized letter and statement apostille preparation. Remote online notarization, state apostille, and courier service.",
    faqs: [],
  },
  {
    slug: "guardianship-documents",
    name: "Guardianship Documents",
    category: "legal",
    commonlyApostilled: true,
    requiresNotarizationFirst: true,
    translationOftenRequired: true,
    seoTitle: "Apostille for Guardianship Documents | The Milano Seal™",
    seoDescription: "Guardianship and custody document apostille preparation. Court documents, notarization, and international routing.",
    faqs: [],
  },
  {
    slug: "passport-copy",
    name: "Passport Copy (Notarized)",
    category: "personal-status",
    commonlyApostilled: false,
    requiresNotarizationFirst: true,
    translationOftenRequired: false,
    seoTitle: "Notarized Passport Copy | The Milano Seal™",
    seoDescription: "Notarized passport copy preparation for international use. Remote online notarization support.",
    faqs: [],
  },
  {
    slug: "articles-of-incorporation",
    name: "Articles of Incorporation",
    category: "business",
    commonlyApostilled: true,
    requiresNotarizationFirst: false,
    requiresCertifiedCopy: true,
    translationOftenRequired: true,
    seoTitle: "Apostille for Articles of Incorporation | The Milano Seal™",
    seoDescription: "Articles of incorporation apostille. Florida Division of Corporations certified documents and state apostille routing.",
    faqs: [],
  },
  {
    slug: "certificate-of-good-standing",
    name: "Certificate of Good Standing",
    category: "business",
    commonlyApostilled: true,
    requiresNotarizationFirst: false,
    requiresCertifiedCopy: true,
    translationOftenRequired: false,
    seoTitle: "Apostille for Certificate of Good Standing | The Milano Seal™",
    seoDescription: "Certificate of good standing apostille preparation. Florida and other state-issued certificates for international business use.",
    faqs: [],
  },
  {
    slug: "last-will-testament",
    name: "Last Will & Testament",
    category: "legal",
    commonlyApostilled: true,
    requiresNotarizationFirst: true,
    translationOftenRequired: true,
    seoTitle: "Apostille for Last Will & Testament | The Milano Seal™",
    seoDescription: "Will and testament apostille preparation. Notarization, state apostille, and international courier custody.",
    faqs: [],
  },
  {
    slug: "court-documents",
    name: "Court Documents",
    category: "legal",
    commonlyApostilled: true,
    requiresNotarizationFirst: false,
    requiresCertifiedCopy: true,
    translationOftenRequired: true,
    seoTitle: "Apostille for Court Documents | The Milano Seal™",
    seoDescription: "Court document apostille preparation. Certified court copies, state apostille routing, and international courier service.",
    faqs: [],
  },
  {
    slug: "immigration-documents",
    name: "Immigration Documents",
    category: "government",
    commonlyApostilled: false,
    requiresNotarizationFirst: true,
    translationOftenRequired: true,
    seoTitle: "Notarization for Immigration Documents | The Milano Seal™",
    seoDescription: "Immigration document notarization and coordination support.",
    faqs: [],
  },
  {
    slug: "school-records",
    name: "School Records",
    category: "education",
    commonlyApostilled: true,
    requiresNotarizationFirst: true,
    translationOftenRequired: true,
    seoTitle: "Apostille for School Records | The Milano Seal™",
    seoDescription: "School record apostille preparation. K-12 and higher education records, notarization coordination, and state apostille routing.",
    faqs: [],
  },
  {
    slug: "professional-license",
    name: "Professional License",
    category: "government",
    commonlyApostilled: true,
    requiresNotarizationFirst: true,
    translationOftenRequired: false,
    seoTitle: "Apostille for Professional License | The Milano Seal™",
    seoDescription: "Professional license apostille preparation. State-issued licenses, notarization, and international apostille routing.",
    faqs: [],
  },
  {
    slug: "bank-letter",
    name: "Bank Letter / Financial Statement",
    category: "financial",
    commonlyApostilled: false,
    requiresNotarizationFirst: true,
    translationOftenRequired: false,
    seoTitle: "Notarized Bank Letter | The Milano Seal™",
    seoDescription: "Bank letter and financial statement notarization and authentication support for international use.",
    faqs: [],
  },
  {
    slug: "trademark-documents",
    name: "Trademark / IP Documents",
    category: "business",
    commonlyApostilled: true,
    requiresNotarizationFirst: true,
    translationOftenRequired: false,
    seoTitle: "Apostille for Trademark Documents | The Milano Seal™",
    seoDescription: "Trademark and intellectual property document apostille preparation. Notarization, state apostille, and international courier service.",
    faqs: [],
  },
];

export function getDocumentBySlug(slug: string): DocumentTaxonomyItem | undefined {
  return DOCUMENT_TAXONOMY.find(d => d.slug === slug);
}

export function getDocumentsByCategory(category: DocumentCategory): DocumentTaxonomyItem[] {
  return DOCUMENT_TAXONOMY.filter(d => d.category === category);
}

export function getApostillableDocuments(): DocumentTaxonomyItem[] {
  return DOCUMENT_TAXONOMY.filter(d => d.commonlyApostilled);
}
