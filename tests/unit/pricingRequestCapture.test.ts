import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { receivePricingRequest } from "@/lib/acquisition/pricingRequest";
import { createAdminClient } from "@/lib/supabase/admin";

// P1 Get Pricing persisted conversion. A pricing request is a low-friction,
// idempotent, persisted lead that routes to Milano review. It is never a
// canonical Matter, a payment, a scheduling unlock, or an authoritative
// route/tier/price. These tests run against an injected in-memory admin client
// (no database); they prove the contract, not live persistence.

const payload = {
  request_id: "b1d9f0b2-1c2e-4d7a-9f3b-2a5c7e9d0a11",
  full_name: "Maria Rossi",
  email: "Maria@Example.com",
  phone: "+1 555 0100",
  audience: "individual",
  service_intent: "unsure",
  document_type: "Power of attorney",
  document_origin: "Florida, USA",
  signer_location: "Miami, Florida, USA",
  destination: "Italy",
  deadline: "Needed by March 15",
  urgency: "routine",
  execution_status: "not_started",
  apostille_known: "unsure",
  delivery_preference: "international_courier",
  description: "I need a power of attorney executed for use in Italy. Not sure what's required.",
  originating_page: "/pricing",
  attribution: { source: "homepage", utm_campaign: "fall" },
  website: "",
} as const;

function makeRequest(body: unknown = payload, origin = "https://www.themilanoseal.com") {
  return new Request("https://www.themilanoseal.com/api/pricing/request", {
    method: "POST",
    headers: { origin },
    body: JSON.stringify(body),
  });
}

function fixture(options: {
  persistenceFailure?: boolean;
  rateLimit?: number;
  notificationFailure?: boolean;
  raceOnInsert?: boolean;
} = {}) {
  const rows = new Map<string, Record<string, any>>(); // eslint-disable-line @typescript-eslint/no-explicit-any
  const writes: string[] = [];
  let notifications = 0;
  const admin = {
    from(table: string) {
      let action = "select";
      let input: Record<string, any> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
      const filters: Record<string, string> = {};
      const query = {
        select(_columns?: string, opts?: { head?: boolean }) {
          if (opts?.head) action = "count";
          return query;
        },
        eq(field: string, value: string) {
          filters[field] = value;
          return query;
        },
        gte() {
          return query;
        },
        insert(value: Record<string, any>) { // eslint-disable-line @typescript-eslint/no-explicit-any
          action = "insert";
          input = value;
          return query;
        },
        maybeSingle() {
          const row = [...rows.values()].find((candidate) => candidate.id === filters.id) ?? null;
          return Promise.resolve({ data: row, error: null });
        },
        then(resolve: (value: any) => unknown) { // eslint-disable-line @typescript-eslint/no-explicit-any
          if (action === "count") return Promise.resolve(resolve({ count: options.rateLimit ?? 0, error: null }));
          if (action === "insert") {
            writes.push(table);
            if (options.persistenceFailure) return Promise.resolve(resolve({ error: { code: "DB_FAILURE" } }));
            // Simulate a lost insert race: another writer already committed the
            // same request_id. Store it so the receiver's raced lookup matches.
            if (options.raceOnInsert && !rows.has(input.id)) {
              rows.set(input.id, input);
              return Promise.resolve(resolve({ error: { code: "23505" } }));
            }
            if (rows.has(input.id)) return Promise.resolve(resolve({ error: { code: "23505" } }));
            rows.set(input.id, input);
          }
          return Promise.resolve(resolve({ error: null }));
        },
      };
      return query;
    },
  };

  return {
    rows,
    writes,
    notifications: () => notifications,
    dependencies: {
      admin: () => admin as unknown as ReturnType<typeof createAdminClient>,
      hashIp: () => "hashed-ip",
      notify: async () => {
        notifications += 1;
        if (options.notificationFailure) throw new Error("provider unavailable");
        return "provider_accepted";
      },
    },
  };
}

test("pricing request persists to canonical sales_leads with full context, no Matter/payment state", async () => {
  const state = fixture();
  const response = await receivePricingRequest(makeRequest(), state.dependencies);
  const receipt = await response.json();
  assert.equal(response.status, 201);
  assert.equal(receipt.ok, true);
  assert.equal(receipt.reference, payload.request_id);
  assert.equal(receipt.notification, "provider_accepted");
  const row = state.rows.get(payload.request_id)!;
  assert.equal(row.lead_type, "pricing_request");
  assert.equal(row.desired_next_step, "pricing_request");
  assert.equal(row.audience, "individual");
  assert.equal(row.product_interest, "unsure"); // service intent is a preference, not an authoritative route
  assert.equal(row.country, "Italy");
  assert.equal(row.document_type, "Power of attorney");
  assert.equal(row.email, "maria@example.com"); // normalized lower-case
  assert.equal(row.details.description, payload.description);
  assert.equal(row.details.attribution.utm_campaign, "fall");
  assert.equal(row.source_route, "/pricing");
  // The only write is the lead; no deals / payment / scheduling table is touched.
  assert.deepEqual(state.writes, ["sales_leads"]);
  // A pricing request is never a Matter: canonical_matter_id is not set.
  assert.equal(row.canonical_matter_id, undefined);
  // No payment or scheduling fields are fabricated on the lead.
  assert.equal("payment_confirmed" in row, false);
  assert.equal("scheduling" in row, false);
  assert.equal("client_quoted_total" in row, false);
});

