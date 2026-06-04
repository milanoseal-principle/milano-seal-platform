export type PacketRequirement = {
  id: string;
  label: string;
  required: boolean;
  notes?: string;
};

export type DocumentPacket = {
  id: string;
  name: string;
  description: string;
  document_requirements: PacketRequirement[];
  signer_requirements: PacketRequirement[];
  certificate_requirements: PacketRequirement[];
  apostille_path: string;
  translation_required: boolean;
  translation_notes?: string;
  courier_notes: string;
  release_checklist: PacketRequirement[];
};

const PACKETS: DocumentPacket[] = [
  {
    id: "italy_citizenship",
    name: "Italy Citizenship Packet",
    description:
      "Full document packet for Italian citizenship by descent (Jure Sanguinis) — apostille chain, translation, and consulate routing.",
    document_requirements: [
      { id: "birth_cert", label: "Birth Certificate — Original", required: true, notes: "Must be certified copy from issuing authority" },
      { id: "marriage_records", label: "Marriage Records (if applicable)", required: false, notes: "All marriages in lineage chain" },
      { id: "death_records", label: "Death Records (if applicable)", required: false, notes: "For deceased ancestors in chain" },
      { id: "italian_ancestor_docs", label: "Italian Ancestor Documentation", required: true, notes: "Proof of Italian birth/citizenship for qualifying ancestor" },
      { id: "naturalization_records", label: "Naturalization Records (if applicable)", required: false, notes: "USCIS records showing ancestor naturalized after child's birth" },
      { id: "government_id", label: "Government-Issued Photo ID", required: true },
    ],
    signer_requirements: [
      { id: "identity_verification", label: "Identity Verification — Notarized", required: true, notes: "RON or in-person notarization acceptable" },
      { id: "codice_fiscale", label: "Codice Fiscale Confirmation", required: true, notes: "Italian tax code — required by most Comuni" },
      { id: "lineage_affidavit", label: "Lineage Affidavit", required: false, notes: "Sworn statement of family lineage — required by some consulates" },
    ],
    certificate_requirements: [
      { id: "fl_acknowledgment", label: "Florida Acknowledgment or Jurat on Each Notarized Document", required: true },
      { id: "apostille_each", label: "Apostille for Each Notarized Document", required: true, notes: "Florida Secretary of State apostille" },
      { id: "clerk_cert", label: "County Clerk Certificate (if required)", required: false, notes: "Some documents require clerk certification before apostille" },
    ],
    apostille_path:
      "Florida Secretary of State → Italian Consulate if required by specific Comune. Confirm receiving Comune requirements before submission.",
    translation_required: true,
    translation_notes:
      "Certified Italian translation required for all documents not originally in Italian. Translator must include credentials and certification statement.",
    courier_notes:
      "International courier to Italian Consulate or direct to Comune. Confirm receiving address and attention line before label purchase. Track all shipments — consulates may refuse unscheduled deliveries.",
    release_checklist: [
      { id: "all_apostilled", label: "All documents apostilled", required: true },
      { id: "translation_complete", label: "Certified Italian translation complete", required: true },
      { id: "client_confirmation", label: "Client confirmed receipt address", required: true },
      { id: "operator_review", label: "Operator final review complete", required: true },
      { id: "invoice_cleared", label: "Invoice fully paid and cleared", required: true },
    ],
  },
  {
    id: "fbi_apostille",
    name: "FBI Background Check Apostille",
    description:
      "Apostille for FBI Identity History Summary (background check) — U.S. Department of State routing.",
    document_requirements: [
      { id: "fbi_identity_summary", label: "FBI Identity History Summary", required: true, notes: "Must be original — obtained directly from FBI or channeler" },
      { id: "government_id", label: "Government-Issued Photo ID", required: true },
    ],
    signer_requirements: [
      { id: "identity_notarization", label: "Notarized Identity Verification", required: false, notes: "Some countries require notarized copy alongside apostilled original" },
    ],
    certificate_requirements: [
      { id: "us_dos_apostille", label: "U.S. Department of State Apostille", required: true, notes: "FBI documents are federal — apostille issues through U.S. DOS, not state SOS" },
    ],
    apostille_path:
      "U.S. Department of State (Office of Authentications, Washington D.C.) — federal document, cannot be apostilled by state Secretary of State.",
    translation_required: false,
    courier_notes:
      "Ship to U.S. DOS Office of Authentications. Allow 6–10 business days standard processing. Expedited available. Include prepaid return label.",
    release_checklist: [
      { id: "dos_apostille_received", label: "DOS apostille received and verified", required: true },
      { id: "client_confirmation", label: "Client confirmed receipt address", required: true },
      { id: "invoice_cleared", label: "Invoice fully paid and cleared", required: true },
      { id: "operator_review", label: "Operator final review complete", required: true },
    ],
  },
  {
    id: "florida_ron_affidavit_italy",
    name: "Florida RON Affidavit to Italy",
    description:
      "Remotely Online Notarized affidavit executed in Florida for use in Italy — apostille chain and Italian translation.",
    document_requirements: [
      { id: "draft_affidavit", label: "Draft Affidavit (English)", required: true, notes: "Prepared by client or attorney — operator reviews for notarizability" },
      { id: "government_id", label: "Government-Issued Photo ID", required: true, notes: "Required for RON identity verification" },
      { id: "secondary_id", label: "Secondary ID or KBA Pass", required: false, notes: "May be required for KBA if primary ID insufficient" },
    ],
    signer_requirements: [
      { id: "ron_session", label: "RON Session — Florida Notary", required: true, notes: "Live audio-video session required; identity proofing and credential analysis" },
      { id: "kba_pass", label: "KBA Quiz Pass", required: true, notes: "Knowledge-based authentication — 5 questions, must pass threshold" },
      { id: "enotary_journal", label: "eNotary Journal Entry", required: true, notes: "Captured automatically by RON platform" },
    ],
    certificate_requirements: [
      { id: "fl_acknowledgment", label: "Florida Notarial Certificate (Acknowledgment or Jurat)", required: true },
      { id: "fl_sos_apostille", label: "Florida Secretary of State Apostille", required: true },
    ],
    apostille_path:
      "Florida Secretary of State. RON notarizations are valid for apostille in Florida. Confirm affidavit content is notarizeable before scheduling RON.",
    translation_required: true,
    translation_notes:
      "Certified Italian translation of affidavit and notarial certificate required. Translator must include AITI or equivalent certification.",
    courier_notes:
      "Ship apostilled original plus certified translation to Italian consulate or directly to recipient in Italy. Confirm recipient address before purchase.",
    release_checklist: [
      { id: "ron_complete", label: "RON session completed and recording archived", required: true },
      { id: "apostille_complete", label: "Florida apostille affixed", required: true },
      { id: "translation_complete", label: "Certified Italian translation complete", required: true },
      { id: "client_confirmation", label: "Client confirmed delivery address", required: true },
      { id: "invoice_cleared", label: "Invoice fully paid and cleared", required: true },
    ],
  },
  {
    id: "uae_corporate_legalization",
    name: "UAE Corporate Legalization",
    description:
      "Full legalization chain for corporate documents destined for the UAE — notarization, state apostille, UAE Embassy attestation.",
    document_requirements: [
      { id: "articles_of_incorporation", label: "Articles of Incorporation / Certificate of Formation", required: true, notes: "State-certified copy" },
      { id: "good_standing", label: "Certificate of Good Standing", required: true, notes: "Issued within 90 days" },
      { id: "poa_or_resolution", label: "Power of Attorney or Corporate Resolution", required: false, notes: "If authorizing a representative" },
      { id: "notarized_docs", label: "Any Documents Requiring Notarization", required: false },
    ],
    signer_requirements: [
      { id: "authorized_signer", label: "Authorized Corporate Signatory", required: true, notes: "Must match registered officer on state records" },
      { id: "notarization", label: "Notarized Signatures on Applicable Documents", required: true },
    ],
    certificate_requirements: [
      { id: "fl_sos_apostille", label: "Florida (or Relevant State) Secretary of State Apostille", required: true },
      { id: "uae_embassy_attestation", label: "UAE Embassy Attestation (Washington D.C.)", required: true, notes: "UAE does not accept apostille alone — full embassy attestation required" },
      { id: "mofa_attestation", label: "UAE MOFA Attestation (if required in-country)", required: false },
    ],
    apostille_path:
      "State Secretary of State apostille → UAE Embassy in Washington D.C. attestation. UAE is not a Hague Apostille Convention member for corporate documents — full legalization chain required.",
    translation_required: false,
    translation_notes:
      "Arabic translation may be required depending on receiving authority. Confirm with UAE counterpart before submission.",
    courier_notes:
      "Coordinate with UAE Embassy for appointment-based drop-off or authorized service. Track all legs. Allow 10–15 business days for embassy processing.",
    release_checklist: [
      { id: "apostille_complete", label: "State apostille affixed", required: true },
      { id: "embassy_attestation", label: "UAE Embassy attestation complete", required: true },
      { id: "operator_review", label: "Operator final review complete", required: true },
      { id: "client_confirmation", label: "Client confirmed delivery address in UAE", required: true },
      { id: "invoice_cleared", label: "Invoice fully paid and cleared", required: true },
    ],
  },
  {
    id: "mexico_poa",
    name: "Mexico Power of Attorney",
    description:
      "Notarized and apostilled Power of Attorney for use in Mexico — Florida execution, SOS apostille.",
    document_requirements: [
      { id: "poa_draft", label: "Draft Power of Attorney (Spanish or Bilingual)", required: true, notes: "Prepared by grantor or attorney — must identify grantor, grantee, scope, and duration" },
      { id: "government_id", label: "Government-Issued Photo ID — Grantor", required: true },
      { id: "grantee_id", label: "Grantee Information / ID (if required)", required: false },
    ],
    signer_requirements: [
      { id: "notarization", label: "Notarized Signature — Grantor", required: true, notes: "In-person or RON acceptable in Florida" },
      { id: "witness", label: "Two Witnesses (if required by POA type)", required: false, notes: "Florida law may require witnesses depending on POA form" },
    ],
    certificate_requirements: [
      { id: "fl_acknowledgment", label: "Florida Acknowledgment Certificate", required: true },
      { id: "fl_sos_apostille", label: "Florida Secretary of State Apostille", required: true },
    ],
    apostille_path:
      "Florida Secretary of State. Mexico is a Hague Convention signatory — apostille is accepted without additional embassy legalization in most cases.",
    translation_required: false,
    translation_notes:
      "POA drafted in Spanish preferred for Mexican use. Certified Spanish translation required if original is in English only.",
    courier_notes:
      "Ship to Mexico address or local notario público as directed by client. Use tracked international courier. Confirm recipient details before label purchase.",
    release_checklist: [
      { id: "apostille_complete", label: "Florida apostille affixed", required: true },
      { id: "translation_complete", label: "Spanish translation complete (if applicable)", required: false },
      { id: "client_confirmation", label: "Client confirmed delivery address", required: true },
      { id: "invoice_cleared", label: "Invoice fully paid and cleared", required: true },
      { id: "operator_review", label: "Operator final review complete", required: true },
    ],
  },
  {
    id: "yacht_sale",
    name: "Yacht Sale Document Packet",
    description:
      "Document packet for international yacht sale — USCG documentation, bill of sale, apostille, and flag state coordination.",
    document_requirements: [
      { id: "bill_of_sale", label: "Bill of Sale", required: true, notes: "Must identify vessel by HIN, name, LOA, and flag state" },
      { id: "uscg_abstract", label: "USCG Abstract of Title", required: true, notes: "Confirms clear title — order from USCG NVD" },
      { id: "uscg_deletion_cert", label: "USCG Deletion Certificate (if re-flagging)", required: false, notes: "Required if vessel is being deleted from USCG documentation" },
      { id: "corporate_authorization", label: "Corporate Authorization (if corporate seller)", required: false },
      { id: "government_id", label: "Seller Government-Issued Photo ID", required: true },
    ],
    signer_requirements: [
      { id: "seller_notarization", label: "Notarized Seller Signature on Bill of Sale", required: true },
      { id: "buyer_notarization", label: "Notarized Buyer Acknowledgment (if required by flag state)", required: false },
    ],
    certificate_requirements: [
      { id: "fl_sos_apostille", label: "Florida Secretary of State Apostille (if applicable)", required: false, notes: "Required only if vessel is re-flagging to Hague signatory country" },
      { id: "flag_state_cert", label: "Flag State Certificate of Deletion / Registration", required: false, notes: "Coordinate with vessel's flag state registry" },
    ],
    apostille_path:
      "Depends on buyer's flag state. For Hague signatory countries: Florida SOS apostille. For non-signatories: full consular legalization chain. Confirm flag state requirements early.",
    translation_required: false,
    translation_notes:
      "Translation required if flag state or port of registry requires local language documentation.",
    courier_notes:
      "Coordinate with closing agent or flag state registry for delivery. USCG documents may have specific submission instructions. Use tracked courier and retain copies of all originals.",
    release_checklist: [
      { id: "title_clear", label: "USCG Abstract confirms clear title", required: true },
      { id: "bill_of_sale_executed", label: "Notarized bill of sale executed", required: true },
      { id: "apostille_complete", label: "Apostille affixed (if applicable)", required: false },
      { id: "flag_state_submitted", label: "Flag state submission coordinated", required: false },
      { id: "client_confirmation", label: "Client confirmed delivery/closing details", required: true },
      { id: "invoice_cleared", label: "Invoice fully paid and cleared", required: true },
    ],
  },
  {
    id: "estate_probate_foreign",
    name: "Estate / Probate Foreign Use Packet",
    description:
      "Packet for probate and estate documents intended for foreign jurisdiction — letters testamentary, death certificates, apostille chain.",
    document_requirements: [
      { id: "letters_testamentary", label: "Letters Testamentary / Letters of Administration", required: true, notes: "Certified by clerk of court — must be recent (within 60–90 days)" },
      { id: "death_certificate", label: "Certified Death Certificate", required: true, notes: "Issued by state vital records office" },
      { id: "will_extract", label: "Will or Probate Order Extract (if required)", required: false },
      { id: "pr_affidavit", label: "Personal Representative Affidavit", required: false, notes: "Some foreign authorities require sworn PR statement" },
    ],
    signer_requirements: [
      { id: "pr_notarization", label: "Personal Representative Notarized Signature (if applicable)", required: false },
      { id: "clerk_cert", label: "Clerk of Court Certification on Letters Testamentary", required: true },
    ],
    certificate_requirements: [
      { id: "fl_sos_apostille", label: "Florida Secretary of State Apostille", required: true },
      { id: "clerk_cert_verified", label: "Clerk Certification Verified and Current", required: true },
    ],
    apostille_path:
      "Florida Secretary of State (for Florida probate). Death certificates from Florida Vital Statistics may require separate apostille chain. Confirm receiving country's requirements.",
    translation_required: false,
    translation_notes:
      "Certified translation required for all documents if destination country requires local language. Confirm with foreign estate attorney.",
    courier_notes:
      "Ship to foreign estate attorney, bank, or registry as directed. Retain certified copies before shipping originals. Use tracked courier.",
    release_checklist: [
      { id: "letters_current", label: "Letters testamentary current and apostilled", required: true },
      { id: "death_cert_apostilled", label: "Death certificate apostilled", required: true },
      { id: "translation_complete", label: "Certified translation complete (if applicable)", required: false },
      { id: "client_confirmation", label: "Client confirmed receiving authority address", required: true },
      { id: "invoice_cleared", label: "Invoice fully paid and cleared", required: true },
      { id: "operator_review", label: "Operator final review complete", required: true },
    ],
  },
  {
    id: "general_apostille",
    name: "General State Apostille",
    description:
      "Standard apostille for notarized documents executed in Florida for use in any Hague Convention signatory country.",
    document_requirements: [
      { id: "notarized_document", label: "Original Notarized Document", required: true, notes: "Must bear live ink notarial signature and seal" },
      { id: "government_id", label: "Signer Government-Issued Photo ID", required: true },
    ],
    signer_requirements: [
      { id: "notarization", label: "Florida Notary Signature and Seal", required: true, notes: "In-person or RON — must be valid Florida commission" },
    ],
    certificate_requirements: [
      { id: "fl_sos_apostille", label: "Florida Secretary of State Apostille", required: true },
    ],
    apostille_path:
      "Florida Secretary of State, Division of Corporations. Standard 5–7 business day processing. Expedited (1–2 day) available for additional fee.",
    translation_required: false,
    translation_notes:
      "Certified translation required if destination country requires local language. Translation is separate from apostille and must be done after apostille is affixed (or apostille translation separately).",
    courier_notes:
      "Ship to client or direct to foreign recipient as instructed. Confirm destination country is Hague signatory. If not, full embassy legalization chain required instead.",
    release_checklist: [
      { id: "notarization_verified", label: "Notarial execution verified", required: true },
      { id: "apostille_complete", label: "Florida SOS apostille affixed", required: true },
      { id: "translation_complete", label: "Certified translation complete (if applicable)", required: false },
      { id: "client_confirmation", label: "Client confirmed delivery address", required: true },
      { id: "invoice_cleared", label: "Invoice fully paid and cleared", required: true },
    ],
  },
];

export function getPacket(id: string): DocumentPacket | null {
  return PACKETS.find((p) => p.id === id) ?? null;
}

export function listPackets(): Array<{ id: string; name: string; description: string }> {
  return PACKETS.map(({ id, name, description }) => ({ id, name, description }));
}
