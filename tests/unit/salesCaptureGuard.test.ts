import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MAX_SALES_CAPTURE_BODY_BYTES,
  MAX_SALES_CAPTURE_PER_IP_PER_HOUR,
  receiveSalesCapture,
} from "@/lib/acquisition/salesCapture";

const ORIGIN = "https://www.themilanoseal.com";

function fakeAdmin(recentForIp: number) {
  const state = { inserted: [] as Record<string, unknown>[], countFilters: [] as [string, unknown][] };
  const admin = {
    from(table: string) {
      assert.equal(table, "sales_leads");
      return {
        select(_cols: string, opts?: { count?: string; head?: boolean }) {
          if (opts?.head) {
            const chain = {
              eq(col: string, value: unknown) {
                state.countFilters.push([col, value]);
                return chain;
              },
              gte(col: string, value: unknown) {
                state.countFilters.push([col, value]);
                return Promise.resolve({ count: recentForIp, error: null });
              },
            };
            return chain;
          }
          throw new Error("unexpected select");
        },
        insert(row: Record<string, unknown>) {
          state.inserted.push(row);
          return { select: () => ({ single: () => Promise.resolve({ data: { id: "lead-1" }, error: null }) }) };
        },
      };
    },
  };
  return { state, deps: { admin: () => admin as unknown as SupabaseClient, hashIp: () => "iphash-1" } };
}

const req = (body: unknown, headers: Record<string, string> = { origin: ORIGIN }) =>
  new Request(`${ORIGIN}/api/sales/capture`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

test("application capture persists one lead with the per-IP key", async () => {
  const f = fakeAdmin(0);
  const res = await receiveSalesCapture(req({ email: "a@example.com", desired_next_step: "va_application" }), f.deps);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.leadType, "va_application");
  assert.equal(f.state.inserted.length, 1);
  assert.equal(f.state.inserted[0].ip_hash, "iphash-1");
  assert.deepEqual(f.state.countFilters[0], ["ip_hash", "iphash-1"]);
});

test("abuse controls refuse before any lead is written", async () => {
  const cases: [string, Request, number, number][] = [
    ["foreign origin", req({ email: "a@example.com" }, { origin: "https://evil.example" }), 0, 403],
    ["declared oversize", req({ email: "a@example.com" }, { origin: ORIGIN, "content-length": String(MAX_SALES_CAPTURE_BODY_BYTES + 1) }), 0, 413],
    ["actual oversize", req({ email: "a@example.com", notes: "x".repeat(MAX_SALES_CAPTURE_BODY_BYTES) }), 0, 413],
    ["malformed", req("{nope"), 0, 400],
    ["array body", req([{ email: "a@example.com" }]), 0, 400],
    ["missing email", req({ full_name: "A" }), 0, 400],
    ["hourly per-IP limit", req({ email: "a@example.com" }), MAX_SALES_CAPTURE_PER_IP_PER_HOUR, 429],
  ];
  for (const [name, request, recent, status] of cases) {
    const f = fakeAdmin(recent);
    const res = await receiveSalesCapture(request, f.deps);
    assert.equal(res.status, status, name);
    assert.equal((await res.json()).ok, false, name);
    assert.equal(f.state.inserted.length, 0, `${name}: nothing persisted`);
  }
});
