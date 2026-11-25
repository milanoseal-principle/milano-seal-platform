import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_EXTRACT_BODY_BYTES,
  MAX_EXTRACT_FILES,
  MAX_EXTRACT_MESSAGE_CHARS,
  handleIntakeExtract,
} from "@/lib/ai/intakeExtractHandler";

const ORIGIN = "https://www.themilanoseal.com";

function deps(env: Record<string, string | undefined> = {}, fail?: Error) {
  const seen = { parsed: 0, extracted: 0 };
  return {
    seen,
    deps: {
      env,
      parseFiles: async (files: File[]) => {
        seen.parsed += files.length;
        return files.map((f) => ({ name: f.name, size: f.size, mime: f.type, ok: true, block: { type: "text", text: f.name } }));
      },
      extractIntake: async () => {
        seen.extracted += 1;
        if (fail) throw fail;
        return { provider: "ai", destinationCountry: "IT" };
      },
    },
  };
}

function form(parts: { message?: string; files?: File[] }, headers: Record<string, string> = { origin: ORIGIN }) {
  const fd = new FormData();
  if (parts.message !== undefined) fd.append("message", parts.message);
  for (const f of parts.files ?? []) fd.append("files", f);
  return new Request(`${ORIGIN}/api/intake/extract`, { method: "POST", headers, body: fd });
}

test("same-origin intake pre-read parses files and calls the extractor once", async () => {
  const d = deps();
  const res = await handleIntakeExtract(form({ message: "Birth certificate for Italy", files: [new File(["a"], "cert.pdf", { type: "application/pdf" })] }), d.deps);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.deepEqual(body.extraction, { provider: "ai", destinationCountry: "IT" });
  assert.equal(d.seen.parsed, 1);
  assert.equal(d.seen.extracted, 1);
});

test("refusals happen before any parsing or paid provider call", async () => {
  const big = new File([new Uint8Array(MAX_EXTRACT_BODY_BYTES + 1)], "big.pdf", { type: "application/pdf" });
  const cases: [string, Request, Record<string, string | undefined>, number, string][] = [
    ["off-switch", form({ message: "hi" }), { INTAKE_EXTRACT_ENABLED: "false" }, 503, "INTAKE_EXTRACT_DISABLED"],
    ["foreign origin", form({ message: "hi" }, { origin: "https://evil.example" }), {}, 403, "INTAKE_EXTRACT_CROSS_SITE_REFUSED"],
    ["cross-site metadata", form({ message: "hi" }, { origin: ORIGIN, "sec-fetch-site": "cross-site" }), {}, 403, "INTAKE_EXTRACT_CROSS_SITE_REFUSED"],
    ["no origin, no fetch metadata", form({ message: "hi" }, {}), {}, 403, "INTAKE_EXTRACT_CROSS_SITE_REFUSED"],
    ["declared oversize", form({ message: "hi" }, { origin: ORIGIN, "content-length": String(MAX_EXTRACT_BODY_BYTES + 1) }), {}, 413, "INTAKE_EXTRACT_TOO_LARGE"],
    ["actual oversize (streamed)", form({ files: [big] }), {}, 413, "INTAKE_EXTRACT_TOO_LARGE"],
    ["message too long", form({ message: "m".repeat(MAX_EXTRACT_MESSAGE_CHARS + 1) }), {}, 413, "INTAKE_EXTRACT_MESSAGE_TOO_LONG"],
    ["empty", form({ message: "  " }), {}, 400, "INTAKE_EXTRACT_EMPTY"],
  ];
  for (const [name, request, env, status, code] of cases) {
    const d = deps(env);
    const res = await handleIntakeExtract(request, d.deps);
    const body = await res.json();
    assert.equal(res.status, status, name);
    assert.equal(body.code, code, name);
    assert.equal(body.ok, false, name);
    assert.equal(typeof body.error, "string", `${name}: the intake page shows error`);
    assert.equal(d.seen.parsed, 0, `${name}: no parsing`);
    assert.equal(d.seen.extracted, 0, `${name}: no provider call`);
  }
});

test("only the first MAX_EXTRACT_FILES files are parsed", async () => {
  const d = deps();
  const files = Array.from({ length: MAX_EXTRACT_FILES + 3 }, (_, i) => new File(["x"], `f${i}.pdf`, { type: "application/pdf" }));
  const res = await handleIntakeExtract(form({ files }), d.deps);
  assert.equal(res.status, 200);
  assert.equal(d.seen.parsed, MAX_EXTRACT_FILES);
});

test("provider failure text is never returned to the caller", async () => {
  const d = deps({}, new Error("Anthropic 401: invalid x-api-key sk-ant-REDACTED account org-123"));
  const original = console.error;
  console.error = () => undefined;
  try {
    const res = await handleIntakeExtract(form({ message: "hi" }), d.deps);
    assert.equal(res.status, 500);
    const text = await res.text();
    assert.doesNotMatch(text, /Anthropic|api-key|sk-ant|org-123/);
    assert.equal(JSON.parse(text).code, "INTAKE_EXTRACT_FAILED");
  } finally {
    console.error = original;
  }
});
