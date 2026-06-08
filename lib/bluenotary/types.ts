// BlueNotary RON — TypeScript types
// NEVER expose signing URLs, base64 content, or credentials client-side.

export type MilanoRONStatus =
  | 'RON_DRAFT'
  | 'READY_FOR_RON'
  | 'RON_SESSION_CREATED'
  | 'SIGNER_INVITED'
  | 'SIGNING_LINK_RELEASED'
  | 'IDENTITY_STARTED'
  | 'PHOTO_ID_PASSED'
  | 'PHOTO_ID_FAILED'
  | 'BIOMETRICS_PASSED'
  | 'KBA_STARTED'
  | 'KBA_PASSED'
  | 'KBA_FAILED'
  | 'NOTARY_ACCEPTED'
  | 'SESSION_JOINED'
  | 'SESSION_LEFT'
  | 'SESSION_STARTED'
  | 'SESSION_PROCESSING'
  | 'RON_COMPLETED'
  | 'RON_EXPIRED'
  | 'RON_REVIEW_REQUIRED'
  | 'SIGNED_DOCS_RETRIEVED'
  | 'READY_FOR_APOSTILLE';

// ── BlueNotary API Payloads ───────────────────────────────────────────────────

export interface BNCreateSessionPayload {
  notarization_id: string;
  signing_type?: string;
  session_type?: string;
  notarization_timing_type?: string;
  session_timing?: string; // ISO 8601
  signers: BNSignerPayload[];
  documents?: BNDocumentPayload[];
}

export interface BNSignerPayload {
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone?: string;
  state?: string;
  authentication_type?: string;
  signer_index?: number;
}

export interface BNDocumentPayload {
  document_name: string;
  base64_content: string; // NEVER log or persist after upload
  template_id?: string;
  smart_tags?: string[];
}

export interface BNReschedulePayload {
  session_timing: string; // ISO 8601
}

// ── BlueNotary API Response Objects ──────────────────────────────────────────

export interface BNSession {
  id: string;
  notarization_id: string;
  status: string;
  session_type?: string;
  notarization_timing_type?: string;
  session_timing?: string;
  signers?: BNSigner[];
  documents?: BNDocument[];
  created_at?: string;
  updated_at?: string;
}

export interface BNSigner {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  signing_url?: string; // NEVER log or expose unless gate conditions met
  identity_status?: string;
  kba_status?: string;
  biometric_status?: string;
}

export interface BNDocument {
  id?: string;
  document_name: string;
  status?: string;
  template_id?: string;
  smart_tags_applied?: boolean;
}

export interface BNSignedDocumentResult {
  document_name: string;
  base64_content: string; // NEVER persist — decode immediately
  content_type?: string;
}

// ── BlueNotary Webhook Event ──────────────────────────────────────────────────

export interface BNWebhookPayload {
  notarization_id?: string;
  bn_session_id?: string;
  event_type: string;
  message?: string;
  event_by_email?: string;
  event_by_name?: string;
  signer_email?: string;
  timestamp?: string;
  [key: string]: unknown;
}

// ── Internal RON DB Records ───────────────────────────────────────────────────

export interface RONSession {
  id: string;
  matter_id: string;
  notarization_id: string;
  bn_session_id?: string | null;
  signing_type: string;
  session_type?: string | null;
  notarization_timing_type?: string | null;
  session_timing?: string | null;
  blue_notary_status: string;
  milano_ron_status: MilanoRONStatus;
  identity_status: string;
  kba_status: string;
  biometric_status: string;
  document_tagging_status: string;
  payment_gate_status: string;
  session_url_status: string;
  final_documents_status: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  expired_at?: string | null;
}

export interface RONSigner {
  id: string;
  ron_session_id: string;
  matter_id?: string | null;
  signer_index?: number | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  state?: string | null;
  authentication_type?: string | null;
  signing_url_encrypted?: string | null;
  signing_url_released: boolean;
  identity_status: string;
  kba_status: string;
  biometric_status: string;
  joined_at?: string | null;
  left_at?: string | null;
  completed_at?: string | null;
}

export interface RONDocument {
  id: string;
  ron_session_id: string;
  matter_id?: string | null;
  document_id?: string | null;
  document_name?: string | null;
  document_type?: string | null;
  blue_notary_document_name?: string | null;
  template_id?: string | null;
  smart_tags_applied: boolean;
  uploaded_to_bluenotary: boolean;
  signed_document_received: boolean;
  storage_path?: string | null;
  signed_storage_path?: string | null;
  document_status: string;
}

// ── Portal-safe projection ────────────────────────────────────────────────────

export interface PortalRONView {
  session_id: string;
  milano_ron_status: MilanoRONStatus;
  client_label: string;
  payment_confirmed: boolean;
  session_active: boolean;
  signing_url?: string | null; // only set when all release conditions met
  coordinator_message?: string;
  identity_status?: string;
  kba_status?: string;
}
