// /api/intake/extract — public, anonymous document pre-read for the intake
// page (lib/intake/matterAnalysis.ts). Each accepted request may send up to
// MAX_FILES documents to a paid model provider (Anthropic, then Groq), so every
// refusal below happens BEFORE any file is parsed or any provider is called:
//   - owner off-switch:  INTAKE_EXTRACT_ENABLED=false  -> 503
//   - cross-site caller (the intake page is same-origin) -> 403
//   - oversized body (declared or actual) / message     -> 413
//   - durable per-client / global daily limit           -> 429 + Retry-After
//     (limiter unavailable -> 503: fail closed)
// Provider error text is never returned to the caller.

import { NextResponse } from "next/server";
import { retryAfterHeaders, type RequestLimitDecision } from "@/lib/security/publicRequestLimit";
import { isSameOriginRequest } from "@/lib/security/sameOriginRequest";

/** Vercel's serverless request-body ceiling; larger bodies never reach us intact. */
export const MAX_EXTRACT_BODY_BYTES = 4.5 * 1024 * 1024;
export const MAX_EXTRACT_MESSAGE_CHARS = 8000;
export const MAX_EXTRACT_FILES = 10;

const UNAVAILABLE = "Document reading is temporarily unavailable. You can continue your intake without it.";

export interface IntakeExtractDeps<Block> {
  env: Record<string, string | undefined>;
  /** Durable per-client and global daily limit, consumed only for a request that reaches parsing/provider. */
  limit: (request: Request) => Promise<RequestLimitDecision>;
  parseFiles: (files: File[]) => Promise<
    { name: string; size: number; mime: string; ok: boolean; error?: string; block: Block; textBlock?: Block }[]
  >;
  extractIntake: (input: { message: string; fileBlocks: Block[] }) => Promise<unknown>;
}

function refuse(status: 400 | 403 | 413 | 500 | 503, error: string, code: string) {
  return NextResponse.json({ ok: false, error, code }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function handleIntakeExtract<Block>(
  request: Request,
  deps: IntakeExtractDeps<Block>,
): Promise<NextResponse> {
  if (deps.env.INTAKE_EXTRACT_ENABLED?.trim().toLowerCase() === "false") {
    return refuse(503, UNAVAILABLE, "INTAKE_EXTRACT_DISABLED");
  }
  if (!isSameOriginRequest(request)) {
    return refuse(403, "Please use the Milano intake page.", "INTAKE_EXTRACT_CROSS_SITE_REFUSED");
  }
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_EXTRACT_BODY_BYTES) {
    return refuse(413, "These documents are too large to read here. Continue your intake and attach them there.", "INTAKE_EXTRACT_TOO_LARGE");
  }

  // Read with an enforced ceiling, so a missing or false Content-Length cannot
  // make us buffer an unbounded body.
  let bytes: Uint8Array;
  try {
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_EXTRACT_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        return refuse(413, "These documents are too large to read here. Continue your intake and attach them there.", "INTAKE_EXTRACT_TOO_LARGE");
      }
      chunks.push(value);
    }
    bytes = Buffer.concat(chunks);
  } catch {
    return refuse(400, "Invalid form data", "INTAKE_EXTRACT_INVALID_FORM");
  }

  let formData: FormData;
  try {
    formData = await new Request(request.url, {
      method: "POST",
      headers: { "content-type": request.headers.get("content-type") ?? "" },
      body: bytes,
    }).formData();
  } catch {
    return refuse(400, "Invalid form data", "INTAKE_EXTRACT_INVALID_FORM");
  }

  const messageEntry = formData.get("message");
  const message = typeof messageEntry === "string" ? messageEntry : "";
  if (message.length > MAX_EXTRACT_MESSAGE_CHARS) {
    return refuse(413, `Please shorten your description to ${MAX_EXTRACT_MESSAGE_CHARS.toLocaleString("en-US")} characters or fewer.`, "INTAKE_EXTRACT_MESSAGE_TOO_LONG");
  }
  const fileEntries = formData.getAll("files").filter((f): f is File => typeof f === "object" && f !== null && "arrayBuffer" in f);
  if (!message.trim() && fileEntries.length === 0) {
    return refuse(400, "Provide either a message or at least one file", "INTAKE_EXTRACT_EMPTY");
  }

  // Durable limits last: malformed or oversized requests never consume a caller's allowance.
  const decision = await deps.limit(request);
  if (!decision.allowed) {
    if (decision.status === 503) return refuse(503, UNAVAILABLE, "INTAKE_EXTRACT_LIMIT_UNAVAILABLE");
    return NextResponse.json(
      { ok: false, error: "Document reading is busy right now. You can continue your intake without it.", code: "INTAKE_EXTRACT_RATE_LIMITED" },
      { status: 429, headers: { "Cache-Control": "no-store", ...retryAfterHeaders(decision) } },
    );
  }

  const parsed = await deps.parseFiles(fileEntries.slice(0, MAX_EXTRACT_FILES));
  const usableBlocks: Block[] = parsed
    .filter((p) => p.ok)
    .flatMap((p) => (p.textBlock ? [p.block, p.textBlock] : [p.block]));

  let extraction: unknown;
  try {
    extraction = await deps.extractIntake({ message, fileBlocks: usableBlocks });
  } catch (error) {
    // Provider responses can echo request content or account details: log a
    // bounded server-side note and return a generic message.
    console.error("[intake/extract] extraction failed", error instanceof Error ? error.message.slice(0, 200) : "unknown");
    return refuse(500, "Document reading failed. You can continue your intake without it.", "INTAKE_EXTRACT_FAILED");
  }

  return NextResponse.json({
    ok: true,
    extraction,
    files: parsed.map((p) => ({ name: p.name, size: p.size, mime: p.mime, parsed: p.ok, error: p.error })),
  });
}
