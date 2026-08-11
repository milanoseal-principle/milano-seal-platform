/**
 * maritimeTrustEvents — canonical maritime Trust Chain event types. This is an
 * additive event-type registry (chain-of-custody VISIBILITY), NOT a second
 * custody engine. It carries no evidentiary or legal guarantee.
 */

export type MaritimeTrustEventType =
  | "request_received"
  | "commercial_account_verified"
  | "requester_authorized"
  | "matter_created"
  | "document_received"
  | "document_version_recorded"
  | "deadline_confirmed"
  | "signer_confirmed"
  | "execution_path_selected"
  | "payment_confirmed"
  | "scheduling_unlocked"
  | "operator_assigned"
  | "partner_assigned"
  | "execution_started"
  | "execution_completed"
  | "qa_started"
  | "qa_completed"
  | "authentication_started"
  | "authentication_completed"
  | "translation_started"
  | "translation_completed"
  | "courier_prepared"
  | "courier_released"
  | "in_transit"
  | "delivery_confirmed"
  | "release_authorized"
  | "client_released"
  | "matter_completed"
  | "archived";

export const MARITIME_TRUST_EVENT_SEQUENCE: MaritimeTrustEventType[] = [
  "request_received", "requester_authorized", "matter_created", "document_received",
  "deadline_confirmed", "signer_confirmed", "execution_path_selected",
  "payment_confirmed", "scheduling_unlocked", "operator_assigned",
  "execution_started", "execution_completed", "qa_completed",
  "authentication_completed", "courier_released", "delivery_confirmed",
  "release_authorized", "client_released", "matter_completed",
];

/** Public-facing term — visibility only; never an evidentiary/legal guarantee. */
export const MARITIME_TRUST_CHAIN_PUBLIC_TERM = "Chain-of-Custody Visibility";
