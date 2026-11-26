import assert from "node:assert/strict";
import fs from "node:fs";
import { test, type TestContext } from "node:test";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/public/payment-status/route";

// Live acceptance MS-2026-9166 (affidavit → Italy, public intake): the Matter was
// correctly captured as review-required with no canonical quote, but the
// confirmation page rendered the retainer PaymentGate (which surfaced the
// "Payment amount is not canonically set" 422) and "Waiting for payment
// confirmation". Payment UI must appear only once a canonical quote is issued.

function supabaseFixture(t: TestContext, row: Record<string, unknown>) {
  const env = { NEXT_PUBLIC_SUPABASE_URL: "https://confirmation-fixture.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-role-key" };
  const saved = Object.fromEntries(Object.keys(env).map((k) => [k, process.env[k]]));
  Object.assign(process.env, env);
  t.after(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (url.pathname === "/rest/v1/deals") {
      const wantsObject = (request.headers.get("accept") ?? "").includes("vnd.pgrst.object");
      return wantsObject ? Response.json(row) : Response.json([row]);
    }
    return Response.json([], { status: 201 });
  });
}

const status = async (t: TestContext, row: Record<string, unknown>) => {
  supabaseFixture(t, { deal_id: "MS-2026-0000", access_token: "token", payment_status: "unpaid", status: "intake_received", ...row });
  const res = await GET(new NextRequest("https://www.themilanoseal.com/api/public/payment-status?deal_id=MS-2026-0000&access_token=token"));
  assert.equal(res.status, 200);
  return (await res.json()) as Record<string, unknown>;
};

test("review-required intake (no canonical total) reports no issued quote", async (t) => {
  const body = await status(t, { total_price: null, invoice_balance: null, invoice_subtotal: null, payment_disposition: "standard_payment" });
  assert.equal(body.quote_issued, false);
  assert.equal(body.payment_status, "unpaid");
});

test("an operator-issued canonical quote reports an issued quote", async (t) => {
  const body = await status(t, { total_price: 750, invoice_balance: 375, invoice_subtotal: 750, payment_disposition: "standard_payment", status: "awaiting_payment" });
  assert.equal(body.quote_issued, true);
});

test("a complimentary Matter never reports a payable quote", async (t) => {
  const body = await status(t, { total_price: 750, invoice_balance: 0, invoice_subtotal: 750, payment_disposition: "complimentary" });
  assert.equal(body.quote_issued, false);
});

test("the confirmation page gates the PaymentGate and payment polling banner on an issued quote", () => {
  const page = fs.readFileSync("app/intake/confirmation/page.tsx", "utf8").replace(/\s+/g, " ");
  assert.match(page, /setQuoteState\(body\.quote_issued === true \? "issued" : "pending_review"\)/);
  assert.match(page, /dealId\?\.startsWith\("MS-"\) && quoteState === "pending_review" \?/, "review copy only on a confirmed pending-review answer");
  assert.match(page, /dealId\?\.startsWith\("MS-"\) && quoteState === "issued" \? \( <div className="mb-6"> <PaymentGate/, "PaymentGate is only the issued branch");
  assert.match(page, /\) : dealId\?\.startsWith\("MS-"\) \? null : \(/, "no payment copy for an MS- Matter while status is loading");
  assert.match(page, /dealId\?\.startsWith\("MS-"\) && quoteState === "issued" && \(/, "polling banner only for an issued quote");
  assert.match(page, /Pricing Under Review/);
  assert.match(page, /50% engagement retainer/);
  assert.match(page, /50% final balance/);
  assert.doesNotMatch(page, /\$\s*750|\b375\b/, "no hardcoded prices");
});

test("a failed status lookup is 'unavailable', never 'no payment due' (Codex review on #556)", () => {
  const page = fs.readFileSync("app/intake/confirmation/page.tsx", "utf8").replace(/\s+/g, " ");
  assert.match(page, /if \(!r\.ok\) \{ if \(!stopped\) setQuoteState\("unavailable"\); return; \}/);
  assert.match(page, /catch \{ if \(!stopped\) setQuoteState\("unavailable"\); \}/);
  const unavailable = page.slice(page.indexOf('quoteState === "unavailable" ? ('), page.indexOf('quoteState === "pending_review" ? ('));
  assert.match(unavailable, /href="\/portal"/, "points the owner to the authenticated portal");
  assert.doesNotMatch(unavailable, /No payment is due/, "makes no payment claim");
});

test("indicative confirmation is Matter-bound and a review response does not schedule payment polling", () => {
  const page = fs.readFileSync("app/intake/confirmation/page.tsx", "utf8");
  assert.match(page, /storedIntake\?\.deal_id === dealId \? storedIntake : null/);
  assert.match(page, /quoteLookup\?\.matterId === dealId/);
  assert.match(page, /if \(!stopped && body\.quote_issued === true\) nextPoll = setTimeout/);
  assert.doesNotMatch(page, /setInterval\(/);
  const portal = fs.readFileSync("app/api/portal/me/invoice/route.ts", "utf8");
  assert.match(portal, /await getCurrentClientDeal\(requestedId\)/);
  assert.match(portal, /indicativeQuote: approved \? null : indicativeQuoteFromNotes/);
});

test("the server saves indicative metadata in the first Matter insert before returning it", () => {
  const core = fs.readFileSync("app/api/intake/core.ts", "utf8");
  const review = core.slice(core.indexOf("const indicativeQuote ="), core.indexOf('stage = "EXECUTION_VALIDATED"'));
  assert.match(review, /internal_notes: JSON\.stringify\(indicativeQuote\s*\? \{ \.\.\.reviewMetadata, indicative_quote: indicativeQuote \}/);
  assert.match(review, /\.insert\(\[reviewPayload\]\)[\s\S]*if \(reviewError\)[\s\S]*indicative_quote: indicativeQuote/);
  assert.doesNotMatch(review, /\.update\(|invoice_retainer:|invoice_balance:|total_price:/);
});
