// Server-side structural preflight. Uses node:crypto and pdf-lib only; no
// client bundle imports this module.
import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";

export const DOCUMENT_PREFLIGHT_SCANNER_VERSION = "document-preflight-v1";
export const DOCUMENT_PREFLIGHT_MAX_BYTES = 20 * 1024 * 1024;

export const DOCUMENT_PREFLIGHT_SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export type DocumentPreflightStatus = "READY" | "REVIEW_REQUIRED" | "BLOCKED";

export type DocumentPreflightReasonCode =
  | "READY"
  | "UNSUPPORTED_MIME"
  | "FILE_TOO_LARGE"
  | "EMPTY_FILE"
  | "PDF_PARSE_FAILED"
  | "PDF_ENCRYPTED"
  | "EXISTING_SIGNATURE"
  | "CERTIFICATION_SIGNATURE";

export interface DocumentPreflightResult {
  status: DocumentPreflightStatus;
  reasonCodes: DocumentPreflightReasonCode[];
  reviewReason: string | null;
  sha256: string;
  mimeType: string;
  sizeBytes: number;
  signatureDetected: boolean;
  certificationSignatureDetected: boolean;
  encryptionDetected: boolean;
  structuralIntegrity: "READY" | "BLOCKED" | "NOT_APPLICABLE";
  scannerVersion: string;
  checkedAt: string;
}

const textDecoder = new TextDecoder("latin1");

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function joinReason(codes: DocumentPreflightReasonCode[]): string | null {
  const labels: Record<DocumentPreflightReasonCode, string> = {
    READY: "Document preflight passed.",
    UNSUPPORTED_MIME: "File type is not supported by the controlled-record upload policy.",
    FILE_TOO_LARGE: "File exceeds the controlled-record upload size limit.",
    EMPTY_FILE: "File contains no bytes.",
    PDF_PARSE_FAILED: "PDF structure could not be parsed safely.",
    PDF_ENCRYPTED: "PDF is encrypted or password-protected and requires operator/provider review before execution.",
    EXISTING_SIGNATURE: "PDF contains an existing electronic signature field or signature dictionary.",
    CERTIFICATION_SIGNATURE: "PDF contains evidence of a certification signature / DocMDP transform.",
  };
  const meaningful = codes.filter((code) => code !== "READY");
  return meaningful.length ? meaningful.map((code) => labels[code]).join(" ") : null;
}

function detectPdfSignatureMarkers(bytes: Uint8Array): {
  signatureDetected: boolean;
  certificationSignatureDetected: boolean;
} {
  // Presence detection only. This does not claim cryptographic validity.
  const raw = textDecoder.decode(bytes);
  const signatureDetected =
    /\/FT\s*\/Sig\b/.test(raw) ||
    /\/Type\s*\/Sig\b/.test(raw) ||
    /\/ByteRange\s*\[/.test(raw);
  const certificationSignatureDetected =
    /\/DocMDP\b/.test(raw) ||
    /\/TransformMethod\s*\/DocMDP\b/.test(raw) ||
    /\/Perms\s*<</.test(raw);
  return { signatureDetected, certificationSignatureDetected };
}

export async function inspectDocumentPreflight(input: {
  bytes: Uint8Array;
  mimeType: string;
  fileName?: string | null;
  maxBytes?: number;
}): Promise<DocumentPreflightResult> {
  const checkedAt = new Date().toISOString();
  const bytes = input.bytes;
  const mimeType = String(input.mimeType || "").trim().toLowerCase();
  const sizeBytes = bytes.byteLength;
  const maxBytes = input.maxBytes ?? DOCUMENT_PREFLIGHT_MAX_BYTES;
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const reasons: DocumentPreflightReasonCode[] = [];

  if (!DOCUMENT_PREFLIGHT_SUPPORTED_MIME_TYPES.has(mimeType)) {
    reasons.push("UNSUPPORTED_MIME");
  }
  if (sizeBytes === 0) reasons.push("EMPTY_FILE");
  if (sizeBytes > maxBytes) reasons.push("FILE_TOO_LARGE");

  if (reasons.length > 0) {
    return {
      status: "BLOCKED",
      reasonCodes: unique(reasons),
      reviewReason: joinReason(reasons),
      sha256,
      mimeType,
      sizeBytes,
      signatureDetected: false,
      certificationSignatureDetected: false,
      encryptionDetected: false,
      structuralIntegrity: "BLOCKED",
      scannerVersion: DOCUMENT_PREFLIGHT_SCANNER_VERSION,
      checkedAt,
    };
  }

  if (mimeType !== "application/pdf") {
    return {
      status: "READY",
      reasonCodes: ["READY"],
      reviewReason: null,
      sha256,
      mimeType,
      sizeBytes,
      signatureDetected: false,
      certificationSignatureDetected: false,
      encryptionDetected: false,
      structuralIntegrity: "NOT_APPLICABLE",
      scannerVersion: DOCUMENT_PREFLIGHT_SCANNER_VERSION,
      checkedAt,
    };
  }

  let encrypted = false;
  try {
    const pdf = await PDFDocument.load(bytes, {
      ignoreEncryption: true,
      updateMetadata: false,
    });
    encrypted = Boolean(pdf.isEncrypted);
    // Force page-tree traversal so malformed page structures fail during preflight.
    pdf.getPageCount();
  } catch {
    return {
      status: "BLOCKED",
      reasonCodes: ["PDF_PARSE_FAILED"],
      reviewReason: joinReason(["PDF_PARSE_FAILED"]),
      sha256,
      mimeType,
      sizeBytes,
      signatureDetected: false,
      certificationSignatureDetected: false,
      encryptionDetected: false,
      structuralIntegrity: "BLOCKED",
      scannerVersion: DOCUMENT_PREFLIGHT_SCANNER_VERSION,
      checkedAt,
    };
  }

  const markers = detectPdfSignatureMarkers(bytes);
  if (encrypted) reasons.push("PDF_ENCRYPTED");
  if (markers.signatureDetected) reasons.push("EXISTING_SIGNATURE");
  if (markers.certificationSignatureDetected) reasons.push("CERTIFICATION_SIGNATURE");

  const status: DocumentPreflightStatus = encrypted
    ? "BLOCKED"
    : reasons.length > 0
      ? "REVIEW_REQUIRED"
      : "READY";

  return {
    status,
    reasonCodes: reasons.length > 0 ? unique(reasons) : ["READY"],
    reviewReason: joinReason(reasons),
    sha256,
    mimeType,
    sizeBytes,
    signatureDetected: markers.signatureDetected,
    certificationSignatureDetected: markers.certificationSignatureDetected,
    encryptionDetected: encrypted,
    structuralIntegrity: encrypted ? "BLOCKED" : "READY",
    scannerVersion: DOCUMENT_PREFLIGHT_SCANNER_VERSION,
    checkedAt,
  };
}

/** Columns written for every scanned upload (both upload paths). */
export function preflightColumns(result: DocumentPreflightResult) {
  return {
    sha256: result.sha256,
    signature_detected: result.signatureDetected,
    certification_signature_detected: result.certificationSignatureDetected,
    encryption_detected: result.encryptionDetected,
    structural_status: result.status,
    structural_review_reason: result.reviewReason,
    preflight_scanner_version: result.scannerVersion,
    preflight_checked_at: result.checkedAt,
  };
}
