// SEO Authority Engine - Data for 1000+ pages

export const countries = [
  { slug: "italy", name: "Italy", capital: "Rome" },
  { slug: "spain", name: "Spain", capital: "Madrid" },
  { slug: "greece", name: "Greece", capital: "Athens" },
  { slug: "portugal", name: "Portugal", capital: "Lisbon" },
  { slug: "france", name: "France", capital: "Paris" },
  { slug: "germany", name: "Germany", capital: "Berlin" },
  { slug: "brazil", name: "Brazil", capital: "Brasília" },
  { slug: "mexico", name: "Mexico", capital: "Mexico City" },
  { slug: "united-kingdom", name: "United Kingdom", capital: "London" },
  { slug: "canada", name: "Canada", capital: "Ottawa" },
  { slug: "australia", name: "Australia", capital: "Canberra" },
  { slug: "netherlands", name: "Netherlands", capital: "Amsterdam" },
  { slug: "switzerland", name: "Switzerland", capital: "Bern" },
  { slug: "austria", name: "Austria", capital: "Vienna" },
  { slug: "belgium", name: "Belgium", capital: "Brussels" },
  { slug: "sweden", name: "Sweden", capital: "Stockholm" },
  { slug: "norway", name: "Norway", capital: "Oslo" },
  { slug: "denmark", name: "Denmark", capital: "Copenhagen" },
  { slug: "finland", name: "Finland", capital: "Helsinki" },
  { slug: "ireland", name: "Ireland", capital: "Dublin" },
  { slug: "poland", name: "Poland", capital: "Warsaw" },
  { slug: "czech-republic", name: "Czech Republic", capital: "Prague" },
  { slug: "hungary", name: "Hungary", capital: "Budapest" },
  { slug: "romania", name: "Romania", capital: "Bucharest" },
  { slug: "bulgaria", name: "Bulgaria", capital: "Sofia" },
  { slug: "croatia", name: "Croatia", capital: "Zagreb" },
  { slug: "slovenia", name: "Slovenia", capital: "Ljubljana" },
  { slug: "slovakia", name: "Slovakia", capital: "Bratislava" },
  { slug: "argentina", name: "Argentina", capital: "Buenos Aires" },
  { slug: "chile", name: "Chile", capital: "Santiago" },
  { slug: "colombia", name: "Colombia", capital: "Bogotá" },
  { slug: "peru", name: "Peru", capital: "Lima" },
  { slug: "ecuador", name: "Ecuador", capital: "Quito" },
  { slug: "costa-rica", name: "Costa Rica", capital: "San José" },
  { slug: "panama", name: "Panama", capital: "Panama City" },
  { slug: "japan", name: "Japan", capital: "Tokyo" },
  { slug: "south-korea", name: "South Korea", capital: "Seoul" },
  { slug: "india", name: "India", capital: "New Delhi" },
  { slug: "singapore", name: "Singapore", capital: "Singapore" },
  { slug: "hong-kong", name: "Hong Kong", capital: "Hong Kong" },
  { slug: "new-zealand", name: "New Zealand", capital: "Wellington" },
  { slug: "south-africa", name: "South Africa", capital: "Pretoria" },
  { slug: "israel", name: "Israel", capital: "Jerusalem" },
  { slug: "turkey", name: "Turkey", capital: "Ankara" },
  { slug: "russia", name: "Russia", capital: "Moscow" },
  { slug: "ukraine", name: "Ukraine", capital: "Kyiv" },
  { slug: "philippines", name: "Philippines", capital: "Manila" },
  { slug: "thailand", name: "Thailand", capital: "Bangkok" },
  { slug: "vietnam", name: "Vietnam", capital: "Hanoi" },
  { slug: "indonesia", name: "Indonesia", capital: "Jakarta" },
];

export const documents = [
  {
    slug: "power-of-attorney",
    name: "Power of Attorney",
    shortName: "POA",
    description:
      "Legal authorization for one person to act on behalf of another in legal or financial matters.",
  },
  {
    slug: "affidavit",
    name: "Affidavit",
    shortName: "Affidavit",
    description:
      "A written sworn statement of fact voluntarily made by an affiant under oath.",
  },
  {
    slug: "birth-certificate",
    name: "Birth Certificate",
    shortName: "Birth Cert",
    description:
      "Official document recording the birth of a person, often required for citizenship and identity verification.",
  },
  {
    slug: "marriage-certificate",
    name: "Marriage Certificate",
    shortName: "Marriage Cert",
    description:
      "Official document proving the legal union between two individuals.",
  },
  {
    slug: "death-certificate",
    name: "Death Certificate",
    shortName: "Death Cert",
    description:
      "Official document recording the death of a person, required for estate and legal matters.",
  },
  {
    slug: "divorce-decree",
    name: "Divorce Decree",
    shortName: "Divorce",
    description: "Court order finalizing the dissolution of a marriage.",
  },
  {
    slug: "corporate-documents",
    name: "Corporate Documents",
    shortName: "Corporate",
    description:
      "Business formation documents, board resolutions, and corporate certifications.",
  },
  {
    slug: "diploma",
    name: "Diploma",
    shortName: "Diploma",
    description:
      "Educational credentials including degrees, certificates, and transcripts.",
  },
  {
    slug: "fbi-background-check",
    name: "FBI Background Check",
    shortName: "FBI Check",
    description:
      "Criminal background verification issued by the Federal Bureau of Investigation.",
  },
  {
    slug: "consent-letter",
    name: "Consent Letter",
    shortName: "Consent",
    description:
      "Parental consent for minor travel or other legal authorizations.",
  },
  {
    slug: "real-estate-documents",
    name: "Real Estate Documents",
    shortName: "Real Estate",
    description:
      "Property deeds, mortgage documents, and real estate transaction papers.",
  },
  {
    slug: "healthcare-directive",
    name: "Healthcare Directive",
    shortName: "Healthcare",
    description:
      "Advance directives, living wills, and medical power of attorney documents.",
  },
  {
    slug: "patent-documents",
    name: "Patent Documents",
    shortName: "Patent",
    description:
      "Intellectual property filings and patent assignment documents.",
  },
  {
    slug: "trademark-documents",
    name: "Trademark Documents",
    shortName: "Trademark",
    description: "Trademark registration and assignment documents.",
  },
  {
    slug: "adoption-documents",
    name: "Adoption Documents",
    shortName: "Adoption",
    description:
      "Legal documents related to domestic and international adoption proceedings.",
  },
  {
    slug: "name-change",
    name: "Name Change Documents",
    shortName: "Name Change",
    description:
      "Court orders and supporting documents for legal name changes.",
  },
  {
    slug: "immigration-documents",
    name: "Immigration Documents",
    shortName: "Immigration",
    description:
      "Documents required for visa applications and immigration proceedings.",
  },
  {
    slug: "court-documents",
    name: "Court Documents",
    shortName: "Court",
    description: "Court orders, judgments, and other judicial documents.",
  },
];

export function getCountryBySlug(slug: string) {
  return countries.find((c) => c.slug === slug);
}

export function getDocumentBySlug(slug: string) {
  return documents.find((d) => d.slug === slug);
}

export function getAllApostillePageParams() {
  return countries.map((country) => ({
    country: country.slug,
  }));
}

export function getAllDocumentPageParams() {
  const params: { document: string; country: string }[] = [];

  for (const doc of documents) {
    for (const country of countries) {
      params.push({
        document: doc.slug,
        country: country.slug,
      });
    }
  }

  return params;
}

export function getAllServicePageParams() {
  return documents.map((doc) => ({
    service: doc.slug,
  }));
}
