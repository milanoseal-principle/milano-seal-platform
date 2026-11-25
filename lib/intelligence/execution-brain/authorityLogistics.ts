// Authority logistics: Matter-linked physical shipment legs over the EXISTING
// Shippo + custody architecture. Not a second shipping engine: rates come from
// the existing Shippo client, the approved-carrier policy and the governed
// rate ranking; tracking arrives through the existing HMAC-verified courier
// webhook; custody history stays in the canonical custody ledger.
//
// Shipment legs are logistics evidence. A delivered leg never completes,
// releases or closes a Matter — completion remains a separately governed
// operator transition. Provider identifiers, the raw label URL, internal rate
// ids and costs never leave operator surfaces.

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MATTER_STATES } from "@/data/matter-state-machine";
import { validateMilanoShippingAddress } from "@/lib/shippo/address";
import { APPROVED_CARRIERS, filterApprovedRates } from "@/lib/shippo/carrierPolicy";
import {
  partitionComparableRates,
  RATE_COMPARISON_CURRENCY,
  rankApprovedRates,
  type RankedShippoRate,
} from "@/lib/shippo/rateSelection";
import type { ShippoAddress, ShippoRate } from "@/lib/shippo/types";
import type { AuthorityPacketProjection } from "./authorityPacket";

export const SHIPMENT_LEG_TYPES = [
  "outbound_to_authority",
  "return_from_authority",
  "final_to_client",
  "final_international",
  "exception_return",
] as const;
export type ShipmentLegType = (typeof SHIPMENT_LEG_TYPES)[number];

export type ShipmentLegDirection = "outbound" | "return" | "final" | "exception";
export const LEG_DIRECTION: Readonly<Record<ShipmentLegType, ShipmentLegDirection>> = {
  outbound_to_authority: "outbound",
  return_from_authority: "return",
  final_to_client: "final",
  final_international: "final",
  exception_return: "exception",
};

export type LabelStatus = "not_created" | "rate_selected" | "purchase_pending" | "created" | "voided" | "error";
export type LegCustodyStatus =
  | "not_started"
  | "prepared"
  | "handoff_ready"
  | "carrier_accepted"
  | "in_transit"
  | "authority_received"
  | "return_in_transit"
  | "received_back"
  | "final_handoff"
  | "delivered"
  | "exception";

export interface ShipmentLegRow {
  id: string;
  matter_id: string;
  shipment_record_id?: string | null;
  provider: string;
  provider_shipment_id: string | null;
  provider_transaction_id: string | null;
  leg_type: ShipmentLegType;
  sequence: number;
  direction: ShipmentLegDirection;
  origin_json: Record<string, unknown>;
  destination_json: Record<string, unknown>;
  rate_snapshot: RateSnapshot | null;
  carrier: string | null;
  service_level: string | null;
  label_status: LabelStatus;
  tracking_number: string | null;
  tracking_status: string | null;
  custody_status: LegCustodyStatus;
  provider_evidence: Record<string, unknown>;
  exception_reason?: string | null;
  label_created_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at?: string;
}

/** Non-secret, auditable record of the exact governed rate selected. */
export interface RateSnapshot {
  provider_rate_id: string;
  carrier: string;
  service: string;
  service_token: string | null;
  amount: string;
  currency: string;
  estimated_days: number | null;
  rank: number;
  recommended: boolean;
  selection_policy: string;
  selection_reason: string;
  selected_at: string;
  selected_by: string;
}

/** Matter facts the final-shipment gates read (canonical Matter columns only). */
export interface LogisticsMatterFacts {
  id: string;
  state: string | null;
  apostilleRequired: boolean | null;
  releaseFrozen: boolean | null;
  isPaidAndReleased: boolean | null;
}

export type LegGateCode =
  | "PACKET_NOT_DISPATCH_READY"
  | "RETURN_NOT_REQUIRED"
  | "RETURN_LABEL_REVIEW_REQUIRED"
  | "OPERATOR_REQUEST_REQUIRED"
  | "ADDRESS_INVALID"
  | "CARRIER_POLICY_UNAVAILABLE"
  | "LEG_ALREADY_ACTIVE"
  | "APOSTILLE_NOT_COMPLETE"
  | "FINAL_PAYMENT_REQUIRED"
  | "RELEASE_GATE_NOT_SATISFIED"
  | "FINAL_DESTINATION_MISMATCH"
  | "EXCEPTION_REASON_REQUIRED"
  | "RATE_EXPIRED"
  | "COURIER_CURRENCY_REVIEW_REQUIRED";

export interface LegGateResult {
  allowed: boolean;
  code: LegGateCode | null;
  reasons: string[];
}

