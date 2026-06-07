export type ChecklistType =
  | "GENERAL_NOTARY_QA"
  | "RON_QA"
  | "APOSTILLE_PACKET_QA"
  | "COURIER_PACKET_QA"
  | "INTERNATIONAL_PRIVATE_CLIENT_QA";

export interface ChecklistItem {
  key: string;
  label: string;
  required: boolean;
}

const CHECKLISTS: Record<ChecklistType, ChecklistItem[]> = {
  GENERAL_NOTARY_QA: [
    { key: "signer_signed", label: "Signer signed where required", required: true },
    { key: "notary_cert_complete", label: "Notary certificate complete", required: true },
    { key: "venue_complete", label: "Venue / county complete", required: true },
    { key: "date_complete", label: "Date complete", required: true },
    { key: "seal_present", label: "Notary seal present", required: true },
    { key: "commission_present", label: "Commission information present", required: true },
    { key: "id_method_recorded", label: "ID method recorded", required: true },
    { key: "pages_complete", label: "Document pages complete", required: true },
  ],
  RON_QA: [
    { key: "ron_cert_complete", label: "RON certificate complete", required: true },
    { key: "electronic_seal", label: "Electronic seal present", required: true },
    { key: "electronic_signature", label: "Electronic signature present", required: true },
    { key: "identity_result_reviewed", label: "Signer identity result reviewed", required: true },
    { key: "kba_not_failed", label: "KBA / ID not failed", required: true },
    { key: "session_completed", label: "Session completed", required: true },
    { key: "signed_pdf_stored", label: "Signed PDF stored privately", required: true },
    { key: "apostille_readiness_reviewed", label: "Apostille readiness reviewed", required: false },
  ],
  APOSTILLE_PACKET_QA: [
    { key: "notarized_doc_included", label: "Notarized document included", required: true },
    { key: "certificate_type_reviewed", label: "Certificate type reviewed", required: true },
    { key: "destination_confirmed", label: "Destination country confirmed", required: true },
    { key: "route_confirmed", label: "State / federal route confirmed", required: true },
    { key: "translation_flag_reviewed", label: "Translation flag reviewed", required: true },
    { key: "cover_letter_included", label: "Cover letter included if needed", required: false },
    { key: "receiving_authority_captured", label: "Receiving authority captured if known", required: false },
  ],
  COURIER_PACKET_QA: [
    { key: "packet_complete", label: "Final document packet complete", required: true },
    { key: "folder_included", label: "Folder included", required: false },
    { key: "rigid_mailer", label: "Rigid mailer selected", required: true },
    { key: "tracking_label", label: "Tracking label generated", required: true },
    { key: "address_reviewed", label: "Destination address reviewed", required: true },
    { key: "customs_reviewed", label: "Customs / tax ID review if triggered", required: false },
    { key: "release_rule_understood", label: "Delivered-not-released rule understood", required: true },
  ],
  INTERNATIONAL_PRIVATE_CLIENT_QA: [
    { key: "document_type_confirmed", label: "Document type confirmed", required: true },
    { key: "country_confirmed", label: "Country confirmed", required: true },
    { key: "receiving_authority_captured", label: "Receiving authority captured if known", required: false },
    { key: "translation_reviewed", label: "Translation reviewed", required: true },
    { key: "apostille_route_reviewed", label: "Apostille / authentication route reviewed", required: true },
    { key: "release_instructions_confirmed", label: "Release instructions confirmed", required: true },
    { key: "coordinator_note_prepared", label: "Coordinator note prepared", required: false },
  ],
};

export function getChecklist(type: ChecklistType): ChecklistItem[] {
  return CHECKLISTS[type] ?? CHECKLISTS.GENERAL_NOTARY_QA;
}

export function listChecklistTypes(): ChecklistType[] {
  return Object.keys(CHECKLISTS) as ChecklistType[];
}
