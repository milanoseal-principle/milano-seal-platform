import { COUNSEL_PRIMARY_PRACTICE_AREAS } from "@/data/counsel-intelligence";

// Uses existing professional/country routes, not another corridor routing engine.
export const COUNSEL_CORRIDORS = [
  "italy",
  "spain",
  "portugal",
  "greece",
  "brazil",
  "mexico",
  "france",
  "germany",
  "uae",
] as const;
export const COUNSEL_USE_CASES = [
  {
    slug: "private-client",
    title: COUNSEL_PRIMARY_PRACTICE_AREAS[0],
    situation:
      "A private client is in the United States while their overseas counsel needs a signed instrument or U.S.-origin record.",
    examples: "Powers of attorney, affidavits and existing public records",
    needs:
      "Destination, document origin, the intended recipient and whether the client needs to sign",
    delay:
      "An incomplete instrument or an unclear receiving party can prevent execution-readiness review.",
    authority: "/services/private-client-apostille",
  },
  {
    slug: "immigration-nationality",
    title: COUNSEL_PRIMARY_PRACTICE_AREAS[1],
    situation:
      "Counsel managing a nationality or immigration application needs execution support or U.S.-origin records for an overseas submission.",
    examples:
      "Client affidavits, identity-related declarations and existing U.S. records",
    needs:
      "Issuing jurisdiction, destination and the authority's written document instructions",
    delay:
      "A scan may not replace an issuing-authority original or certified record; the exact document must be reviewed.",
    authority: "/services/immigration-documents",
  },
  {
    slug: "citizenship",
    title: "Citizenship matters",
    situation:
      "Citizenship counsel needs a client in the United States to execute a declaration or coordinate U.S.-origin supporting records.",
    examples: "Citizenship declarations and civil records selected by counsel",
    needs:
      "Counsel's document list, issuing authority and submission instructions",
    delay:
      "Name discrepancies, document versions and uncertain issuing authorities may require clarification before coordination.",
    authority: "/documents/birth-certificate-apostille",
  },
  {
    slug: "international-real-estate",
    title: COUNSEL_PRIMARY_PRACTICE_AREAS[2],
    situation:
      "A client or signatory in the United States must execute documents for a property transaction abroad.",
    examples:
      "Transaction powers of attorney, declarations and counsel-prepared signing packets",
    needs:
      "The final instrument, signing location, transaction deadline and recipient instructions",
    delay:
      "Last-minute document changes or unconfirmed wet-ink, witness and recipient requirements can change execution logistics.",
    authority: "/documents/real-estate-documents-apostille",
  },
  {
    slug: "trusts-estates",
    title: "Trusts and estates",
    situation:
      "A U.S.-based beneficiary, principal or fiduciary needs to sign documents for an overseas estate or succession matter.",
    examples:
      "Counsel-prepared declarations, powers of attorney and estate-related affidavits",
    needs:
      "Who must sign, their location, instrument version and foreign counsel's instructions",
    delay:
      "Unclear signer capacity or incomplete recipient instructions must be resolved by counsel before execution.",
    authority: "/documents/trust-affidavit-apostille",
  },
  {
    slug: "private-wealth",
    title: "Private wealth",
    situation:
      "An adviser or family office coordinates a U.S.-based principal's document execution for an overseas institution.",
    examples:
      "Institution-provided authorization packets and private-asset declarations",
    needs:
      "Receiving institution, final document, principal's signing location and secure release instructions",
    delay:
      "Institution-specific requirements can differ from a generalized country route and require written confirmation.",
    authority: "/verticals/private-wealth",
  },
  {
    slug: "corporate",
    title: COUNSEL_PRIMARY_PRACTICE_AREAS[4],
    situation:
      "Corporate counsel needs U.S.-based signatories to execute a cross-border business document.",
    examples:
      "Resolutions, authorizations and transactional powers of attorney",
    needs:
      "Entity and signer details selected by counsel, document origin and recipient requirements",
    delay:
      "Unconfirmed signatory authority or an incomplete corporate record must return to counsel for resolution.",
    authority: "/services/corporate-documents",
  },
  {
    slug: "cross-border-family",
    title: COUNSEL_PRIMARY_PRACTICE_AREAS[5],
    situation:
      "Foreign family counsel needs a U.S.-based client to execute a document for an overseas family matter.",
    examples: "Counsel-drafted declarations, consents and powers of attorney",
    needs:
      "The instrument, signer location, destination and recipient's exact instructions",
    delay:
      "Sensitive facts and legal sufficiency stay with counsel; only information necessary for execution should be shared.",
    authority: "/services/affidavits",
  },
  {
    slug: "litigation-support",
    title: COUNSEL_PRIMARY_PRACTICE_AREAS[7],
    situation:
      "Counsel handling a dispute abroad needs execution or authentication coordination for a U.S.-based signatory or U.S.-origin document.",
    examples: "Counsel-prepared affidavits and document execution packets",
    needs:
      "Final instrument, document origin, deadline and receiving-authority instructions",
    delay:
      "Court-specific form, evidence and acceptance questions require counsel's judgment; Milano does not decide admissibility.",
    authority: "/services/international-affidavit-execution",
  },
  {
    slug: "maritime-yacht",
    title: COUNSEL_PRIMARY_PRACTICE_AREAS[6],
    situation:
      "Transaction counsel needs U.S.-based parties to execute documents for an overseas vessel transaction or registration.",
    examples:
      "Bills of sale, vessel authorizations and transaction powers of attorney",
    needs:
      "Document origin, parties' signing locations, recipient instructions and controlled release destination",
    delay:
      "Registry instructions and the relationship between originals and copies must be reviewed for the specific transaction.",
    authority: "/verticals/maritime",
  },
] as const;
export const COUNSEL_FAQ = [
  [
    "Can you handle the U.S. execution side?",
    "Milano coordinates execution-readiness review, signer logistics, eligible notarization, applicable authentication routing, custody and international release. The specific scope follows Matter Review System review.",
  ],
  [
    "Can I send the document directly?",
    "Yes. Send an account-free inquiry and optionally attach a PDF, JPEG or PNG through the private upload. Only receipt confirmed by the system is shown as received.",
  ],
  [
    "Can my U.S.-based client complete execution through Milano?",
    "Milano reviews the client's location, document and receiving-authority requirements before confirming an execution route. An established professional can use the existing signed client handoff.",
  ],
  [
    "Do I remain the client's lawyer?",
    "Yes. Counsel retains legal advice, strategy, representation, document substance and legal sufficiency. The Milano Seal is not a law firm and does not provide legal advice or legal representation.",
  ],
  [
    "Can Milano coordinate apostille or authentication?",
    "Where applicable to the reviewed document, Milano coordinates the appropriate authority pathway. Country membership alone does not establish eligibility or acceptance.",
  ],
  [
    "Can Milano coordinate custody and international release?",
    "Controlled custody, courier coordination and international release can form part of the reviewed scope. Release remains subject to the canonical Matter controls.",
  ],
  [
    "Can I track the Matter?",
    "Established professionals use the existing Professional Access workspace for their own referred Matters. Anonymous inquiry receipt does not grant Matter access.",
  ],
  [
    "What if the correct execution method is unknown?",
    "Send the context you know. A preference or URL parameter does not authorize RON or another execution method; governed review confirms the route before a private quote.",
  ],
  [
    "What if the receiving authority has special requirements?",
    "Include the recipient's written instructions. Counsel retains receiving-authority legal judgment, and final acceptance remains with that authority.",
  ],
  [
    "How do I start?",
    "Send a U.S. Matter for review without creating an account. Milano reviews the next step; any private quote, Wise payment and scheduling follow their existing controls.",
  ],
] as const;