const stateIndex = (state: string | null | undefined) => (state ? (MATTER_STATES as readonly string[]).indexOf(state) : -1);
const NON_PROGRESS_STATES = new Set(["apostille_rejected", "dormant", "lost", "cancelled", "document_correction_required", "needs_client_info"]);

function gate(checks: Array<[boolean, LegGateCode, string]>): LegGateResult {
  const failed = checks.filter(([ok]) => !ok);
  return {
    allowed: failed.length === 0,
    code: failed[0]?.[1] ?? null,
    reasons: failed.map(([, , reason]) => reason),
  };
}

function addressErrors(address: unknown): string[] {
  if (!address || typeof address !== "object") return ["Address is missing."];
  return validateMilanoShippingAddress(address as ShippoAddress);
}

const isActive = (leg: Pick<ShipmentLegRow, "custody_status">) => leg.custody_status !== "exception";

/** Canonical final-payment evidence: the Matter state machine only reaches
 * final_payment_confirmed (and later) with a confirmed Wise final payment. */
export function finalPaymentSatisfied(matter: LogisticsMatterFacts): boolean {
  if (matter.isPaidAndReleased === true) return true;
  if (!matter.state || NON_PROGRESS_STATES.has(matter.state)) return false;
  return stateIndex(matter.state) >= stateIndex("final_payment_confirmed");
}

/** Canonical release gate: ready_for_release (or later) and not frozen. */
export function releaseGateSatisfied(matter: LogisticsMatterFacts): boolean {
  if (matter.releaseFrozen === true) return false;
  if (!matter.state || NON_PROGRESS_STATES.has(matter.state)) return false;
  return stateIndex(matter.state) >= stateIndex("ready_for_release");
}

/** Authentication completion from the operator-governed Matter state. */
export function authenticationComplete(matter: LogisticsMatterFacts): boolean {
  if (matter.apostilleRequired === false) return true;
  if (!matter.state || NON_PROGRESS_STATES.has(matter.state)) return false;
  return stateIndex(matter.state) >= stateIndex("apostille_received");
}

export interface LegReadinessInput {
  legType: ShipmentLegType;
  matter: LogisticsMatterFacts;
  packet: Pick<AuthorityPacketProjection, "packetStatus" | "returnShippingRequired"> | null;
  existingLegs: readonly Pick<ShipmentLegRow, "leg_type" | "custody_status">[];
  origin: unknown;
  destination: unknown;
  operatorRequest: {
    explicitReturnRequest?: boolean;
    releaseActionConfirmed?: boolean;
    exceptionReason?: string | null;
  };
}

/** Creation gate for each leg type. Fails closed with a specific code. */
export function evaluateShipmentLegReadiness(input: LegReadinessInput): LegGateResult {
  const { legType, matter, packet, existingLegs, operatorRequest } = input;
  const originErrors = addressErrors(input.origin);
  const destinationErrors = addressErrors(input.destination);
  const duplicate =
    legType !== "exception_return" && existingLegs.some((leg) => leg.leg_type === legType && isActive(leg));
  const common: Array<[boolean, LegGateCode, string]> = [
    [!duplicate, "LEG_ALREADY_ACTIVE", `An active ${legType.replaceAll("_", " ")} leg already exists.`],
    [originErrors.length === 0, "ADDRESS_INVALID", `Origin: ${originErrors.join(" ")}`],
    [destinationErrors.length === 0, "ADDRESS_INVALID", `Destination: ${destinationErrors.join(" ")}`],
    [APPROVED_CARRIERS.length > 0, "CARRIER_POLICY_UNAVAILABLE", "No approved carrier is configured."],
  ];

  if (legType === "outbound_to_authority") {
    return gate([
      [packet?.packetStatus === "READY_FOR_DISPATCH", "PACKET_NOT_DISPATCH_READY", `Authority packet is ${packet?.packetStatus?.replaceAll("_", " ").toLowerCase() ?? "not built"}; it must be ready for dispatch.`],
      ...common,
    ]);
  }
  if (legType === "return_from_authority") {
    return gate([
      [packet?.returnShippingRequired === true, "RETURN_NOT_REQUIRED", "The authority packet does not require a prepaid return shipment."],
      [
        packet?.packetStatus === "READY_FOR_DISPATCH" || packet?.packetStatus === "DISPATCHED",
        "RETURN_LABEL_REVIEW_REQUIRED",
        "The authority packet stage does not permit a return leg.",
      ],
      [operatorRequest.explicitReturnRequest === true, "OPERATOR_REQUEST_REQUIRED", "The operator must explicitly request the return leg."],
      ...common,
    ]);
  }
  if (legType === "final_to_client" || legType === "final_international") {
    const destinationCountry = String((input.destination as ShippoAddress | null)?.country ?? "").toUpperCase();
    return gate([
      [authenticationComplete(matter), "APOSTILLE_NOT_COMPLETE", "Authentication / apostille completion is not recorded on the Matter."],
      [finalPaymentSatisfied(matter), "FINAL_PAYMENT_REQUIRED", "The required Wise final payment is not confirmed."],
      [releaseGateSatisfied(matter), "RELEASE_GATE_NOT_SATISFIED", "The final release gate is not satisfied."],
      [
        legType !== "final_international" || (destinationCountry !== "" && destinationCountry !== "US"),
        "FINAL_DESTINATION_MISMATCH",
        "A final international leg requires a non-U.S. destination.",
      ],
      [operatorRequest.releaseActionConfirmed === true, "OPERATOR_REQUEST_REQUIRED", "The operator must confirm the release action."],
      ...common,
    ]);
  }
  return gate([
    [String(operatorRequest.exceptionReason ?? "").trim().length >= 10, "EXCEPTION_REASON_REQUIRED", "An exception return requires a documented reason."],
    ...common,
  ]);
}

