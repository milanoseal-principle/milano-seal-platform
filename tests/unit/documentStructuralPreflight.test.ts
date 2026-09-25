import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import {
  DOCUMENT_PREFLIGHT_MAX_BYTES,
  inspectDocumentPreflight,
} from "@/lib/intelligence/execution-brain/documentPreflight";

async function cleanPdfBytes() {
  const pdf = await PDFDocument.create();
  pdf.addPage([612, 792]);
  return new Uint8Array(await pdf.save());
}

test("clean PDF is READY and produces a stable SHA-256", async () => {
  const bytes = await cleanPdfBytes();
  const first = await inspectDocumentPreflight({ bytes, mimeType: "application/pdf" });
  const second = await inspectDocumentPreflight({ bytes, mimeType: "application/pdf" });

  assert.equal(first.status, "READY");
  assert.equal(first.structuralIntegrity, "READY");
  assert.equal(first.signatureDetected, false);
  assert.equal(first.encryptionDetected, false);
  assert.equal(first.sha256, second.sha256);
  assert.equal(first.sha256.length, 64);
});

test("existing signature marker routes to REVIEW_REQUIRED rather than rejection", async () => {
  const clean = await cleanPdfBytes();
  const bytes = new Uint8Array(
    Buffer.concat([Buffer.from(clean), Buffer.from("\n% /FT /Sig /ByteRange [0 1 2 3]\n")]),
  );
  const result = await inspectDocumentPreflight({ bytes, mimeType: "application/pdf" });

  assert.equal(result.status, "REVIEW_REQUIRED");
  assert.equal(result.signatureDetected, true);
  assert.equal(result.reasonCodes.includes("EXISTING_SIGNATURE"), true);
});

test("certification signature marker routes to REVIEW_REQUIRED", async () => {
  const clean = await cleanPdfBytes();
  const bytes = new Uint8Array(
    Buffer.concat([Buffer.from(clean), Buffer.from("\n% /TransformMethod /DocMDP\n")]),
  );
  const result = await inspectDocumentPreflight({ bytes, mimeType: "application/pdf" });

  assert.equal(result.status, "REVIEW_REQUIRED");
  assert.equal(result.certificationSignatureDetected, true);
});

test("malformed PDF is BLOCKED", async () => {
  const result = await inspectDocumentPreflight({
    bytes: new Uint8Array(Buffer.from("%PDF-1.7\nthis is not a valid PDF")),
    mimeType: "application/pdf",
  });

  assert.equal(result.status, "BLOCKED");
  assert.equal(result.reasonCodes.includes("PDF_PARSE_FAILED"), true);
});

test("unsupported MIME is BLOCKED", async () => {
  const result = await inspectDocumentPreflight({
    bytes: new Uint8Array(Buffer.from("hello")),
    mimeType: "text/plain",
  });

  assert.equal(result.status, "BLOCKED");
  assert.equal(result.reasonCodes.includes("UNSUPPORTED_MIME"), true);
});

test("oversize file is BLOCKED before structural parsing", async () => {
  const result = await inspectDocumentPreflight({
    bytes: new Uint8Array(64),
    mimeType: "application/pdf",
    maxBytes: 32,
  });

  assert.equal(result.status, "BLOCKED");
  assert.equal(result.reasonCodes.includes("FILE_TOO_LARGE"), true);
});

test("upload route persists preflight evidence without exposing file path or SHA", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/api/upload/route.ts"), "utf8");
  assert.match(source, /inspectDocumentPreflight/);
  assert.match(source, /\.\.\.preflightColumns\(preflight\)/);
  assert.match(source, /never storage_path, file_path or SHA-256/i);
  // The upload response exposes status/reason only — never the SHA-256.
  const response = source.slice(source.indexOf("return NextResponse.json({\n      success: true"));
  assert.doesNotMatch(response, /sha256/);
});

test("preflight evidence columns map every scanner field", async () => {
  const { preflightColumns } = await import("@/lib/intelligence/execution-brain/documentPreflight");
  const result = await inspectDocumentPreflight({ bytes: await cleanPdfBytes(), mimeType: "application/pdf" });
  assert.deepEqual(preflightColumns(result), {
    sha256: result.sha256,
    signature_detected: false,
    certification_signature_detected: false,
    encryption_detected: false,
    structural_status: "READY",
    structural_review_reason: null,
    preflight_scanner_version: result.scannerVersion,
    preflight_checked_at: result.checkedAt,
  });
});

