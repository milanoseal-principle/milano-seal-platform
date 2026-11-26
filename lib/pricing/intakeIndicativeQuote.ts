import { z } from "zod";
import type { IntakeQuotePreview } from "./intakeQuotePreviewTypes";

const lineSchema = z.object({
  key: z.string(),
  label: z.string(),
  amount: z.number().finite().nonnegative(),
});

const quoteSchema = z.object({
  basis: z.literal("indicative_not_payable"),
  engine: z.literal("intake-quote-preview"),
  mode: z.literal("approved_price"),
  summary: z.string(),
  computed_at: z.string().datetime(),
  line_items: z.array(lineSchema).min(1),
  total: z.number().finite().positive(),
  retainer_estimate: z.number().finite().nonnegative(),
  final_balance_estimate: z.number().finite().nonnegative(),
});

export type IntakeIndicativeQuote = z.infer<typeof quoteSchema>;

export function fiftyFiftySplit(total: number) {
  const cents = Math.round(total * 100);
  const retainerCents = Math.round(cents / 2);
  return { total: cents / 100, retainer: retainerCents / 100, balance: (cents - retainerCents) / 100 };
}

export function previewInputFromIntake(raw: Record<string, unknown>) {
  const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : undefined;
  const choice = (value: unknown) => typeof value === "boolean" ? value : undefined;
  const count = (value: unknown) => {
    const numeric = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
    return Number.isInteger(numeric) && numeric > 0 ? numeric : undefined;
  };
  const input = {
    text: text(raw.document_description ?? raw.message) ?? "",
    structured: {
      documentType: text(raw.document_type),
      destinationCountry: text(raw.destination_country ?? raw.country),
      originState: text(raw.origin_state ?? raw.state),
      signerLocation: text(raw.signer_location),
      documentCount: count(raw.docs ?? raw.docs_count),
      signerCount: count(raw.signers),
      notarization: raw.notarization_requirement === "already_completed"
        ? "already_completed"
        : choice(raw.notarization_required),
      ron: choice(raw.ron_required),
      mobile: choice(raw.mobile),
      apostille: choice(raw.apostille ?? raw.apostille_required),
      translation: choice(raw.translation),
    },
    selectedLane: text(raw.tier),
    timeline: text(raw.timeline_preference),
    delivery: text(raw.delivery_method),
  };
  // The Smart Intake wizard submits the same facts it passed to preview. Preserve
  // its unknown and already-completed choices instead of reconstructing them from
  // the legacy booleans used for Matter capture. The route validates this input.
  const facts = raw.pricing_preview_facts;
  if (!facts || typeof facts !== "object") return input;
  const { structured, ai } = facts as Record<string, unknown>;
  return { ...input, structured, ai };
}

export function indicativeQuoteFromPreview(preview: IntakeQuotePreview, computedAt: string): IntakeIndicativeQuote | null {
  if (preview.mode !== "approved_price" || typeof preview.amount !== "number") return null;
  const { total, retainer, balance } = fiftyFiftySplit(preview.amount);
  return parseIndicativeQuote({
    basis: "indicative_not_payable", engine: "intake-quote-preview", mode: preview.mode,
    summary: preview.summary, computed_at: computedAt, line_items: preview.lineItems,
    total, retainer_estimate: retainer, final_balance_estimate: balance,
  });
}

export function parseIndicativeQuote(input: unknown): IntakeIndicativeQuote | null {
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return null;
  const { total, retainer_estimate, final_balance_estimate, line_items } = parsed.data;
  const expected = fiftyFiftySplit(total);
  if (expected.total !== total || expected.retainer !== retainer_estimate || expected.balance !== final_balance_estimate) return null;
  if (line_items.reduce((sum, item) => sum + Math.round(item.amount * 100), 0) !== Math.round(total * 100)) return null;
  return parsed.data;
}

export function indicativeQuoteFromNotes(notes: unknown): IntakeIndicativeQuote | null {
  if (typeof notes !== "string") return null;
  try {
    const metadata = JSON.parse(notes);
    return metadata?.quote_state === "review_required" ? parseIndicativeQuote(metadata.indicative_quote) : null;
  } catch {
    return null;
  }
}
