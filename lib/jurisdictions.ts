export interface Jurisdiction {
  code: string;
  name: string;
  kind: "state" | "country";
  region: string;
  flag: string;
  hague: boolean;
  ron: string | null;
  authentication_path: string;
  execution_path: string;
  typical_documents: string[];
  witness_rules: string;
  summary: string;
  requirements: { label: string; value: string }[];
  regulations: string[];
}

export const JURISDICTIONS: Jurisdiction[] = [
  {
    code: "us-fl",
    name: "Florida",
    kind: "state",
    region: "US States",
    flag: "🇺🇸",
    hague: true,
    ron: "Authorized",
    authentication_path: "Florida Department of State — Apostille Office",
    execution_path:
      "In-person, mobile, or RON via Florida-commissioned notary.",
    typical_documents: [
      "Power of Attorney",
      "Affidavit",
      "Birth Certificate",
      "Diploma",
    ],
    witness_rules:
      "Two adult witnesses required for most international affidavits and POAs.",
    summary:
      "Florida is the operating jurisdiction of The Milano Seal. Mobile notary, RON, and in-person notarization are all available. Apostilles are issued by the Florida Department of State.",
    requirements: [
      { label: "Notary commission", value: "Florida (FL Notary #668288)" },
      {
        label: "Authentication",
        value: "Florida Department of State — Apostille",
      },
      {
        label: "Identification",
        value: "Government-issued photo ID, valid and unexpired",
      },
      { label: "Turnaround", value: "1–5 business days standard, 24h urgent" },
    ],
    regulations: [
      "Florida Statutes Chapter 117 — Notaries Public",
      "Florida RON Rules (HB 409, eff. 2020)",
      "Hague Apostille Convention (1961)",
    ],
  },
  {
    code: "us-co",
    name: "Colorado",
    kind: "state",
    region: "US States",
    flag: "🇺🇸",
    hague: true,
    ron: "Authorized",
    authentication_path: "Colorado Secretary of State — Apostille Section",
    execution_path:
      "Remote Online Notarization (RON) for simple single-document matters.",
    typical_documents: ["Affidavit", "Single-signer POA", "Travel consent"],
    witness_rules:
      "Witnesses optional; if required, must appear remotely on the same RON session.",
    summary:
      "Colorado is the preferred RON jurisdiction for low-complexity matters. Single-document RON is offered at a reduced lane rate.",
    requirements: [
      { label: "Notary commission", value: "Colorado RON-authorized" },
      { label: "Authentication", value: "Colorado Secretary of State" },
      {
        label: "Identification",
        value: "Credential analysis + KBA via RON platform",
      },
    ],
    regulations: [
      "Colorado Revised Notary Public Act",
      "Colorado RON Rules (8 CCR 1505-11)",
    ],
  },
  {
    code: "us-va",
    name: "Virginia",
    kind: "state",
    region: "US States",
    flag: "🇺🇸",
    hague: true,
    ron: "Authorized",
    authentication_path: "Virginia Secretary of the Commonwealth",
    execution_path: "RON or in-person notarization.",
    typical_documents: ["Affidavit", "POA", "Corporate resolutions"],
    witness_rules: "Two witnesses for real-property POAs.",
    summary:
      "Virginia was the first US state to authorize RON. Strong fit for corporate and cross-border matters.",
    requirements: [
      { label: "Notary commission", value: "Virginia electronic notary" },
      {
        label: "Authentication",
        value: "Virginia Secretary of the Commonwealth",
      },
    ],
    regulations: ["Virginia Code §47.1-2 — Electronic Notarization"],
  },
  {
    code: "us-tx",
    name: "Texas",
    kind: "state",
    region: "US States",
    flag: "🇺🇸",
    hague: true,
    ron: "Authorized",
    authentication_path: "Texas Secretary of State — Authentications",
    execution_path: "RON or in-person via Texas-commissioned notary.",
    typical_documents: ["POA", "Affidavit", "Corporate documents"],
    witness_rules: "Two witnesses required for most international POAs.",
    summary:
      "Active RON program; large volume of international matters via Houston/Dallas.",
    requirements: [
      { label: "Notary commission", value: "Texas online notary" },
      { label: "Authentication", value: "Texas Secretary of State" },
    ],
    regulations: ["Texas Government Code Chapter 406"],
  },
  {
    code: "us-ny",
    name: "New York",
    kind: "state",
    region: "US States",
    flag: "🇺🇸",
    hague: true,
    ron: "Authorized",
    authentication_path:
      "NY Department of State (after county clerk authentication for some documents)",
    execution_path: "RON or in-person.",
    typical_documents: ["Affidavit", "POA", "Diploma", "Corporate resolution"],
    witness_rules: "Two witnesses for real-property and inheritance matters.",
    summary:
      "RON authorized as of Jan 2023. Some apostille requests require prior county-clerk authentication.",
    requirements: [
      { label: "Notary commission", value: "New York electronic notary" },
      { label: "Authentication", value: "NY Department of State" },
    ],
    regulations: ["NY Executive Law §135-c"],
  },
  {
    code: "us-ca",
    name: "California",
    kind: "state",
    region: "US States",
    flag: "🇺🇸",
    hague: true,
    ron: "Not authorized",
    authentication_path: "California Secretary of State — Apostille Unit",
    execution_path: "In-person notarization only (no RON in California).",
    typical_documents: ["POA", "Affidavit", "Birth Certificate"],
    witness_rules:
      "Witnesses optional in most matters; required for POAs in some destinations.",
    summary:
      "California does not authorize RON. All matters must execute in-person and route through the CA Secretary of State.",
    requirements: [
      { label: "Notary commission", value: "California in-person notary" },
      { label: "Authentication", value: "California Secretary of State" },
    ],
    regulations: ["California Government Code §8200 et seq."],
  },
  {
    code: "us-ga",
    name: "Georgia",
    kind: "state",
    region: "US States",
    flag: "🇺🇸",
    hague: true,
    ron: "Limited (audio-video only with FL/VA cross-commission)",
    authentication_path: "Georgia Superior Court Clerks' Cooperative Authority",
    execution_path: "In-person preferred; RON via cross-commissioned notary.",
    typical_documents: ["POA", "Affidavit", "Corporate documents"],
    witness_rules: "Two witnesses required for real estate and POA matters.",
    summary:
      "Georgia routes apostilles through the GSCCCA, not the Secretary of State.",
    requirements: [
      { label: "Notary commission", value: "Georgia notary public" },
      { label: "Authentication", value: "GSCCCA — Apostille" },
    ],
    regulations: ["O.C.G.A. §45-17 — Notaries Public"],
  },
  {
    code: "us-nv",
    name: "Nevada",
    kind: "state",
    region: "US States",
    flag: "🇺🇸",
    hague: true,
    ron: "Authorized",
    authentication_path: "Nevada Secretary of State — Notary Division",
    execution_path: "RON or in-person notarization.",
    typical_documents: ["Corporate resolutions", "POA", "Affidavit"],
    witness_rules: "One witness required for international POAs.",
    summary:
      "Nevada offers a streamlined RON path well-suited for entity-related matters.",
    requirements: [
      { label: "Notary commission", value: "Nevada electronic notary" },
      { label: "Authentication", value: "Nevada Secretary of State" },
    ],
    regulations: ["Nevada Revised Statutes Chapter 240"],
  },
  {
    code: "us-wa",
    name: "Washington",
    kind: "state",
    region: "US States",
    flag: "🇺🇸",
    hague: true,
    ron: "Authorized",
    authentication_path: "Washington Department of Licensing — Apostilles",
    execution_path: "RON or in-person.",
    typical_documents: ["POA", "Affidavit", "Diploma"],
    witness_rules: "Two witnesses for international POAs and affidavits.",
    summary: "Active RON program; common origin state for Pacific Rim matters.",
    requirements: [
      { label: "Notary commission", value: "Washington electronic notary" },
      { label: "Authentication", value: "WA Department of Licensing" },
    ],
    regulations: ["RCW 42.45 — Notaries Public"],
  },
  {
    code: "us-pa",
    name: "Pennsylvania",
    kind: "state",
    region: "US States",
    flag: "🇺🇸",
    hague: true,
    ron: "Authorized",
    authentication_path: "Pennsylvania Department of State",
    execution_path: "RON or in-person.",
    typical_documents: ["POA", "Affidavit", "Corporate documents"],
    witness_rules: "Two witnesses for international matters.",
    summary: "RON authorized; common origin state for European matters.",
    requirements: [
      { label: "Notary commission", value: "Pennsylvania electronic notary" },
      { label: "Authentication", value: "PA Department of State" },
    ],
    regulations: ["Revised Uniform Law on Notarial Acts (RULONA, 2013)"],
  },

  // --- EUROPE ---
  {
    code: "it",
    name: "Italy",
    kind: "country",
    region: "Europe",
    flag: "🇮🇹",
    hague: true,
    ron: null,
    authentication_path:
      "U.S. apostille → Italian Consulate (translation register)",
    execution_path:
      "Apostille from origin state; certified Italian translation typically required.",
    typical_documents: [
      "POA for citizenship (jure sanguinis)",
      "Birth Certificate",
      "Marriage Certificate",
      "Affidavit of single status",
    ],
    witness_rules:
      "Two witnesses required for POAs presented to Italian Consulates.",
    summary:
      "Italy is a Hague Convention member. Documents executed in the US must be apostilled, then often accompanied by a sworn Italian translation (traduzione giurata).",
    requirements: [
      { label: "Authentication", value: "Apostille (Hague)" },
      {
        label: "Translation",
        value: "Sworn Italian translation typically required",
      },
      {
        label: "Consular step",
        value: "Sometimes registered with the consulate",
      },
    ],
    regulations: [
      "Hague Apostille Convention (1961)",
      "Italian Decreto Legislativo n.71/2011 — Consular law",
    ],
  },
  {
    code: "es",
    name: "Spain",
    kind: "country",
    region: "Europe",
    flag: "🇪🇸",
    hague: true,
    ron: null,
    authentication_path: "U.S. apostille",
    execution_path:
      "Apostille from origin state. Sworn Spanish translation often required.",
    typical_documents: ["POA", "Birth Certificate", "Affidavit", "Diploma"],
    witness_rules: "Two witnesses for most POAs.",
    summary:
      "Hague member. Spanish authorities accept apostilled US documents directly.",
    requirements: [
      { label: "Authentication", value: "Apostille (Hague)" },
      {
        label: "Translation",
        value: "Traductor jurado (sworn translator) usually required",
      },
    ],
    regulations: ["Hague Apostille Convention (1961)"],
  },
  {
    code: "pt",
    name: "Portugal",
    kind: "country",
    region: "Europe",
    flag: "🇵🇹",
    hague: true,
    ron: null,
    authentication_path: "U.S. apostille",
    execution_path:
      "Apostille from origin state; certified Portuguese translation often required.",
    typical_documents: ["POA", "Birth Certificate", "Affidavit"],
    witness_rules: "Two witnesses for international POAs.",
    summary:
      "Hague member. Common destination for citizenship-by-descent matters.",
    requirements: [
      { label: "Authentication", value: "Apostille (Hague)" },
      {
        label: "Translation",
        value: "Tradução certificada (certified translation)",
      },
    ],
    regulations: ["Hague Apostille Convention (1961)"],
  },
  {
    code: "fr",
    name: "France",
    kind: "country",
    region: "Europe",
    flag: "🇫🇷",
    hague: true,
    ron: null,
    authentication_path: "U.S. apostille",
    execution_path:
      "Apostille; sworn French translation (traducteur assermenté) often required.",
    typical_documents: ["POA", "Affidavit", "Birth Certificate"],
    witness_rules: "Two witnesses for POAs.",
    summary:
      "Hague member. French authorities require sworn translation by a court-listed translator.",
    requirements: [
      { label: "Authentication", value: "Apostille (Hague)" },
      { label: "Translation", value: "Traducteur assermenté" },
    ],
    regulations: ["Hague Apostille Convention (1961)"],
  },
  {
    code: "de",
    name: "Germany",
    kind: "country",
    region: "Europe",
    flag: "🇩🇪",
    hague: true,
    ron: null,
    authentication_path: "U.S. apostille",
    execution_path:
      "Apostille; certified German translation required for civil registry use.",
    typical_documents: ["POA", "Birth Certificate", "Marriage Certificate"],
    witness_rules: "Two witnesses for international POAs.",
    summary: "Hague member. Strict on translator credentials.",
    requirements: [
      { label: "Authentication", value: "Apostille (Hague)" },
      {
        label: "Translation",
        value: "Beeidigter Übersetzer (sworn translator)",
      },
    ],
    regulations: ["Hague Apostille Convention (1961)"],
  },
  {
    code: "gr",
    name: "Greece",
    kind: "country",
    region: "Europe",
    flag: "🇬🇷",
    hague: true,
    ron: null,
    authentication_path: "U.S. apostille",
    execution_path: "Apostille; certified Greek translation required.",
    typical_documents: ["POA", "Affidavit", "Birth Certificate"],
    witness_rules: "Two witnesses for POAs.",
    summary:
      "Hague member. Translation by a Greek consulate-recognized translator.",
    requirements: [
      { label: "Authentication", value: "Apostille (Hague)" },
      { label: "Translation", value: "Certified Greek translation" },
    ],
    regulations: ["Hague Apostille Convention (1961)"],
  },
  {
    code: "gb",
    name: "United Kingdom",
    kind: "country",
    region: "Europe",
    flag: "🇬🇧",
    hague: true,
    ron: null,
    authentication_path: "U.S. apostille",
    execution_path: "Apostille; English documents require no translation.",
    typical_documents: ["POA", "Affidavit", "Corporate documents"],
    witness_rules: "Single witness sufficient for most matters.",
    summary: "Hague member. English-language target — no translation overhead.",
    requirements: [{ label: "Authentication", value: "Apostille (Hague)" }],
    regulations: ["Hague Apostille Convention (1961)"],
  },

  // --- LATIN AMERICA ---
  {
    code: "br",
    name: "Brazil",
    kind: "country",
    region: "Latin America",
    flag: "🇧🇷",
    hague: true,
    ron: null,
    authentication_path: "U.S. apostille",
    execution_path:
      "Apostille; sworn Portuguese translation by a Brazilian-registered tradutor juramentado.",
    typical_documents: [
      "POA for citizenship",
      "Birth Certificate",
      "Marriage Certificate",
    ],
    witness_rules: "Two witnesses for POAs presented to Brazilian cartórios.",
    summary:
      "Hague member since 2016. High-volume destination for dual citizenship matters.",
    requirements: [
      { label: "Authentication", value: "Apostille (Hague)" },
      {
        label: "Translation",
        value: "Tradutor juramentado (Brazilian-registered)",
      },
    ],
    regulations: ["Hague Apostille Convention (effective in Brazil 2016)"],
  },
  {
    code: "mx",
    name: "Mexico",
    kind: "country",
    region: "Latin America",
    flag: "🇲🇽",
    hague: true,
    ron: null,
    authentication_path: "U.S. apostille",
    execution_path:
      "Apostille; certified Spanish translation typically required.",
    typical_documents: ["POA", "Affidavit", "Birth Certificate"],
    witness_rules: "Two witnesses for POAs presented before Mexican notaries.",
    summary: "Hague member. Mexican notarios are stricter than US notaries.",
    requirements: [
      { label: "Authentication", value: "Apostille (Hague)" },
      { label: "Translation", value: "Perito traductor certificado" },
    ],
    regulations: ["Hague Apostille Convention (1961)"],
  },
  {
    code: "ar",
    name: "Argentina",
    kind: "country",
    region: "Latin America",
    flag: "🇦🇷",
    hague: true,
    ron: null,
    authentication_path: "U.S. apostille",
    execution_path: "Apostille; sworn Spanish translation required.",
    typical_documents: ["POA", "Birth Certificate", "Marriage Certificate"],
    witness_rules: "Two witnesses for POAs.",
    summary:
      "Hague member. Common destination for citizenship and inheritance matters.",
    requirements: [
      { label: "Authentication", value: "Apostille (Hague)" },
      { label: "Translation", value: "Traductor público matriculado" },
    ],
    regulations: ["Hague Apostille Convention (1961)"],
  },
  {
    code: "co",
    name: "Colombia",
    kind: "country",
    region: "Latin America",
    flag: "🇨🇴",
    hague: true,
    ron: null,
    authentication_path: "U.S. apostille",
    execution_path: "Apostille; certified Spanish translation required.",
    typical_documents: ["POA", "Affidavit", "Birth Certificate"],
    witness_rules: "Two witnesses for POAs.",
    summary: "Hague member.",
    requirements: [
      { label: "Authentication", value: "Apostille (Hague)" },
      { label: "Translation", value: "Traductor oficial" },
    ],
    regulations: ["Hague Apostille Convention (1961)"],
  },

  // --- NORTH AMERICA ---
  {
    code: "ca",
    name: "Canada",
    kind: "country",
    region: "North America",
    flag: "🇨🇦",
    hague: true,
    ron: null,
    authentication_path: "U.S. apostille (Canada acceded January 2024)",
    execution_path: "Apostille from origin state.",
    typical_documents: ["POA", "Affidavit", "Corporate documents"],
    witness_rules: "Single witness sufficient for most provinces.",
    summary:
      "Canada became a Hague member in 2024. Documents now route via apostille rather than full legalization.",
    requirements: [
      { label: "Authentication", value: "Apostille (Hague, since Jan 2024)" },
    ],
    regulations: ["Hague Apostille Convention (Canada acceded 2024)"],
  },

  // --- MIDDLE EAST ---
  {
    code: "ae",
    name: "United Arab Emirates",
    kind: "country",
    region: "Middle East",
    flag: "🇦🇪",
    hague: true,
    ron: null,
    authentication_path:
      "U.S. apostille (UAE acceded to Hague — effective 2025); legacy matters via UAE Consulate.",
    execution_path: "Apostille; certified Arabic translation required.",
    typical_documents: ["Corporate documents", "POA", "Affidavit"],
    witness_rules: "Two witnesses for POAs.",
    summary:
      "Recent Hague accession simplified the path. Arabic translation by an MOJ-licensed translator is required.",
    requirements: [
      { label: "Authentication", value: "Apostille (Hague)" },
      { label: "Translation", value: "MOJ-licensed Arabic translator" },
    ],
    regulations: ["Hague Apostille Convention (effective UAE 2025)"],
  },
  {
    code: "il",
    name: "Israel",
    kind: "country",
    region: "Middle East",
    flag: "🇮🇱",
    hague: true,
    ron: null,
    authentication_path: "U.S. apostille",
    execution_path:
      "Apostille; certified Hebrew translation typically required.",
    typical_documents: ["POA", "Affidavit", "Birth Certificate"],
    witness_rules: "Two witnesses for POAs.",
    summary: "Hague member.",
    requirements: [
      { label: "Authentication", value: "Apostille (Hague)" },
      { label: "Translation", value: "Notarized Hebrew translation" },
    ],
    regulations: ["Hague Apostille Convention (1961)"],
  },

  {
    code: "jp",
    name: "Japan",
    kind: "country",
    region: "Asia Pacific",
    flag: "🇯🇵",
    hague: true,
    ron: null,
    authentication_path: "U.S. apostille",
    execution_path:
      "Apostille; certified Japanese translation usually required for civil registry.",
    typical_documents: ["POA", "Affidavit", "Marriage Certificate"],
    witness_rules: "One witness for most matters.",
    summary: "Hague member.",
    requirements: [
      { label: "Authentication", value: "Apostille (Hague)" },
      { label: "Translation", value: "Certified Japanese translation" },
    ],
    regulations: ["Hague Apostille Convention (1961)"],
  },
  {
    code: "au",
    name: "Australia",
    kind: "country",
    region: "Asia Pacific",
    flag: "🇦🇺",
    hague: true,
    ron: null,
    authentication_path: "U.S. apostille",
    execution_path: "Apostille; English documents require no translation.",
    typical_documents: ["POA", "Affidavit", "Corporate documents"],
    witness_rules: "Single witness sufficient.",
    summary: "Hague member. English target — no translation overhead.",
    requirements: [{ label: "Authentication", value: "Apostille (Hague)" }],
    regulations: ["Hague Apostille Convention (1961)"],
  },
];

const BY_CODE = new Map(JURISDICTIONS.map((j) => [j.code, j]));
const BY_NAME = new Map(JURISDICTIONS.map((j) => [j.name.toLowerCase(), j]));

export function findJurisdiction(codeOrName: string): Jurisdiction | undefined {
  const k = codeOrName.toLowerCase();
  return BY_CODE.get(k) ?? BY_NAME.get(k);
}
