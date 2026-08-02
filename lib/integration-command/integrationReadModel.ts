/**
 * integrationReadModel — normalized, UI-safe integration state. Produces
 * IntegrationHealthRecord and MatterIntegrationSummary WITHOUT importing any
 * provider SDK, raw payload, or secret. Health is evidence-based: env presence
 * yields "configured" (NOT "healthy") — healthy requires a verified event, which
 * this sandbox never has, so it honestly reports "configured"/"unknown".
 */

export type IntegrationProvider = "wise" | "shippo" | "bluenotary";

export type IntegrationHealth =
  | "unknown" | "configured" | "healthy" | "degraded" | "action_required" | "unavailable";

export interface IntegrationHealthRecord {
  provider: IntegrationProvider;
  label: string;
  configured: boolean;
  lastVerifiedEventAt: string | null;
  health: IntegrationHealth;
  operatorMessage: string;
}

/** Required env keys per provider (presence only; values never read here). */
const REQUIRED_KEYS: Record<IntegrationProvider, string[]> = {
  wise: ["NEXT_PUBLIC_WISE_HANDLE"],
  shippo: ["SHIPPO_API_KEY"],
  bluenotary: ["BLUENOTARY_API_KEY", "BLUENOTARY_BASE_URL"],
};

const LABELS: Record<IntegrationProvider, string> = {
  wise: "Wise · Payment",
  shippo: "Shippo · Courier",
  bluenotary: "BlueNotary · RON",
};

function isConfigured(provider: IntegrationProvider): boolean {
  return REQUIRED_KEYS[provider].every((k) => {
    const v = process.env[k];
    return typeof v === "string" && v.trim().length > 0;
  });
}

/**
 * Health record. Evidence-based: configured ≠ healthy. Without a recorded
 * verified event, a configured provider reports "configured" (needs verification),
 * and an unconfigured provider reports "action_required".
 */
export function getIntegrationHealth(provider: IntegrationProvider): IntegrationHealthRecord {
  const configured = isConfigured(provider);
  return {
    provider,
    label: LABELS[provider],
    configured,
    lastVerifiedEventAt: null,
    health: configured ? "configured" : "action_required",
    operatorMessage: configured
      ? "Credentials present. Not yet verified live — requires a signed provider test event."
      : "Missing configuration. Set credentials + webhook in the deployment environment.",
  };
}

export function allIntegrationHealth(): IntegrationHealthRecord[] {
  return (["wise", "bluenotary", "shippo"] as IntegrationProvider[]).map(getIntegrationHealth);
}

// ── Matter integration summary (normalized states; no provider payloads) ──

export interface MatterIntegrationSummary {
  matterId: string;
  paymentState: string;
  schedulingState: string;
  ronState: string;
  courierState: string;
  releaseState: string;
  nextActionId: string | null;
}

/**
 * Honest empty summary — until canonical Matter/payment/RON/courier states are
 * wired to real records, there are no matters to summarize. Returns [] (no
 * fabricated matters).
 */
export function listMatterIntegrationSummaries(): MatterIntegrationSummary[] {
  return [];
}
