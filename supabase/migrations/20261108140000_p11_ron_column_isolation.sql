-- P11 (RON slice): column-level read isolation for authenticated users on RON tables.
-- Row policies from 062 still decide WHICH rows a client/operator may read; this limits WHICH columns.
-- raw_session, encrypted signing URLs, contact data, statutory evidence references and operator
-- verification fields become service-role only. All application reads use the service role.
begin;

revoke select on public.ron_sessions from authenticated;
grant select (id, matter_id, milano_ron_status, ron_lifecycle_state, identity_status, kba_status, biometric_status,
  document_tagging_status, payment_gate_status, session_url_status, final_documents_status, scheduled_at,
  started_at, completed_at, expired_at, requested_at, provider_session_completed_at, created_at, updated_at)
  on public.ron_sessions to authenticated;

revoke select on public.ron_signers from authenticated;
grant select (id, ron_session_id, matter_id, signer_index, first_name, last_name, party_role, signing_url_released,
  identity_status, kba_status, biometric_status, joined_at, left_at, completed_at, created_at, updated_at)
  on public.ron_signers to authenticated;

revoke select on public.ron_documents from authenticated;
grant select (id, ron_session_id, matter_id, document_name, document_type, signed_document_received, document_status,
  executed_sha256, executed_captured_at, created_at, updated_at)
  on public.ron_documents to authenticated;

revoke insert, update, delete on public.ron_sessions, public.ron_signers, public.ron_documents, public.ron_audit_events from anon, authenticated;
revoke all on public.ron_sessions, public.ron_signers, public.ron_documents, public.ron_audit_events from anon;

commit;