/**
 * Milano governance window for a persisted rate snapshot. A snapshot older
 * than this must be re-quoted before purchase: provider rates can change or
 * expire, and an old snapshot is not current evidence of the price Milano
 * approved. This is Milano policy, not a provider guarantee of validity.
 */
export const RATE_SNAPSHOT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Freshness + governed-currency checks on the exact snapshot to be purchased. */
export function rateSnapshotChecks(
  snapshot: Pick<RateSnapshot, "selected_at" | "currency"> | null | undefined,
  now: Date = new Date(),
): Array<[boolean, LegGateCode, string]> {
  if (!snapshot) return [];
  const selectedAt = Date.parse(String(snapshot.selected_at ?? ""));
  const fresh = Number.isFinite(selectedAt) && now.getTime() - selectedAt <= RATE_SNAPSHOT_MAX_AGE_MS && selectedAt <= now.getTime() + 60_000;
  const currencyOk = String(snapshot.currency ?? "").trim().toUpperCase() === RATE_COMPARISON_CURRENCY;
  return [
    [fresh, "RATE_EXPIRED", "The selected rate snapshot is older than the governed 24-hour window; re-quote before purchase."],
    [currencyOk, "COURIER_CURRENCY_REVIEW_REQUIRED", `The selected rate is not in ${RATE_COMPARISON_CURRENCY}; courier credit and cost review is required.`],
  ];
}

/**
 * GENERATE RETURN LABEL gate. Any missing prerequisite yields
 * RETURN_LABEL_REVIEW_REQUIRED; success is never fabricated.
 */
export function evaluateReturnLabelReadiness(input: {
  leg: Pick<ShipmentLegRow, "leg_type" | "label_status" | "rate_snapshot" | "matter_id">;
  matterId: string;
  packet: Pick<AuthorityPacketProjection, "packetStatus" | "returnShippingRequired"> | null;
  explicitRequest: boolean;
  now?: Date;
}): LegGateResult {
  const { leg, packet } = input;
  const result = gate([
    [leg.matter_id === input.matterId, "RETURN_LABEL_REVIEW_REQUIRED", "The leg is not linked to this Matter."],
    [leg.leg_type === "return_from_authority", "RETURN_LABEL_REVIEW_REQUIRED", "Not a return-from-authority leg."],
    [packet?.returnShippingRequired === true, "RETURN_LABEL_REVIEW_REQUIRED", "The authority packet does not require a prepaid return."],
    [
      packet?.packetStatus === "READY_FOR_DISPATCH" || packet?.packetStatus === "DISPATCHED",
      "RETURN_LABEL_REVIEW_REQUIRED",
      "The authority packet stage does not permit return label creation.",
    ],
    [input.explicitRequest, "RETURN_LABEL_REVIEW_REQUIRED", "The operator must explicitly request the return label."],
    [leg.label_status === "rate_selected" && Boolean(leg.rate_snapshot), "RETURN_LABEL_REVIEW_REQUIRED", "A governed rate snapshot must be selected before purchase."],
    ...rateSnapshotChecks(leg.rate_snapshot, input.now),
  ]);
  return result;
}

