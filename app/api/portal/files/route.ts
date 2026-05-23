import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  assertCanViewDeal,
  ResourceActor,
} from "@/lib/resource-guards";

// SECURITY-05: Portal files route — requires a verified portal session.
// The portal session token (base64 JSON) is passed via Authorization header
// or the `session` query param. Access is scoped to the session's deal_id.
//
// Session format issued by /api/portal/confirm:
//   base64(JSON.stringify({ deal_id: string, ts: number }))
//
// TODO SECURITY-06: replace base64 session with a signed JWT (HMAC-SHA256)
// so session tokens cannot be forged by base64-encoding arbitrary deal_ids.

function parsePortalSession(
  req: NextRequest,
): { dealId: string; email: string } | null {
  // Accept session from Authorization: Bearer <token> or ?session=<token>
  const authHeader = req.headers.get("authorization") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  const sessionParam = req.nextUrl.searchParams.get("session");
  const raw = bearerToken ?? sessionParam;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf-8")) as {
      deal_id?: unknown;
      email?: unknown;
      ts?: unknown;
    };
    if (typeof parsed.deal_id !== "string") return null;
    // email may not have been set in old sessions — fall back to empty string
    const email =
      typeof parsed.email === "string" ? parsed.email : "";
    return { dealId: parsed.deal_id, email };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const session = parsePortalSession(req);
  if (!session) {
    return NextResponse.json(
      { error: "Portal session required" },
      { status: 401 },
    );
  }

  const actor: ResourceActor = {
    kind: "portal",
    dealId: session.dealId,
    email: session.email,
  };

  // Assert that the portal session grants access to the requested deal
  const requestedDealId =
    req.nextUrl.searchParams.get("deal_id") ?? session.dealId;

  const guard = await assertCanViewDeal(actor, requestedDealId);
  if (guard) return guard.response;

  const supabase = createAdminClient();
  const { data: files } = await supabase
    .from("files")
    .select("id, deal_id, file_path, storage_path, uploaded_by, created_at, filename, file_type, file_size")
    .eq("deal_id", requestedDealId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ files: files ?? [] });
}
