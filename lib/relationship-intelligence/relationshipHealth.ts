/**
 * relationshipHealth — interaction timeline + dormancy detection. Relationship
 * signals derive from real documented interactions only; no fabricated history
 * or influence scores.
 */

export type InteractionType =
  | "email" | "phone_call" | "text" | "meeting" | "lunch" | "office_visit"
  | "networking_event" | "conference" | "introduction" | "referral_received"
  | "referral_sent" | "proposal_sent" | "capability_packet_sent" | "pilot_completed"
  | "account_review" | "renewal_review" | "founder_follow_up" | "other";

export interface Interaction {
  id: string;
  organizationId: string;
  interactionType: InteractionType;
  occurredAtEpochDays: number; // caller supplies; no Date.now() in library
  owner: string | null;
  nextActionDueAtEpochDays: number | null;
  isSample: boolean;
}

export const INTERACTION_REGISTRY: Interaction[] = [];

export const DORMANCY_THRESHOLD_DAYS = 45;

/** Days since the most recent real interaction for an org (null if none). */
export function daysSinceLastTouch(organizationId: string, nowEpochDays: number): number | null {
  const real = INTERACTION_REGISTRY.filter((i) => i.organizationId === organizationId && !i.isSample);
  if (real.length === 0) return null;
  const latest = Math.max(...real.map((i) => i.occurredAtEpochDays));
  return nowEpochDays - latest;
}

/** True when an org has real history but has gone quiet past the threshold. */
export function isDormant(organizationId: string, nowEpochDays: number): boolean {
  const d = daysSinceLastTouch(organizationId, nowEpochDays);
  return d !== null && d > DORMANCY_THRESHOLD_DAYS;
}
