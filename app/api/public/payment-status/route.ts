import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import {
  PAYMENT_CAPABILITY_COOKIE,
  paymentCapabilityKey,
  verifyPaymentCapability,
} from "@/lib/payments/paymentCapability";

// SECURITY-06: Requires deal_id plus access_token (or this deal's own intake payment capability).
// Knowing only the deal_id string is insufficient to poll payment status.
// Both params must match the same deals row — mismatch returns 404
// (no information leak about which field is wrong).

export async function GET(req: NextRequest) {
  const dealId = req.nextUrl.searchParams.get("deal_id");
  const accessToken = req.nextUrl.searchParams.get("access_token");

  // The public intake confirmation page has no access_token; it may instead
  // present this Matter's own intake payment capability (httpOnly cookie,
  // HMAC-bound to exactly this deal_id, never sent cross-site).
  const capabilityValid =
    !!dealId &&
    req.headers.get("sec-fetch-site") !== "cross-site" &&
    verifyPaymentCapability(req.cookies.get(PAYMENT_CAPABILITY_COOKIE)?.value, dealId, paymentCapabilityKey());

  if (!dealId || (!accessToken && !capabilityValid)) {
    return NextResponse.json(
      { error: "deal_id and access_token are required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Validate deal_id AND (access_token or a capability bound to this deal_id).
  // Select only the fields needed — never fetch the full deal row.
  let query = admin
    .from("deals")
    .select(
      "deal_id, payment_status, status, invoice_balance, payment_reference, invoice_subtotal, total_price, payment_disposition"
    )
    .eq("deal_id", dealId);
  if (accessToken) query = query.eq("access_token", accessToken);
  const { data } = await query.maybeSingle();

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
      // True only once the canonical quote has been issued for this Matter
      // (operator-approved total persisted; see app/api/deals/[id]/quote).
      // A review-required intake has no payable obligation yet, so the client
      // must not be shown payment instructions or payment polling.
      quote_issued:
        Number(data.total_price) > 0 && data.payment_disposition !== "complimentary",
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