/** Label purchase gate for every leg: leg, snapshot, operator authorization, current leg gate. */
export function evaluateLabelPurchaseReadiness(input: {
  leg: Pick<ShipmentLegRow, "label_status" | "rate_snapshot" | "matter_id">;
  matterId: string;
  operatorAuthorized: boolean;
  currentGate: LegGateResult;
  now?: Date;
}): LegGateResult {
  return gate([
    [input.leg.matter_id === input.matterId, "OPERATOR_REQUEST_REQUIRED", "The leg is not linked to this Matter."],
    [input.leg.label_status === "rate_selected" && Boolean(input.leg.rate_snapshot), "RETURN_LABEL_REVIEW_REQUIRED", "No persisted rate snapshot; a label cannot be purchased."],
    ...rateSnapshotChecks(input.leg.rate_snapshot, input.now),
    [input.operatorAuthorized, "OPERATOR_REQUEST_REQUIRED", "Explicit operator authorization is required to purchase a label."],
    [input.currentGate.allowed, input.currentGate.code ?? "OPERATOR_REQUEST_REQUIRED", input.currentGate.reasons.join(" ") || "The leg gate no longer passes."],
  ]);
}

/**
 * Governed rate selection over the EXISTING approved-carrier filter and
 * ranking. Never an absolute-cheapest pick across unapproved carriers; the
 * selected rate must be one of the ranked approved rates.
 */
export function selectGovernedRate(input: {
  rates: ShippoRate[];
  lane: string | null | undefined;
  destinationCountry: string | null | undefined;
  selectedRateId?: string | null;
  selectedBy: string;
  now?: Date;
}): { ranked: RankedShippoRate[]; snapshot: RateSnapshot | null; error: string | null } {
  const ranked = rankApprovedRates({
    rates: filterApprovedRates(input.rates),
    lane: input.lane,
    destinationCountry: input.destinationCountry,
  });
  if (input.selectedRateId && !ranked.some((entry) => entry.rate.object_id === input.selectedRateId)) {
    // An approved-carrier rate that was excluded for currency/amount is a
    // review case, not an unapproved carrier.
    const excluded = partitionComparableRates(filterApprovedRates(input.rates)).excluded.find(
      (entry) => entry.rate.object_id === input.selectedRateId,
    );
    if (excluded) {
      return {
        ranked,
        snapshot: null,
        error: excluded.reason === "CURRENCY_REVIEW_REQUIRED" ? "COURIER_CURRENCY_REVIEW_REQUIRED" : "SHIPPO_RATE_UNAVAILABLE",
      };
    }
  }
  if (ranked.length === 0) return { ranked, snapshot: null, error: "NO_APPROVED_CARRIER_RATE" };
  const chosen = input.selectedRateId ? ranked.find((entry) => entry.rate.object_id === input.selectedRateId) : ranked[0];
  if (!chosen) return { ranked, snapshot: null, error: "SELECTED_RATE_NOT_APPROVED" };
  const { rate } = chosen;
  const snapshot: RateSnapshot = {
    provider_rate_id: rate.object_id,
    carrier: rate.provider,
    service: rate.servicelevel.name,
    service_token: rate.servicelevel.token ?? null,
    amount: rate.amount,
    currency: rate.currency,
    estimated_days: typeof rate.estimated_days === "number" ? rate.estimated_days : null,
    rank: chosen.rank,
    recommended: chosen.recommended,
    selection_policy: chosen.selectionPolicy,
    selection_reason: chosen.recommended
      ? chosen.selectionReason
      : `Operator selected approved alternative (rank ${chosen.rank}) under ${chosen.selectionPolicy}.`,
    selected_at: (input.now ?? new Date()).toISOString(),
    selected_by: input.selectedBy,
  };
  return { ranked, snapshot, error: null };
}

/** Operator view of ranked rates: no provider rate id leaves this call except to operators. */
export function operatorRateOptions(ranked: RankedShippoRate[]) {
  return ranked.map(({ rate, rank, recommended, selectionPolicy, selectionReason }) => ({
    rate_id: rate.object_id,
    carrier: rate.provider,
    service: rate.servicelevel.name,
    amount: rate.amount,
    currency: rate.currency,
    estimated_days: rate.estimated_days ?? null,
    rank,
    recommended,
    selection_policy: selectionPolicy,
    selection_reason: selectionReason,
  }));
}

// ── Tracking → custody (mirrors record_shipment_leg_tracking) ──

const CUSTODY_ORDER: LegCustodyStatus[] = [
  "not_started",
  "prepared",
  "handoff_ready",
  "carrier_accepted",
  "final_handoff",
  "in_transit",
  "return_in_transit",
  "authority_received",
  "received_back",
  "delivered",
];
const TERMINAL: ReadonlySet<LegCustodyStatus> = new Set(["authority_received", "received_back", "delivered"]);