test("a pricing request cannot authoritatively select a tier or execution method", async () => {
  const state = fixture();
  await receivePricingRequest(makeRequest({ ...payload, tier: "executive", execution_method: "ron", client_quoted_total: 1850 }), state.dependencies);
  const row = state.rows.get(payload.request_id)!;
  // Extra client-sent authority fields are not promoted to columns; they can
  // only ride along inside details as an unverified preference.
  assert.equal("tier" in row, false);
  assert.equal("execution_method" in row, false);
  assert.equal("client_quoted_total" in row, false);
  assert.equal(row.lead_type, "pricing_request");
});

test("retrying an unchanged pricing request does not create another lead", async () => {
  const state = fixture();
  await receivePricingRequest(makeRequest(), state.dependencies);
  const retry = await receivePricingRequest(makeRequest(), state.dependencies);
  const receipt = await retry.json();
  assert.equal(retry.status, 200);
  assert.equal(receipt.duplicate, true);
  assert.equal(state.rows.size, 1);
  assert.deepEqual(state.writes, ["sales_leads"]);
});

test("a concurrent duplicate insert (23505) resolves to one lead, not two", async () => {
  const state = fixture({ raceOnInsert: true });
  const response = await receivePricingRequest(makeRequest(), state.dependencies);
  const receipt = await response.json();
  assert.equal(receipt.ok, true);
  assert.equal(state.rows.size, 1);
});

test("a changed resubmission under the same request_id is rejected (409), never overwritten", async () => {
  const state = fixture();
  await receivePricingRequest(makeRequest(), state.dependencies);
  const changed = await receivePricingRequest(makeRequest({ ...payload, destination: "Germany" }), state.dependencies);
  assert.equal(changed.status, 409);
  assert.equal(state.rows.get(payload.request_id)!.country, "Italy");
  assert.equal(state.rows.size, 1);
});

test("persistence failure never returns a receipt or attempts notification", async () => {
  const state = fixture({ persistenceFailure: true });
  const response = await receivePricingRequest(makeRequest(), state.dependencies);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ok, false);
  assert.equal(state.notifications(), 0);
});

test("notification failure does not fabricate delivery or lose the persisted request", async () => {
  const state = fixture({ notificationFailure: true });
  const response = await receivePricingRequest(makeRequest(), state.dependencies);
  const receipt = await response.json();
  assert.equal(receipt.ok, true);
  assert.equal(receipt.notification, "unavailable");
  assert.equal(state.rows.size, 1);
});

test("abuse limit and cross-origin submissions fail closed", async () => {
  const limited = fixture({ rateLimit: 10 });
  assert.equal((await receivePricingRequest(makeRequest(), limited.dependencies)).status, 429);
  const crossOrigin = fixture();
  assert.equal((await receivePricingRequest(makeRequest(payload, "https://attacker.example"), crossOrigin.dependencies)).status, 403);
  assert.equal(crossOrigin.rows.size, 0);
});

test("missing required fields, malformed email and unsupported values are rejected before persistence", async () => {
  const missing = fixture();
  assert.equal((await receivePricingRequest(makeRequest({ ...payload, full_name: "" }), missing.dependencies)).status, 400);
  assert.equal(missing.rows.size, 0);

  const malformed = fixture();
  assert.equal((await receivePricingRequest(makeRequest({ ...payload, email: "not-an-email" }), malformed.dependencies)).status, 400);
  assert.equal(malformed.rows.size, 0);

  const unsupported = fixture();
  assert.equal((await receivePricingRequest(makeRequest({ ...payload, service_intent: "free_legal_advice" }), unsupported.dependencies)).status, 400);
  assert.equal(unsupported.rows.size, 0);

  const shortDescription = fixture();
  assert.equal((await receivePricingRequest(makeRequest({ ...payload, description: "too short" }), shortDescription.dependencies)).status, 400);
  assert.equal(shortDescription.rows.size, 0);
});

test("the pricing request receiver never writes Matter, payment or scheduling state (source contract)", () => {
  const source = readFileSync("lib/acquisition/pricingRequest.ts", "utf8");
  // It only ever inserts into sales_leads.
  assert.match(source, /\.from\("sales_leads"\)/);
  assert.doesNotMatch(source, /\.from\("deals"\)/);
  assert.doesNotMatch(source, /createWisePaymentRequest|payment_confirmed|schedule|quote_state/);
  // It never sets canonical_matter_id on capture.
  assert.doesNotMatch(source, /canonical_matter_id:/);
});

test("operator Lead Pipeline surfaces pricing requests and stays access-gated", () => {
  const source = readFileSync("app/dashboard/leads/page.tsx", "utf8");
  assert.match(source, /await requireDashboardAccess\(\)/);
  assert.match(source, /\.from\("sales_leads"\)[\s\S]*?\.eq\("lead_type", "pricing_request"\)/);
  assert.match(source, /kind: lead\.canonical_matter_id \? "Pricing request → Matter" : "Pricing request"/);
  // The existing concierge pipeline contract is preserved.
  assert.match(source, /\.eq\("lead_type", "concierge_inquiry"\)/);
  assert.match(source, /kind: "Canonical Matter"/);
});

test("the Get Pricing experience shows no internal/tier price and routes to Milano review", () => {
  const form = readFileSync("components/conversion/GetPricingForm.tsx", "utf8");
  const pricingPage = readFileSync("app/pricing/page.tsx", "utf8");
  // No hard-coded dollar amount leaks into the conversion surface.
  assert.doesNotMatch(form, /\$\s?\d/);
  assert.doesNotMatch(pricingPage, /\$\s?\d{2,}/);
  // The request routes to review and makes the non-authority explicit.
  assert.match(form, /does not create a Matter/i);
  assert.match(form, /private quote/i);
  assert.match(form, /\/api\/pricing\/request/);
});
