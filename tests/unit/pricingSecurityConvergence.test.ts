import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { calculatePrice, WITNESS_FEES } from "@/lib/pricing";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test("canonical pricing owns witness support arithmetic", () => {
  const quote = calculatePrice({
    tier: "signature",
    document_count: 1,
    signer_count: 1,
    witness_count: 2,
    witness_type: "ron",
    after_hours: true,
  });
  const witnessExpected = 2 * WITNESS_FEES.ron;
  assert.equal(quote.internal.witness_total, witnessExpected);
  assert.equal(
    quote.breakdown
      .filter((item) => item.key === "remote_witnesses")
      .reduce((sum, item) => sum + item.amount, 0),
    witnessExpected,
  );
  assert.equal(
    quote.breakdown.find((item) => item.key === "timing_after_hours_evening")?.amount,
    WITNESS_FEES.after_hours,
  );
});

test("intake and admin pricing no longer call the legacy quote engine", () => {
  const intake = read("app/api/intake/core.ts");
  const adminQuote = read("app/api/admin/pricing/quote/route.ts");
  assert.doesNotMatch(intake, /determineLaneAndPrice/);
  assert.doesNotMatch(adminQuote, /determineLaneAndPrice/);
  assert.match(intake, /canonicalPricing\.internal\.witness_total/);
  assert.match(adminQuote, /calculatePrice/);
  assert.match(adminQuote, /suggestTier/);
});

test("admin pricing mutation boundary is operator authenticated", () => {
  const adminQuote = read("app/api/admin/pricing/quote/route.ts");
  assert.match(adminQuote, /supabase\.auth\.getUser\(\)/);
  assert.match(adminQuote, /isOperatorOrFounder\(role\)/);
  assert.match(adminQuote, /status:\s*403/);
});

test("translation mutation RLS is role gated", () => {
  const initial = read("supabase/migrations/202609250001_translation_entries.sql");
  const hardening = read(
    "supabase/migrations/202609260001_translation_entry_rls_hardening.sql",
  );
  assert.match(initial, /authenticated translation reviewers can update entries/);
  assert.match(
    hardening,
    /drop policy if exists "authenticated translation reviewers can update entries"/,
  );
  assert.match(
    hardening,
    /auth\.jwt\(\) -> 'app_metadata' ->> 'role'/,
  );
  assert.match(hardening, /translation_coordinator/);
  assert.doesNotMatch(
    hardening,
    /for update\s+to authenticated\s+using \(true\)/i,
  );
});