test("encrypted PDF is BLOCKED and the original bytes are never mutated", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage([612, 792]);
  const plain = Buffer.from(await pdf.save({ useObjectStreams: false })).toString("latin1");
  const encryptedSource = plain.replace(
    /trailer\s*<</,
    "trailer\n<< /Encrypt << /Filter /Standard /V 1 /R 2 /O (x) /U (y) /P -4 >>",
  );
  assert.notEqual(encryptedSource, plain, "fixture must carry an /Encrypt trailer entry");
  const bytes = new Uint8Array(Buffer.from(encryptedSource, "latin1"));
  const before = Buffer.from(bytes).toString("hex");
  const result = await inspectDocumentPreflight({ bytes, mimeType: "application/pdf" });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.encryptionDetected, true);
  assert.ok(result.reasonCodes.includes("PDF_ENCRYPTED"));
  assert.equal(Buffer.from(bytes).toString("hex"), before);
});

test("RON readiness fails closed unless execution documents pass structural preflight", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "components/ron/MatterRONReadiness.tsx"),
    "utf8",
  );
  assert.match(source, /structural_status/);
  assert.match(source, /documentPreflightReady/);
  assert.match(source, /Document structural preflight must be READY/);
});

test("canonical file size ceiling remains 20MB", () => {
  assert.equal(DOCUMENT_PREFLIGHT_MAX_BYTES, 20 * 1024 * 1024);
});

test("execution readiness fails closed across both files column dialects", async () => {
  const { evaluateExecutionDocumentReadiness } = await import(
    "@/lib/intelligence/execution-brain/documentReadiness"
  );
  // /api/upload rows carry file_type; /api/intake/upload rows carry mime_type.
  const ready = evaluateExecutionDocumentReadiness([
    { id: "a", filename: "poa.pdf", file_type: "application/pdf", structural_status: "READY" },
    { id: "b", name: "id.jpg", mime_type: "image/jpeg", structural_status: null },
  ]);
  assert.equal(ready.ready, true, "images are supporting records, not execution documents");
  assert.equal(ready.candidates.length, 1);

  const notRun = evaluateExecutionDocumentReadiness([
    { id: "a", name: "poa.pdf", mime_type: "application/pdf", structural_status: null },
  ]);
  assert.equal(notRun.ready, false);
  assert.equal(notRun.unresolved[0].status, "NOT_RUN");

  const review = evaluateExecutionDocumentReadiness([
    { id: "a", filename: "signed.pdf", file_type: "application/pdf", structural_status: "READY" },
    { id: "c", filename: "cert.pdf", file_type: "application/pdf", structural_status: "REVIEW_REQUIRED", structural_review_reason: "certification signature" },
  ]);
  assert.equal(review.ready, false);
  assert.deepEqual(review.unresolved.map((f) => f.label), ["cert.pdf"]);

  assert.equal(evaluateExecutionDocumentReadiness([]).ready, false);
});

test("both upload paths persist preflight evidence and BlueNotary fails closed server-side", () => {
  const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
  for (const route of ["app/api/upload/route.ts", "app/api/intake/upload/route.ts"]) {
    const source = read(route);
    assert.match(source, /inspectDocumentPreflight\(/, route);
    assert.match(source, /\.\.\.preflightColumns\(preflight\)/, route);
    assert.match(source, /mime_type: file\.type/, route);
  }
  const guard = read("app/api/dashboard/ron/sessions/route.ts");
  assert.match(guard, /evaluateExecutionDocumentReadiness\(/);
  assert.match(guard, /DOCUMENT_PREFLIGHT_NOT_READY/);
  const migration = read("supabase/migrations/081_document_structural_preflight.sql");
  for (const column of ["name", "mime_type", "size_bytes", "category", "is_internal", "file_type", "file_size", "sha256", "structural_status"]) {
    assert.match(migration, new RegExp(`ADD COLUMN IF NOT EXISTS ${column}\\b`), column);
  }
});
