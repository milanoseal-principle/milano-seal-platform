/**
 * Server-side pricing boundary for the public Smart Intake.
 *
 * The public wizard sends only the visitor's intake facts. This module runs the
 * one canonical chain (classifyIntake → priceSmartIntake → projectClientPricing)
 * on the server and returns ONLY the client-safe projection plus the public
 * line items the canonical engine already marks as client-visible. The private
 * pricing engine, lane bases, add-on constants, internal-only breakdown rows,
 * manual-review reasons and operator reasoning never reach the browser.
 *
 * This is a preview, never authority: /api/intake recomputes canonical pricing
 * server-side before any Matter, invoice or Wise amount is persisted.
 *
 * Must only be imported from server routes (enforced by
 * scripts/validate-intake-pricing-privacy.mjs).
 */
import { z } from "zod";
import { classifyIntake } from "@/lib/intake/smartClassification";
import { priceSmartIntake } from "@/lib/pricing/milanoPricingTruth";
import { projectClientPricing } from "@/lib/pricing/pricingProjections";
import { QUOTE_AFTER_REVIEW_PREVIEW, type IntakeQuotePreview } from "@/lib/pricing/intakeQuotePreviewTypes";

export { QUOTE_AFTER_REVIEW_PREVIEW, type IntakeQuotePreview };

const text = (max: number) => z.string().trim().max(max).optional();
const count = z.number().int().min(0).max(1000).optional();

export const intakeQuotePreviewSchema = z.object({
  text: z.string().max(20000).default(""),
  structured: z.object({
    notarization: z.union([z.boolean(), z.literal("already_completed")]).optional(),
    ron: z.boolean().optional(),
    apostille: z.boolean().optional(),
    translation: z.boolean().optional(),
    mobile: z.boolean().optional(),
    documentType: text(1000),
    destinationCountry: text(500),
    originState: text(500),
    signerLocation: text(500),
    documentCount: count,
    signerCount: count,
  }).strict().default({}),
  ai: z.object({
    documentType: text(1000),
    country: text(500),
    originState: text(500),
    documentCount: count,
    signerCount: count,
    apostilleRequired: z.boolean().optional(),
    translationNeeded: z.boolean().optional(),
  }).strict().optional(),
  selectedLane: z.enum(["signature", "priority", "executive"]).default("priority"),
  timeline: z.enum(["", "standard", "expedited", "urgent"]).default(""),
  delivery: z.enum(["", "digital", "domestic_courier", "international_courier"]).default(""),
}).strict();

export type IntakeQuotePreviewInput = z.input<typeof intakeQuotePreviewSchema>;

export function buildIntakeQuotePreview(input: z.output<typeof intakeQuotePreviewSchema>): IntakeQuotePreview {
  const classification = classifyIntake({ text: input.text, structured: input.structured, ai: input.ai });
  const pricing = priceSmartIntake({
    classification,
    selectedLane: input.selectedLane,
    commercialContext: "consumer",
    timeline: input.timeline,
    delivery: input.delivery,
  });
  const client = projectClientPricing(pricing);
  if (client.mode !== "approved_price") {
    return { ...QUOTE_AFTER_REVIEW_PREVIEW, summary: client.summary };
  }
  return {
    mode: "approved_price",
    summary: client.summary,
    amount: client.amount,
    lineItems: pricing.clientLineItems.map(({ key, label, amount }) => ({ key, label, amount })),
    paymentGateRequired: true,
    schedulingLockedUntilPayment: true,
  };
}
