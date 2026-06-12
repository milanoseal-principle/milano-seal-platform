import { createClient } from "@/lib/supabase/server";
import { getOperatorAtlasSignals } from "@/lib/atlas/atlas-pathway";

export type MatterSignal = {
  label: string;
  value: string;
  type: "info" | "warning" | "suggestion";
};

// Returns a client-safe pathway summary for portal display.
// Falls back to null — caller renders nothing if absent.
export async function getClientSafePathwaySummary(
  destinationCountry: string,
  documentType: string
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("pathway_intelligence")
      .select("client_safe_summary")
      .ilike("destination_country", destinationCountry)
      .ilike("document_type", documentType)
      .maybeSingle();
    return (data?.client_safe_summary as string | null) ?? null;
  } catch {
    return null;
  }
}

// Returns the next required client action as a human-readable string.
// Purely deterministic — no DB calls, no AI.
export function getClientNextAction(matter: {
  matter_status: string | null;
  payment_confirmed: boolean;
  is_platform_fee_only: boolean;
  courier_tracking_id: string | null;
}): string {
  const s = matter.matter_status ?? "";

  if (s === "intake_received") return "Your matter has been received and is awaiting review.";
  if (s === "under_review") return "Your matter is under review. No action is required from you right now.";
  if (s === "quoted") return "A quote has been prepared. Please review your invoice.";

  if (s === "awaiting_payment") {
    if (matter.is_platform_fee_only)
      return "A platform fee is required before scheduling. Your coordinator will send a payment link.";
    return "Payment confirmation is required before the Signing Room unlocks. Please review your invoice.";
  }

  if (!matter.payment_confirmed && s !== "completed")
    return "Awaiting payment confirmation before scheduling can unlock.";

  if (s === "scheduled") return "Your Signing Room is ready. Your execution appointment has been scheduled.";
  if (s === "in_execution") return "Execution is in progress. Your coordinator is handling your matter.";
  if (s === "apostille_processing") return "Apostille processing is underway. Documents are in the coordination queue.";
  if (s === "in_transit") {
    if (matter.courier_tracking_id) return "Your documents are in transit. Track your shipment via the Custody Rail.";
    return "Your documents are being prepared for release.";
  }
  if (s === "delivered") return "Your documents have been delivered. Your matter is being finalized.";
  if (s === "completed") return "Your matter is completed and released. Your documents are available in The Vault.";

  return "Your matter is being processed. No action is required from you right now.";
}

// Returns operator-facing intelligence signals for the matter drawer.
// Safe to show in dashboard only — never client-facing.
export function getOperatorMatterSignals(matter: {
  document_type: string | null;
  destination_country: string | null;
  assigned_lane: string | null;
  matter_status: string | null;
}): MatterSignal[] {
  const signals: MatterSignal[] = [];
  const docType = (matter.document_type ?? "").toLowerCase();

  // Atlas-sourced pathway signals — covers all registered countries
  const atlas = getOperatorAtlasSignals(matter.destination_country);

  if (atlas.pathwayLabel) {
    const isLegalization = atlas.pathwayLabel.includes("Legalization");
    signals.push({
      label: isLegalization ? "Legalization" : "Apostille",
      value: isLegalization
        ? `${atlas.pathwayLabel} — consular chain may apply`
        : `${atlas.pathwayLabel} — review required`,
      type: isLegalization ? "warning" : "info",
    });
  }

  if (atlas.translationLikely)
    signals.push({ label: "Translation", value: "Certified translation likely needed for this destination", type: "suggestion" });

  if (atlas.ronLikelihood === "limited" || atlas.ronLikelihood === "not_available")
    signals.push({ label: "RON", value: "Remote Online Notarization may be limited — confirm signing method", type: "warning" });

  if (docType.includes("affidavit") || docType.includes("power of attorney") || docType.includes("poa"))
    signals.push({ label: "Signer ID", value: "Identity verification required before execution", type: "info" });

  if (!matter.assigned_lane)
    signals.push({ label: "Lane", value: "No lane assigned yet", type: "warning" });

  return signals;
}

// Returns VA preflight guidance checklist items.
// Safe for Operations Desk — no pricing, no internal notes.
export function getVAPreflightGuidance(matter: {
  document_type: string | null;
  destination_country: string | null;
  matter_status: string | null;
}): string[] {
  const items: string[] = [
    "Confirm client name matches all documents",
    "Confirm signer location is on file",
    "Confirm document type is specified",
  ];

  const country = (matter.destination_country ?? "").toLowerCase();
  const docType = (matter.document_type ?? "").toLowerCase();

  if (country)
    items.push(`Confirm destination country: ${matter.destination_country}`);

  if (docType.includes("affidavit") || docType.includes("power of attorney") || docType.includes("poa"))
    items.push("Verify signer government-issued ID is available");

  if (country === "italy" || country === "greece" || country === "spain")
    items.push("Flag apostille coordination requirement to founder");

  if (country === "uae" || country === "saudi arabia")
    items.push("Flag potential consular legalization to founder");

  items.push("Confirm all required documents are uploaded to The Vault");
  items.push("Request founder review before marking pre-flight complete");

  return items;
}