export function mapTrackingToLegCustody(legType: ShipmentLegType, current: LegCustodyStatus, rawStatus: string): LegCustodyStatus {
  const status = rawStatus.toUpperCase();
  let next: LegCustodyStatus = current;
  if (status === "TRANSIT" || status === "OUT_FOR_DELIVERY") next = legType === "return_from_authority" ? "return_in_transit" : "in_transit";
  else if (status === "DELIVERED")
    next = legType === "outbound_to_authority" ? "authority_received" : legType === "return_from_authority" ? "received_back" : "delivered";
  else if (status === "RETURNED" || status === "FAILURE") next = "exception";
  if (TERMINAL.has(current)) return current;
  if (next !== "exception" && CUSTODY_ORDER.indexOf(next) <= CUSTODY_ORDER.indexOf(current)) return current;
  return next;
}

/** Leg completion evidence: logistics complete only; never Matter completion. */
export function completeShipmentLegEvidence(leg: Pick<ShipmentLegRow, "leg_type" | "custody_status" | "delivered_at" | "completed_at">) {
  const expected: Record<ShipmentLegType, LegCustodyStatus> = {
    outbound_to_authority: "authority_received",
    return_from_authority: "received_back",
    final_to_client: "delivered",
    final_international: "delivered",
    exception_return: "delivered",
  };
  return {
    legComplete: leg.custody_status === expected[leg.leg_type],
    expectedTerminalCustody: expected[leg.leg_type],
    completedAt: leg.custody_status === expected[leg.leg_type] ? leg.completed_at ?? leg.delivered_at : null,
    matterCompleted: false as const,
  };
}

export function trackingEventHash(input: { legId: string; trackingNumber: string; status: string; statusDate: string | null; substatus: string | null }) {
  return createHash("sha256")
    .update(["leg", input.legId, input.trackingNumber, input.status.toUpperCase(), input.statusDate ?? "", input.substatus ?? ""].join("|"))
    .digest("hex");
}

// ── Client-safe projection ──

export interface PublicShipmentLeg {
  sequence: number;
  shipment_stage: string;
  carrier: string | null;
  tracking_number: string | null;
  tracking_status: string | null;
  custody_stage: string;
  estimated_transit_days: number | null;
  delivered_at: string | null;
}

const PUBLIC_STAGE: Record<ShipmentLegType, string> = {
  outbound_to_authority: "Sent to authority",
  return_from_authority: "Returning from authority",
  final_to_client: "Final delivery",
  final_international: "Final international delivery",
  exception_return: "Return shipment",
};
const PUBLIC_CUSTODY: Record<LegCustodyStatus, string> = {
  not_started: "Preparing",
  prepared: "Preparing",
  handoff_ready: "Preparing",
  carrier_accepted: "With carrier",
  final_handoff: "With carrier",
  in_transit: "In transit",
  authority_received: "Received by authority",
  return_in_transit: "Returning",
  received_back: "Received by The Milano Seal",
  delivered: "Delivered",
  exception: "Under review",
};

/**
 * Portal-safe projection. Never includes provider transaction or shipment
 * ids, the label URL, internal rate ids, costs, provider evidence, exception
 * reasons or operator notes.
 */
export function publicShipmentLegProjection(leg: ShipmentLegRow, options: { trackingApproved: boolean }): PublicShipmentLeg {
  return {
    sequence: leg.sequence,
    shipment_stage: PUBLIC_STAGE[leg.leg_type],
    carrier: leg.label_status === "created" ? leg.carrier : null,
    tracking_number: options.trackingApproved && leg.label_status === "created" ? leg.tracking_number : null,
    tracking_status: leg.tracking_status,
    custody_stage: PUBLIC_CUSTODY[leg.custody_status],
    estimated_transit_days: leg.rate_snapshot?.estimated_days ?? null,
    delivered_at: leg.delivered_at,
  };
}

// ── Purchase-attempt binding and reconciliation (no purchase ever happens here) ──

/**
 * A label purchase attempt is identified by (Matter, leg, persisted rate,
 * claim time). The claim time is the leg's updated_at at purchase_pending:
 * the claim RPC is the only write that sets purchase_pending and the row is
 * not otherwise modified while pending. Every purchase carries this
 * correlation reference as provider metadata.
 */
export function purchaseCorrelationRef(matterId: string, legId: string): string {
  return `matter:${matterId};leg:${legId}`;
}

/**
 * Reconciliation opens only once the attempt cannot still be in flight. The
 * provider call is hard-bounded (60s) and this window is far longer, so a
 * concurrent operator can never unlock a leg whose purchase is still running.
 */
export const RECONCILE_MIN_PENDING_MS = 15 * 60 * 1000;

