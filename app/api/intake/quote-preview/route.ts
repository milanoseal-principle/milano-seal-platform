import { NextResponse } from "next/server";
import { buildIntakeQuotePreview, intakeQuotePreviewSchema } from "@/lib/pricing/intakeQuotePreview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 32 * 1024;

// Public, read-only, stateless: computes a client-safe pricing preview on the
// server so the private pricing engine never ships to the browser. It writes
// nothing and is never payment, scheduling or quote authority.
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Please use the Milano website." }, { status: 403 });
  }
  let raw: unknown;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request too large." }, { status: 413 });
    }
    raw = JSON.parse(body || "{}");
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = intakeQuotePreviewSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  try {
    return NextResponse.json(buildIntakeQuotePreview(parsed.data), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Preview unavailable." }, { status: 503 });
  }
}
