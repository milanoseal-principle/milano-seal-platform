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
  assert.match(source, /structural_status: preflight\.status/);
  assert.match(source, /signature_detected: preflight\.signatureDetected/);
  assert.match(source, /encryption_detected: preflight\.encryptionDetected/);
  assert.match(source, /never storage_path, file_path or SHA-256/i);
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