export function purchaseAttemptClaimedAt(leg: Pick<ShipmentLegRow, "label_status" | "updated_at">): number | null {
  if (leg.label_status !== "purchase_pending") return null;
  const at = Date.parse(String(leg.updated_at ?? ""));
  return Number.isFinite(at) ? at : null;
}

export function reconciliationWindowOpen(leg: Pick<ShipmentLegRow, "label_status" | "updated_at">, now: Date = new Date()): boolean {
  const claimedAt = purchaseAttemptClaimedAt(leg);
  return claimedAt !== null && now.getTime() - claimedAt >= RECONCILE_MIN_PENDING_MS;
}

export interface PurchaseAttemptBinding {
  matterId: string;
  legId: string;
  rateId: string;
  claimedAt: number;
}

export interface ProviderTransactionFacts {
  object_id?: string;
  rate?: string;
  metadata?: string;
  object_created?: string;
  status?: string;
}

/**
 * A provider transaction belongs to the CURRENT attempt only if it bought the
 * persisted rate, carries this leg's correlation metadata and was created at
 * or after this attempt's claim. A transaction from an earlier attempt on the
 * same rate is rejected. Missing facts fail closed.
 */
export function transactionBelongsToAttempt(txn: ProviderTransactionFacts, binding: PurchaseAttemptBinding): boolean {
  const created = Date.parse(String(txn.object_created ?? ""));
  return (
    Boolean(txn.object_id) &&
    txn.rate === binding.rateId &&
    String(txn.metadata ?? "") === purchaseCorrelationRef(binding.matterId, binding.legId) &&
    Number.isFinite(created) &&
    created >= binding.claimedAt
  );
}

/** Same leg (rate + correlation) regardless of attempt — used to refuse a no-purchase attestation. */
function transactionTouchesLeg(txn: ProviderTransactionFacts, binding: PurchaseAttemptBinding): boolean {
  return txn.rate === binding.rateId || String(txn.metadata ?? "") === purchaseCorrelationRef(binding.matterId, binding.legId);
}

export type ProviderScanResult =
  | { outcome: "FOUND"; transactions: ProviderTransactionFacts[] }
  | { outcome: "NONE_SINCE_CLAIM" }
  | { outcome: "INCOMPLETE"; reason: string };

/**
 * Evaluates provider transaction pages (newest first) for a reconciliation.
 * NONE_SINCE_CLAIM is returned only when the scan provably covered every
 * transaction created since the claim: pages must be in non-increasing
 * creation order and the scan must reach a transaction older than the claim
 * or the end of the list. Anything else is INCOMPLETE (fail closed).
 */
export function evaluateProviderTransactionScan(
  pages: Array<{ results: ProviderTransactionFacts[]; next?: string | null }>,
  binding: PurchaseAttemptBinding,
): ProviderScanResult {
  const found: ProviderTransactionFacts[] = [];
  let previous = Number.POSITIVE_INFINITY;
  for (const [index, page] of pages.entries()) {
    // Validate the whole page's ordering BEFORE any early exit: an
    // oldest-first page must never yield a false "none since claim".
    const stamps = (page.results ?? []).map((txn) => Date.parse(String(txn.object_created ?? "")));
    if (stamps.some((stamp) => !Number.isFinite(stamp))) return { outcome: "INCOMPLETE", reason: "A provider transaction has no creation time." };
    for (const stamp of stamps) {
      if (stamp > previous) return { outcome: "INCOMPLETE", reason: "Provider transactions are not ordered newest-first." };
      previous = stamp;
    }
    for (const [position, txn] of (page.results ?? []).entries()) {
      const created = stamps[position];
      if (created < binding.claimedAt) {
        return found.length > 0 ? { outcome: "FOUND", transactions: found } : { outcome: "NONE_SINCE_CLAIM" };
      }
      if (transactionTouchesLeg(txn, binding)) found.push(txn);
    }
    const lastPage = index === pages.length - 1;
    if (!page.next) return found.length > 0 ? { outcome: "FOUND", transactions: found } : { outcome: "NONE_SINCE_CLAIM" };
    if (lastPage) break;
  }
  if (found.length > 0) return { outcome: "FOUND", transactions: found };
  return { outcome: "INCOMPLETE", reason: "The provider scan did not reach the purchase claim time." };
}

// ── Exception autopilot (detection only; never purchases, re-routes or closes) ──

export type ShipmentLegExceptionCode =
  | "PURCHASE_IN_PROGRESS"
  | "PURCHASE_OUTCOME_UNKNOWN"
  | "LABEL_PURCHASE_FAILED"
  | "RATE_EXPIRED"
  | "COURIER_CURRENCY_REVIEW_REQUIRED"
  | "TRACKING_NOT_REGISTERED"
  | "TRACKING_STALE"
  | "RETURN_TO_SENDER"
  | "DELIVERY_EXCEPTION";

