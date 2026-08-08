export const TRUST_NETWORK_SAFETY_RULES = [
  "No guaranteed referrals.",
  "No guaranteed income.",
  "No legal advice.",
  "No immigration advice.",
  "No medical advice.",
  "No fake verification.",
  "No false certification status.",
  "No government endorsement claims.",
  "No competitor naming or copied brand identity.",
  "No copied pricing from any competitor.",
  "Eligibility for routing is not an assignment promise.",
  "Public verification status may display only after verification is complete."
] as const;

export const COMPETITOR_COPY_GUARD = {
  scanScope: "new platform modules",
  rule: "Block competitor identity terms, copied price structures, copied names, and copied community positioning.",
  action: "Fail validation and require Milano Seal proprietary naming and pricing."
} as const;
