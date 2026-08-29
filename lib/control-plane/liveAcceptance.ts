export const LIVE_ACCEPTANCE_IDS = [37, 38, 39, 40, 41, 42, 43, 44, 45] as const;
export type LiveAcceptanceId = (typeof LIVE_ACCEPTANCE_IDS)[number];
export type LiveAcceptanceStatus = "PENDING" | "IN_PROGRESS" | "PASS" | "FAIL";

export interface LiveAcceptanceGate {
  id: LiveAcceptanceId;
  title: string;
  status: LiveAcceptanceStatus;
  requiredEvidence: string[];
  evidenceReferences: string[];
  completedAt?: string;
  completedBy?: string;
  notes: string;
}

export const LIVE_ACCEPTANCE_GATES: readonly LiveAcceptanceGate[] = [
  { id: 37, title: "TIFF 15-Step Real Matter", status: "PENDING", requiredEvidence: ["Matter ID", "itemized portal quote", "TIFFTEST99 99% matter-total calculation", "Wise reference", "scheduling before/after", "portal parity", "password recovery", "notifications", "execution/apostille/courier/delivery/close evidence", "physical mobile findings"], evidenceReferences: [], notes: "Requires controlled real production Matter MS-2026-4887. The client must enter TIFFTEST99 on Invoice & Payment; code cannot self-complete this gate." },
  { id: 38, title: "Real Wise Settlement", status: "PENDING", requiredEvidence: ["canonical amount", "currency", "Matter reference", "provider transaction ID", "verified settlement", "single reconciliation", "scheduling unlock"], evidenceReferences: [], notes: "No manual paid override is valid evidence." },
  { id: 39, title: "Webhook Replay / Idempotency", status: "PENDING", requiredEvidence: ["original legitimate event", "first processing result", "exact replay result", "duplicate provider identity result", "single Matter event", "single scheduling unlock", "audit evidence"], evidenceReferences: [], notes: "Requires provider event replay against controlled production evidence." },
  { id: 40, title: "Real Role Sessions", status: "PENDING", requiredEvidence: ["Client A", "Client B", "VA", "Alliance A", "Alliance B", "Operator", "role boundary screenshots/results"], evidenceReferences: [], notes: "Automated tests support but do not replace physical authenticated sessions." },
  { id: 41, title: "Notification Delivery", status: "PENDING", requiredEvidence: ["Matter", "notification type", "provider message ID", "provider accepted state", "delivered event when supported", "recipient receipt", "timestamp"], evidenceReferences: [], notes: "Provider acceptance is not delivery proof." },
  { id: 42, title: "Physical Mobile Test", status: "PENDING", requiredEvidence: ["device", "browser", "version", "public site", "intake/upload", "professional", "login", "portal/payment/tracking", "operator", "Control Plane", "responsive findings"], evidenceReferences: [], notes: "Requires real mobile hardware." },
  { id: 43, title: "Receiving Authority Truth Review", status: "PENDING", requiredEvidence: ["actual receiving authority", "destination", "document", "original/copy", "translation", "wet ink", "notarial requirement", "apostille/authentication expectation", "delivery expectation", "source"], evidenceReferences: [], notes: "Specific receiving-authority evidence controls over generic country assumptions." },
  { id: 44, title: "Character-for-Character Final Truth Review", status: "PENDING", requiredEvidence: ["client name", "Matter ID", "document identity", "signer identity", "destination", "receiving authority", "invoice", "discount", "Wise amount/reference", "execution method", "notarial act", "authority route", "courier address", "tracking", "portal/email/Matter states"], evidenceReferences: [], notes: "Any mismatch remains NO-GO." },
  { id: 45, title: "Screenshot / Pixel Regression Baseline", status: "PENDING", requiredEvidence: ["desktop/mobile production screenshots for canonical public and authenticated surfaces", "approved baseline manifest"], evidenceReferences: [], notes: "Visual comparison is not functional correctness proof." },
] as const;

export function canMarkLiveAcceptancePass(gate: LiveAcceptanceGate) {
  return gate.requiredEvidence.length > 0 && gate.evidenceReferences.length >= gate.requiredEvidence.length && Boolean(gate.completedAt && gate.completedBy);
}

export function assertNoSelfCertifiedLiveAcceptance(gates: readonly LiveAcceptanceGate[] = LIVE_ACCEPTANCE_GATES) {
  const invalid = gates.filter((gate) => gate.status === "PASS" && !canMarkLiveAcceptancePass(gate));
  return { valid: invalid.length === 0, invalid };
}