export interface ShipmentLegException {
  code: ShipmentLegExceptionCode;
  action: string;
}

/** Carrier movement with no verified tracking event for this long is flagged. */
export const TRACKING_STALE_AFTER_MS = 5 * 24 * 60 * 60 * 1000;
const MOVING: ReadonlySet<LegCustodyStatus> = new Set(["carrier_accepted", "final_handoff", "in_transit", "return_in_transit"]);

/**
 * Derives actionable operator exceptions from persisted leg evidence. Pure
 * and read-only: it never changes custody, never purchases a replacement
 * label, never changes a destination and never completes a Matter.
 */
export function detectShipmentLegExceptions(
  leg: Pick<
    ShipmentLegRow,
    "label_status" | "rate_snapshot" | "tracking_number" | "tracking_status" | "custody_status" | "provider_evidence" | "label_created_at" | "delivered_at" | "updated_at"
  >,
  now: Date = new Date(),
): ShipmentLegException[] {
  const out: ShipmentLegException[] = [];
  const evidence = (leg.provider_evidence ?? {}) as Record<string, unknown>;
  const lastTracking = (evidence.last_tracking ?? null) as { status?: string; status_date?: string } | null;

  if (leg.label_status === "purchase_pending") {
    out.push(
      reconciliationWindowOpen(leg, now)
        ? { code: "PURCHASE_OUTCOME_UNKNOWN", action: "Reconcile against the provider transaction before any further purchase. Do not retry blindly." }
        : { code: "PURCHASE_IN_PROGRESS", action: "A purchase attempt may still be running. Reconciliation opens 15 minutes after the attempt started." },
    );
  }
  if (leg.label_status === "rate_selected") {
    if (evidence.last_purchase_failure) {
      out.push({ code: "LABEL_PURCHASE_FAILED", action: "Review the provider rejection, then re-quote or select an approved alternative." });
    }
    for (const [ok, code] of rateSnapshotChecks(leg.rate_snapshot, now)) {
      if (!ok && (code === "RATE_EXPIRED" || code === "COURIER_CURRENCY_REVIEW_REQUIRED")) {
        out.push({
          code,
          action: code === "RATE_EXPIRED" ? "Re-quote the leg; the persisted rate is outside the governed window." : "Review the non-USD rate before purchase.",
        });
      }
    }
  }
  if (leg.label_status === "created" && !leg.tracking_number) {
    out.push({ code: "TRACKING_NOT_REGISTERED", action: "Confirm the carrier tracking number with the provider and register tracking." });
  }
  const rawStatus = String(lastTracking?.status ?? leg.tracking_status ?? "").toUpperCase();
  if (rawStatus === "RETURNED") {
    out.push({ code: "RETURN_TO_SENDER", action: "Confirm packet custody on return. Any replacement shipment is a new governed leg." });
  } else if (leg.custody_status === "exception" || rawStatus === "FAILURE") {
    out.push({ code: "DELIVERY_EXCEPTION", action: "Contact the carrier and the recipient. The exception stays open until resolved with evidence." });
  }
  if (leg.label_status === "created" && MOVING.has(leg.custody_status) && !leg.delivered_at) {
    const last = Date.parse(String(lastTracking?.status_date ?? leg.label_created_at ?? ""));
    if (Number.isFinite(last) && now.getTime() - last > TRACKING_STALE_AFTER_MS) {
      out.push({ code: "TRACKING_STALE", action: "No verified carrier update in 5 days. Open a carrier trace; do not assume delivery." });
    }
  }
  return out;
}

/** Operator projection: everything except the raw label URL and provider secrets. */
export function operatorShipmentLegProjection(leg: ShipmentLegRow, now: Date = new Date()) {
  const evidence = leg.provider_evidence ?? {};
  const label = (evidence.label ?? {}) as Record<string, unknown>;
  return {
    ...leg,
    provider_evidence: {
      label: label.tracking_url_provider ? { tracking_url_provider: label.tracking_url_provider, status: label.status ?? null } : undefined,
      last_tracking: evidence.last_tracking ?? undefined,
    },
    label_available: typeof label.label_url === "string" && leg.label_status === "created",
    completion: completeShipmentLegEvidence(leg),
    exceptions: detectShipmentLegExceptions(leg, now),
    reconcile_available: reconciliationWindowOpen(leg, now),
  };
}

// ── Persistence (service-role client injected by the caller) ──

