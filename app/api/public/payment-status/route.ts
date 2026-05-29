import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";

// SECURITY-06: Requires both deal_id and access_token.
// Knowing only the deal_id string is insufficient to poll payment status.
// Both params must match the same deals row — mismatch returns 404
// (no information leak about which field is wrong).

export async function GET(req: NextRequest) {
  const dealId = req.nextUrl.searchParams.get("deal_id");
  const accessToken = req.nextUrl.searchParams.get("access_token");

  if (!dealId || !accessToken) {
    return NextResponse.json(
      { error: "deal_id and access_token are required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Validate both deal_id AND access_token in a single query.
  // Select only the fields needed — never fetch the full deal row.
  const { data } = await admin
    .from("deals")
    .select(
      "deal_id, payment_status, status, invoice_balance, payment_reference, invoice_subtotal"
    )
    .eq("deal_id", dealId)
    .eq("access_token", accessToken)
    .maybeSingle();

  if (!data) {
    // Unified 404 — do not differentiate between wrong deal_id vs wrong access_token
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await audit({
      event: "resource.read",
      actor: null,
      resource: `deals:${dealId}`,
      payload: {
        action: "read",
        status: "success",
        endpoint: "public/payment-status",
      },
    });
  } catch {
    // Logging failure must never block production flow
  }

  // Strictly minimal response — no internal fields, no pricing breakdown,
  // no operator-only fields, no document paths, no client notes.
  return NextResponse.json(
    {
      deal_id: data.deal_id ?? dealId,
      payment_status: data.payment_status ?? null,
      deal_status: data.status ?? null,
      amount_due:
        data.invoice_balance != null
          ? data.invoice_balance
          : (data.invoice_subtotal ?? null),
      invoice_reference: data.payment_reference ?? null,
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
