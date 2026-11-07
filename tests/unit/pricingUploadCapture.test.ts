import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { receivePricingUpload } from "@/lib/acquisition/pricingUpload";
import { createAdminClient } from "@/lib/supabase/admin";

// P1 §9 secure-upload delta. Optional documents attach to a persisted pricing
// request (sales_leads, lead_type 'pricing_request') via the existing private
// bucket + structural preflight, without creating a Matter/payment/scheduling
// state. Runs against an injected in-memory admin + storage (no real DB/bucket).

const REQ = "b1d9f0b2-1c2e-4d7a-9f3b-2a5c7e9d0a11";

async function validPdfBytes() {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  return doc.save(); // Uint8Array of a structurally valid PDF
}

function fileFrom(bytes: Uint8Array | ArrayBuffer, name: string, type: string) {
  return new File([bytes], name, { type });
}

function makeRequest(parts: { request_id?: string; files?: File[] }, origin = "https://www.themilanoseal.com") {
  const fd = new FormData();
  if (parts.request_id !== undefined) fd.append("request_id", parts.request_id);
  for (const f of parts.files ?? []) fd.append("files", f);
  return new Request("https://www.themilanoseal.com/api/pricing/request/upload", { method: "POST", headers: { origin }, body: fd });
}

function fixture(opts: { lead?: Record<string, any> | null; storageFail?: boolean; updateFail?: boolean } = {}) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const leadRow = opts.lead === undefined ? { id: REQ, lead_type: "pricing_request", details: { description: "seed" } } : opts.lead;
  const storageWrites: { bucket: string; path: string }[] = [];
  const admin = {
    from() {
      let action = "select";
      let payload: Record<string, any> | null = null; // eslint-disable-line @typescript-eslint/no-explicit-any
      const filters: Record<string, string> = {};
      const q: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
        select() { return q; },
        update(value: Record<string, any>) { action = "update"; payload = value; return q; }, // eslint-disable-line @typescript-eslint/no-explicit-any
        eq(f: string, v: string) { filters[f] = v; return q; },
        maybeSingle() {
          const match = leadRow && filters.id === leadRow.id && (!filters.lead_type || filters.lead_type === leadRow.lead_type);
          return Promise.resolve({ data: match ? leadRow : null, error: null });
        },
        then(resolve: (value: any) => unknown) { // eslint-disable-line @typescript-eslint/no-explicit-any
          if (action === "update") {
            if (opts.updateFail) return Promise.resolve(resolve({ error: { code: "DB_FAILURE" } }));
            if (leadRow && payload) leadRow.details = payload.details;
            return Promise.resolve(resolve({ error: null }));
          }
          return Promise.resolve(resolve({ error: null }));
        },
      };
      return q;
    },
    storage: {
      from(bucket: string) {
        return {
          upload(path: string, _bytes: unknown, _opts: unknown) {
            storageWrites.push({ bucket, path });
            return Promise.resolve({ error: opts.storageFail ? { message: "storage failed" } : null });
          },
        };
      },
    },
  };
  return {
    storageWrites,
    lead: () => leadRow,
    uploads: () => (leadRow?.details?.uploads ?? []) as any[], // eslint-disable-line @typescript-eslint/no-explicit-any
    deps: { admin: () => admin as unknown as ReturnType<typeof createAdminClient> },
  };
}

test("a valid document attaches to the pricing request under its request_id, with no contents leaked", async () => {
  const pdf = await validPdfBytes();
  const state = fixture();
  const res = await receivePricingUpload(makeRequest({ request_id: REQ, files: [fileFrom(pdf, "poa.pdf", "application/pdf")] }), state.deps);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.requires_attention, false);
  assert.equal(body.uploaded.length, 1);
  // Response carries only non-sensitive references — no storage_path, no bytes.
  assert.equal("storage_path" in body.uploaded[0], false);
  assert.equal("sha256" in body.uploaded[0], false);
  // Stored under pricing-requests/<request_id>/… in the existing private bucket.
  assert.equal(state.storageWrites.length, 1);
  assert.equal(state.storageWrites[0].bucket, "deal-documents");
  assert.ok(state.storageWrites[0].path.startsWith(`pricing-requests/${REQ}/`));
  // Recorded on the lead as a reference only; the original pricing facts survive.
  assert.equal(state.uploads().length, 1);
  assert.equal(state.lead()!.details.description, "seed");
  assert.equal("canonical_matter_id" in state.lead()!, false);
});

test("a file whose bytes are not a real document is rejected by preflight before any storage write", async () => {
  const state = fixture();
  const notPdf = new TextEncoder().encode("this is definitely not a pdf");
  const res = await receivePricingUpload(makeRequest({ request_id: REQ, files: [fileFrom(notPdf, "evil.pdf", "application/pdf")] }), state.deps);
  const body = await res.json();
  assert.equal(res.status, 207);
  assert.equal(body.requires_attention, true);
  assert.equal(body.errors.length, 1);
  assert.equal(state.storageWrites.length, 0);
  assert.equal(state.uploads().length, 0);
});

