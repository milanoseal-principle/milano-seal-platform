export const NEGATIVE_EVENT_STATES = ["DECLINED", "BLOCKED", "FAILED", "LOST", "PAUSED", "REJECTED", "UNKNOWN"] as const;
export type NegativeEventState = (typeof NEGATIVE_EVENT_STATES)[number];

export const NEGATIVE_EVENT_DOMAINS = ["professional", "client", "execution", "authority", "payment", "partner"] as const;
export type NegativeEventDomain = (typeof NEGATIVE_EVENT_DOMAINS)[number];

export interface NegativeEvent {
  domain: NegativeEventDomain;
  state: NegativeEventState;
  matterId: string | null;
  account: string | null;
  actor: string | null;
  reasonCode: string | null;
  reason: string | null;
  source: string;
  occurredAt: string | null;
  recoverable: boolean | null;
  recoveryOwner: string | null;
  nextRecoveryAction: string | null;
  reviewDate: string | null;
  authority: string | null;
  confidence: "verified" | "high" | "moderate" | "low" | "unknown";
}

const STATE_ALIASES: Record<string, NegativeEventState> = {
  declined: "DECLINED",
  blocked: "BLOCKED",
  failed: "FAILED",
  failure: "FAILED",
  lost: "LOST",
  paused: "PAUSED",
  rejected: "REJECTED",
  rejection: "REJECTED",
};

export function normalizeNegativeEventState(value: string | null | undefined): NegativeEventState {
  const key = (value ?? "").trim().toLowerCase();
  return STATE_ALIASES[key] ?? "UNKNOWN";
}

export function classifyLegacyMatterLoss(input: {
  matterId?: string | null;
  account?: string | null;
  lostStage?: string | null;
  lossReason?: string | null;
  lostAt?: string | null;
  actor?: string | null;
}): NegativeEvent {
  const stage = (input.lostStage ?? "").toLowerCase();
  const reason = input.lossReason ?? null;
  const domain: NegativeEventDomain = stage.includes("payment")
    ? "payment"
    : stage.includes("authority") || stage.includes("apostille") || stage.includes("consulate")
      ? "authority"
      : stage.includes("ron") || stage.includes("notary") || stage.includes("execution") || stage.includes("scheduling")
        ? "execution"
        : stage.includes("professional") || stage.includes("referral") || stage.includes("account")
          ? "professional"
          : "client";

  return {
    domain,
    state: normalizeNegativeEventState(input.lostStage || (input.lostAt ? "lost" : null)),
    matterId: input.matterId ?? null,
    account: input.account ?? null,
    actor: input.actor ?? null,
    reasonCode: input.lostStage ?? null,
    reason,
    source: "canonical-deals-loss-evidence",
    occurredAt: input.lostAt ?? null,
    recoverable: null,
    recoveryOwner: input.actor ?? null,
    nextRecoveryAction: null,
    reviewDate: null,
    authority: domain === "authority" ? "receiving-authority-evidence" : null,
    confidence: input.lostAt || reason ? "high" : "unknown",
  };
}

export function negativeDomainsRemainDistinct(a: NegativeEvent, b: NegativeEvent): boolean {
  return a.domain !== b.domain || a.state !== b.state || a.matterId !== b.matterId;
}
