export type MunicipalRecordOption = {
  id: number;
  label: string;
  requiresRelationshipProof?: boolean;
};

export const VASTOGIRARDI_RECORD_SOURCE = {
  comune: "Comune di Vastogirardi",
  province: "Isernia",
  ordinaryEmail: "info@comune.vastogirardi.is.it",
  pecEmail: "info@pec.comune.vastogirardi.is.it",
  sourceFile: "Modulo_richiesta_certificati_di_stato_civile___allegato_B.docx.pdf",
  sourceTitle: "Richiesta di ricerca storica e relativi certificati",
  legalReferences: [
    "D.P.R. 3 novembre 2000 n. 396",
    "D.P.R. 432/1957 art. 3",
    "Regolamento UE 2016/679 art. 13",
    "Legge 30 dicembre 2024 n. 207",
  ],
  scopeNote:
    "Source-specific administrative profile for Vastogirardi. Verify the current Comune form, fee, and submission instructions before operational use.",
} as const;

export const VASTOGIRARDI_RECORD_OPTIONS: MunicipalRecordOption[] = [
  { id: 1, label: "Birth certificate" },
  { id: 2, label: "Birth extract" },
  { id: 3, label: "Birth extract with paternity and maternity", requiresRelationshipProof: true },
  { id: 4, label: "International multilingual birth extract", requiresRelationshipProof: true },
  { id: 5, label: "Marriage certificate" },
  { id: 6, label: "Marriage extract" },
  { id: 7, label: "International multilingual marriage extract" },
  { id: 8, label: "Death certificate" },
  { id: 9, label: "Death extract" },
  { id: 10, label: "International multilingual death extract" },
  { id: 11, label: "Full copy of birth record", requiresRelationshipProof: true },
  { id: 12, label: "Full copy of marriage record", requiresRelationshipProof: true },
  { id: 13, label: "Full copy of death record", requiresRelationshipProof: true },
];

export const VASTOGIRARDI_REQUEST_DATA = [
  "Applicant surname and given name",
  "Applicant tax code, birth date, sex, place of birth, citizenship",
  "Applicant residence and contact details",
  "Subject surname, given name, birth date, place of birth, sex",
  "Paternity / maternity when relevant",
  "Exact relationship between researched subject and applicant",
  "Marriage place/date and spouse identity when relevant",
  "Death place/date when relevant",
  "Specific intended use of the requested certificate",
] as const;

export const VASTOGIRARDI_ATTACHMENTS = [
  "Copy of applicant identity document, unless an applicable signature exception in the form is used",
  "Proof reconstructing the family relationship from the researched ancestor to the applicant for record types 3, 4, 11, 12, and 13",
  "Proof of payment of the required administrative contribution when applicable",
  "Signed delegation plus delegate identity document when a delegated request is used",
  "Any other supporting attachment required for the specific request",
] as const;

export const VASTOGIRARDI_DELIVERY_METHODS = [
  "Postal shipment to a specified address",
  "PEC delivery to a specified certified-email address",
  "Ordinary email delivery to a specified address",
] as const;

export const VASTOGIRARDI_HISTORICAL_FEES = [
  {
    amountEur: 150,
    condition:
      "Request states the exact year of formation of the record, the date of birth, and the name of the person concerned.",
  },
  {
    amountEur: 300,
    condition:
      "Request does not state the exact year of formation of the record, the date of birth, and the name of the person concerned.",
  },
] as const;

export const VASTOGIRARDI_SOURCE_RULES = [
  "The form states that the administrative contribution must be paid when the application is submitted or the request is inadmissible.",
  "The form states that the contribution is not refundable when the historical search has a negative result.",
  "For a birth extract showing parents, the form identifies the adult subject, a parent/person exercising parental responsibility for a minor, or a formally delegated third party as eligible request paths.",
  "For full copies, the form identifies the person to whom the record refers or a motivated request demonstrating a personal and concrete interest connected to protection of a legally relevant situation.",
  "These are source-derived administrative requirements, not Milano legal conclusions. Operator must not infer client eligibility.",
] as const;

export const ITALY_RECORD_OPERATOR_GATES = [
  "Confirm the Comune that actually holds the record before preparing a request.",
  "Use the current authority form; do not assume Vastogirardi requirements apply to another Comune.",
  "Do not infer entitlement to parentage data or full copies.",
  "Preserve relationship evidence and payment receipt in the Matter record.",
  "Do not promise issuance, search success, or processing time unless the authority confirms it.",
  "Route legal interpretation questions back to the client or their attorney; Milano coordinates execution and administrative submission support only.",
] as const;
