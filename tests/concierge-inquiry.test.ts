import test from "node:test";
import assert from "node:assert/strict";
import { receiveConciergeInquiry } from "@/lib/acquisition/concierge";
import { resolveConciergeContext } from "@/lib/acquisition/concierge-context";
import { createAdminClient } from "@/lib/supabase/admin";

const payload = {
  request_id: "8f0f3a5a-8a61-49f4-a31f-82727407e3f2",
  full_name: "Maria Rossi",
  email: "maria@example.com",
  phone: "+1 555 0100",
  audience: "individual",
  service_intent: "unsure",
  destination: "Italy",
  urgency: "routine",
  question: "I need help deciding what my document requires.",
  originating_page: "/",
  attribution: { source: "homepage", utm_campaign: "fall" },
  website: "",
} as const;

function makeRequest(body: unknown = payload, origin = "https://www.themilanoseal.com") {
  return new Request("https://www.themilanoseal.com/api/concierge", {
    method: "POST",
    headers: { origin },
    body: JSON.stringify(body),
  });
}

function fixture(options: { persistenceFailure?: boolean; rateLimit?: number; notificationFailure?: boolean } = {}) {
  const rows = new Map<string, Record<string, any>>(); // eslint-disable-line @typescript-eslint/no-explicit-any
  const writes: string[] = [];
  let notifications = 0;
  const admin = {
    from(table: string) {
      let action = "select";
      let input: Record<string, any> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
      const filters: Record<string, string> = {};
      const query = {
        select(_columns?: string, options?: { head?: boolean }) {
          if (options?.head) action = "count";
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

test("concierge inquiry persists to canonical sales leads and preserves attribution", async () => {
  const state = fixture();
  const response = await receiveConciergeInquiry(makeRequest(), state.dependencies);
  const receipt = await response.json();
  assert.equal(response.status, 201);
  assert.equal(receipt.ok, true);
  assert.equal(receipt.notification, "provider_accepted");
  assert.equal(state.rows.get(payload.request_id)?.lead_type, "concierge_inquiry");
  assert.equal(state.rows.get(payload.request_id)?.audience, "individual");
  assert.equal(state.rows.get(payload.request_id)?.product_interest, "unsure");
  assert.equal(state.rows.get(payload.request_id)?.country, "Italy");
  assert.equal(state.rows.get(payload.request_id)?.urgency, "routine");
  assert.equal(state.rows.get(payload.request_id)?.source_route, "/");
  assert.equal(state.rows.get(payload.request_id)?.details.question, payload.question);
  assert.equal(state.rows.get(payload.request_id)?.details.attribution.utm_campaign, "fall");
  assert.deepEqual(state.writes, ["sales_leads"]);
  assert.equal(state.rows.get(payload.request_id)?.canonical_matter_id, undefined);
});

test("retrying an unchanged concierge request does not create another lead", async () => {
  const state = fixture();
  await receiveConciergeInquiry(makeRequest(), state.dependencies);
  const retry = await receiveConciergeInquiry(makeRequest(), state.dependencies);
  const receipt = await retry.json();
  assert.equal(retry.status, 200);
  assert.equal(receipt.duplicate, true);
  assert.equal(state.rows.size, 1);
  assert.deepEqual(state.writes, ["sales_leads"]);
});

test("persistence failure never returns a receipt or attempts notification", async () => {
  const state = fixture({ persistenceFailure: true });
  const response = await receiveConciergeInquiry(makeRequest(), state.dependencies);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ok, false);
  assert.equal(state.notifications(), 0);
});

test("notification failure does not fabricate delivery or lose the persisted inquiry", async () => {
  const state = fixture({ notificationFailure: true });
  const response = await receiveConciergeInquiry(makeRequest(), state.dependencies);
  const receipt = await response.json();
  assert.equal(receipt.ok, true);
  assert.equal(receipt.notification, "unavailable");
  assert.equal(state.rows.size, 1);
});

test("abuse limit and origin validation fail closed", async () => {
  const limited = fixture({ rateLimit: 10 });
  assert.equal((await receiveConciergeInquiry(makeRequest(), limited.dependencies)).status, 429);
  const crossOrigin = fixture();
  assert.equal((await receiveConciergeInquiry(makeRequest(payload, "https://attacker.example"), crossOrigin.dependencies)).status, 403);
  assert.equal(crossOrigin.rows.size, 0);
});

test("missing required fields and malformed email are rejected before persistence", async () => {
  const missing = fixture();
  const missingResponse = await receiveConciergeInquiry(makeRequest({ ...payload, full_name: "" }), missing.dependencies);
  assert.equal(missingResponse.status, 400);
  assert.equal(missing.rows.size, 0);

  const malformed = fixture();
  const malformedResponse = await receiveConciergeInquiry(makeRequest({ ...payload, email: "not-an-email" }), malformed.dependencies);
  assert.equal(malformedResponse.status, 400);
  assert.equal(malformed.rows.size, 0);
});

test("operator pipeline distinguishes concierge inquiries from Matter leads and remains access-gated", async () => {
  const { readFileSync } = await import("node:fs");
  const source = readFileSync("app/dashboard/leads/page.tsx", "utf8");
  assert.match(source, /await requireDashboardAccess\(\)/);
  assert.match(source, /\.from\("sales_leads"\)[\s\S]*?\.eq\("lead_type", "concierge_inquiry"\)/);
  assert.match(source, /kind: "Concierge inquiry"/);
  assert.match(source, /kind: "Canonical Matter"/);
  assert.match(source, /Lead pipeline data is temporarily unavailable or incomplete/);
  assert.match(source, /pipelineDataUnavailable \? "Lead data unavailable\."/);
});

test("concierge context preserves service, destination, audience, urgency and attribution", () => {
  assert.deepEqual(resolveConciergeContext({
    service_intent: "apostille",
    destination: "Italy",
    audience: "professional",
    urgency: "urgent",
    originating_page: "/services/apostille",
    source: "search",
    medium: "organic",
    campaign: "italy-records",
    content: "hero-cta",
  }), {
    attribution: {
      source: "search",
      medium: "organic",
      campaign: "italy-records",
      content: "hero-cta",
      originating_page: "/services/apostille",
    },
    initialServiceIntent: "apostille",
    initialDestination: "Italy",
    initialAudience: "professional",
    initialUrgency: "urgent",
  });
});

test("originating page is stored as a same-site path without query tokens", () => {
  assert.equal(
    resolveConciergeContext({ originating_page: "/services/apostille?token=private" }).attribution.originating_page,
    "/services/apostille",
  );
  assert.equal(
    resolveConciergeContext({ originating_page: "https://attacker.example/collect" }).attribution.originating_page,
    "/speak-with-nicholas",
  );
});