const LEG_COLUMNS =
  "id, matter_id, shipment_record_id, provider, provider_shipment_id, provider_transaction_id, leg_type, sequence, direction, origin_json, destination_json, rate_snapshot, carrier, service_level, label_status, tracking_number, tracking_status, custody_status, provider_evidence, exception_reason, label_created_at, shipped_at, delivered_at, completed_at, created_by, created_at, updated_at";

export async function createShipmentLeg(
  db: SupabaseClient,
  input: {
    matterId: string;
    legType: ShipmentLegType;
    origin: ShippoAddress;
    destination: ShippoAddress;
    exceptionReason?: string | null;
    actorId: string;
    reason: string;
    evidence?: Record<string, unknown>;
  },
): Promise<ShipmentLegRow> {
  const { data, error } = await db.rpc("create_matter_shipment_leg", {
    p_matter_id: input.matterId,
    p_leg_type: input.legType,
    p_origin: input.origin,
    p_destination: input.destination,
    p_exception_reason: input.exceptionReason ?? null,
    p_actor_id: input.actorId,
    p_reason: input.reason,
    p_evidence: input.evidence ?? {},
  });
  if (error) throw new Error(error.message);
  return (Array.isArray(data) ? data[0] : data) as ShipmentLegRow;
}

export async function getMatterShipmentLegs(db: SupabaseClient, matterId: string): Promise<ShipmentLegRow[]> {
  const { data, error } = await db.from("matter_shipment_legs").select(LEG_COLUMNS).eq("matter_id", matterId).order("sequence");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ShipmentLegRow[];
}

/** Matter-scoped lookup: a leg of another Matter resolves to null. */
export async function getShipmentLeg(db: SupabaseClient, matterId: string, legId: string): Promise<ShipmentLegRow | null> {
  const { data, error } = await db
    .from("matter_shipment_legs")
    .select(LEG_COLUMNS)
    .eq("id", legId)
    .eq("matter_id", matterId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as unknown as ShipmentLegRow | null;
}

export interface ProviderTrackingUpdate {
  trackingNumber: string | null;
  transactionId?: string | null;
  shipmentId?: string | null;
  metadataMatterId?: string | null;
  status: string;
  substatus?: string | null;
  statusDetails?: string | null;
  statusDate?: string | null;
  carrier?: string | null;
  raw?: Record<string, unknown>;
}

/**
 * Applies a verified carrier tracking event to the matching leg. Resolves by
 * provider transaction id, then provider shipment id, then tracking number.
 * Idempotent (event hash), Matter-safe (metadata Matter must match) and
 * leg-specific. Returns null when no leg matches.
 */
export async function updateShipmentLegFromProvider(
  db: SupabaseClient,
  update: ProviderTrackingUpdate,
): Promise<{ legId: string; outcome: string; custodyStatus: string } | null> {
  const lookups: Array<[string, string | null | undefined]> = [
    ["provider_transaction_id", update.transactionId],
    ["provider_shipment_id", update.shipmentId],
    ["tracking_number", update.trackingNumber],
  ];
  let leg: Pick<ShipmentLegRow, "id" | "matter_id" | "tracking_number"> | null = null;
  for (const [column, value] of lookups) {
    if (!value) continue;
    const { data, error } = await db.from("matter_shipment_legs").select("id, matter_id, tracking_number").eq(column, value).limit(2);
    if (error) throw new Error(error.message);
    if (data && data.length === 1) {
      leg = data[0] as Pick<ShipmentLegRow, "id" | "matter_id" | "tracking_number">;
      break;
    }
  }
  if (!leg) return null;
  if (update.metadataMatterId && update.metadataMatterId !== leg.matter_id) {
    // Matter-safe: an event registered for a different Matter never mutates this leg.
    return { legId: leg.id, outcome: "rejected_matter_mismatch", custodyStatus: "unchanged" };
  }
  const eventHash = trackingEventHash({
    legId: leg.id,
    trackingNumber: update.trackingNumber ?? leg.tracking_number ?? "",
    status: update.status,
    statusDate: update.statusDate ?? null,
    substatus: update.substatus ?? null,
  });
  const { data, error } = await db.rpc("record_shipment_leg_tracking", {
    p_matter_id: leg.matter_id,
    p_leg_id: leg.id,
    p_event_hash: eventHash,
    p_status: update.status,
    p_substatus: update.substatus ?? null,
    p_status_details: update.statusDetails ?? null,
    p_status_date: update.statusDate ?? null,
    p_carrier: update.carrier ?? null,
    p_raw: update.raw ?? {},
  });
  if (error) throw new Error(error.message);
  const row = (Array.isArray(data) ? data[0] : data) as { outcome: string; custody_status: string };
  return { legId: leg.id, outcome: row.outcome, custodyStatus: row.custody_status };
}
