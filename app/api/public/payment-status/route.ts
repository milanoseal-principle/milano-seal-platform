import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";

// SECURITY-05: Hardened public payment-status endpoint.
// - Queries only by deal_id (opaque short-code alias, not UUID).
// - Response is stripped to the minimum needed by the client portal widget:
//   payment_status, deal_status, amount_due, invoice_reference, deal_id.
// - No full deal object, no client notes, no document paths, no pricing
//   internals, no operator fields, no margin data.
//
// Access model: this endpoint is intentionally public (no session required)
// because it is called from the unauthenticated client portal page using the
// deal_id short-code, which acts as an opaque token. Enumerability risk is
// low because deal_id strings are non-sequential and not guessable; however,
// future hardening should add access_token validation (SECURITY-06).
//
// TODO SECURITY-06: require access_token param alongside deal_id so that
// knowing only the deal_id string is insufficient to poll payment status.

export async function GET(req: NextRequest) {
  const dealId = req.nextUrl.searchParams.get("deal_id");
  if (!dealId) {
    return NextResponse.json({ error: "deal_id required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Select only the fields needed — never fetch the full deal row
  const { data } = await admin
    .from("deals")
    .select(
      "deal_id, payment_status, status, invoice_balance, payment_reference, invoice_subtotal",
    )
    .eq("deal_id", dealId)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Log the access (wrap in try/catch — logging must never break the response)
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
      // amount_due = outstanding balance; fall back to full invoice total
      amount_due:
        data.invoice_balance != null
          ? data.invoice_balance
          : (data.invoice_subtotal ?? null),
      // invoice_reference is the human-readable payment reference for Wise/Zelle
      invoice_reference: data.payment_reference ?? null,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