test("oversized and unsupported files are rejected without storage writes", async () => {
  const oversized = fixture();
  const big = fileFrom(new Uint8Array(20 * 1024 * 1024 + 1), "big.pdf", "application/pdf");
  const r1 = await receivePricingUpload(makeRequest({ request_id: REQ, files: [big] }), oversized.deps);
  assert.equal((await r1.json()).requires_attention, true);
  assert.equal(oversized.storageWrites.length, 0);

  const unsupported = fixture();
  const r2 = await receivePricingUpload(makeRequest({ request_id: REQ, files: [fileFrom(new TextEncoder().encode("hi"), "notes.txt", "text/plain")] }), unsupported.deps);
  assert.equal((await r2.json()).requires_attention, true);
  assert.equal(unsupported.storageWrites.length, 0);
  assert.equal(unsupported.uploads().length, 0);
});

test("retrying the same document is idempotent — one object, one reference", async () => {
  const pdf = await validPdfBytes();
  const state = fixture();
  await receivePricingUpload(makeRequest({ request_id: REQ, files: [fileFrom(pdf, "poa.pdf", "application/pdf")] }), state.deps);
  await receivePricingUpload(makeRequest({ request_id: REQ, files: [fileFrom(pdf, "poa.pdf", "application/pdf")] }), state.deps);
  assert.equal(state.uploads().length, 1);
  // Two identical files in one request also dedupe to one.
  const single = fixture();
  await receivePricingUpload(makeRequest({ request_id: REQ, files: [fileFrom(pdf, "a.pdf", "application/pdf"), fileFrom(pdf, "b.pdf", "application/pdf")] }), single.deps);
  assert.equal(single.uploads().length, 1);
});

test("a storage failure never destroys the pricing request and reports attention", async () => {
  const pdf = await validPdfBytes();
  const state = fixture({ storageFail: true });
  const res = await receivePricingUpload(makeRequest({ request_id: REQ, files: [fileFrom(pdf, "poa.pdf", "application/pdf")] }), state.deps);
  const body = await res.json();
  assert.equal(body.requires_attention, true);
  assert.equal(body.reference, REQ);
  // The lead row and its original facts are intact; no partial upload recorded.
  assert.equal(state.uploads().length, 0);
  assert.equal(state.lead()!.details.description, "seed");
});

test("uploads only attach to an existing pricing request; bad reference or missing lead is refused", async () => {
  const pdf = await validPdfBytes();
  const badId = fixture();
  assert.equal((await receivePricingUpload(makeRequest({ request_id: "not-a-uuid", files: [fileFrom(pdf, "a.pdf", "application/pdf")] }), badId.deps)).status, 400);

  const missing = fixture({ lead: null });
  const res = await receivePricingUpload(makeRequest({ request_id: REQ, files: [fileFrom(pdf, "a.pdf", "application/pdf")] }), missing.deps);
  assert.equal(res.status, 404);
  assert.equal(missing.storageWrites.length, 0);

  const crossOrigin = fixture();
  assert.equal((await receivePricingUpload(makeRequest({ request_id: REQ, files: [fileFrom(pdf, "a.pdf", "application/pdf")] }, "https://attacker.example"), crossOrigin.deps)).status, 403);
  assert.equal(crossOrigin.storageWrites.length, 0);
});

test("the upload receiver never creates a Matter, payment, scheduling state or public URL (source contract)", () => {
  const source = readFileSync("lib/acquisition/pricingUpload.ts", "utf8");
  assert.match(source, /\.from\("sales_leads"\)/);
  assert.doesNotMatch(source, /\.from\("deals"\)/);
  assert.doesNotMatch(source, /createWisePaymentRequest|payment_confirmed|schedule|quote_state|canonical_matter_id:/);
  // Private bucket only; never a public URL / public bucket.
  assert.match(source, /"deal-documents"/);
  assert.doesNotMatch(source, /getPublicUrl|public:\s*true|makePublic/);
  // Never imports analytics/notification and never logs: contents and metadata
  // stay out of them (checks imports/calls, not comment prose).
  assert.doesNotMatch(source, /from ["']@\/lib\/notifications|from ["']@\/lib\/analytics|console\.(log|info|warn|error)/);
});

test("operator Lead Pipeline shows upload state/count only, never document contents", () => {
  const source = readFileSync("app/dashboard/leads/page.tsx", "utf8");
  assert.match(source, /details\?\.uploads/);
  assert.match(source, /doc\$\{uploadCount === 1 \? "" : "s"\} attached/);
  // It derives a count; it does not read storage_path or bytes into the view.
  assert.doesNotMatch(source, /storage_path/);
});
