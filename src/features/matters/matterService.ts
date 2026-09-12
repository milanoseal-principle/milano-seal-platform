import type { IntakePayload } from "@/src/features/milano/types";
import { routeCompliance } from "@/src/features/compliance/complianceRouter";
import { runTrustEngine } from "@/src/features/compliance/trustEngine";
import { calculateMilanoPricing } from "@/src/features/pricing/pricingEngine";
import { createClientAndMatter } from "./matterRepository";
import { writeEventLedger } from "@/src/features/audit/eventLedgerService";

export async function createMatterFromIntake(payload: IntakePayload) {
  const compliance = routeCompliance(payload.destination_country);
  const trust = runTrustEngine(payload);
  const documentCount = Math.max(1, Math.floor(Number(payload.document_count ?? 1)) || 1);
  const explicitApostilleCount = Math.max(
    0,
    Math.floor(Number(payload.apostille_count ?? 0)) || 0,
  );
  const apostilleCount = compliance.apostille_required
    ? explicitApostilleCount > 0
      ? Math.min(documentCount, explicitApostilleCount)
      : documentCount
    : 0;

  const pricing = calculateMilanoPricing({
    lane: compliance.recommended_lane,
    apostilleRequired: compliance.apostille_required,
    apostilleCount,
    documentCount,
    rush: payload.urgency === "rush" || payload.urgency === "same_day",
    signerCount: payload.signer_count,
    paymentMode: "split_50_50",
  });

  const created = await createClientAndMatter(payload, {
    lane: pricing.lane,
    original_total: pricing.original_total,
    discount_amount: pricing.discount_amount,
    final_total: pricing.final_total,
    deposit_required: pricing.deposit_required,
    deposit_amount: pricing.deposit_amount,
    balance_due: pricing.balance_due,
    payment_reference: pricing.payment_reference,
  });

  await Promise.all([
    writeEventLedger({ matterId: created.matter.id, eventType: "INTAKE_CREATED", message: "Structured intake received." }),
    writeEventLedger({ matterId: created.matter.id, eventType: "MATTER_CREATED", message: "Matter record created." }),
    writeEventLedger({ matterId: created.matter.id, eventType: "SMART_REQUEST_PARSED", metadata: { trust } }),
    writeEventLedger({ matterId: created.matter.id, eventType: "COMPLIANCE_VERIFIED", metadata: { compliance } }),
    writeEventLedger({ matterId: created.matter.id, eventType: "PORTAL_LINK_CREATED" }),
  ]);

  return { ...created, compliance, trust, pricing };
}
