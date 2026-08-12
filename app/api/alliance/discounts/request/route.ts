import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDiscountEngineEnabled } from "@/lib/discounts/env";
import { canCreateDiscountRequest } from "@/lib/discounts/permissions";
import { createDiscountRequest } from "@/lib/discounts/requests";
import type { DiscountRequestType } from "@/lib/discounts/types";

export const runtime = "nodejs";

// Alliance/partner (and operators) submit a client-courtesy discount request for
// operator review. Partners can only REQUEST — never create or clear a discount.
export async function POST(request: Request) {
  if (!isDiscountEngineEnabled()) {
    return NextResponse.json({ error: "Discount engine is disabled." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (user.app_metadata?.role ?? user.app_metadata?.role) as string | undefined;
  if (!canCreateDiscountRequest(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    matter_id?: string;
    client_email?: string;
    discount_type?: string;
    discount_value?: number;
    reason?: string;
    partner_id?: string;
  };

  const type = body.discount_type as DiscountRequestType;
  if (!["percent", "fixed", "comp"].includes(type)) {
    return NextResponse.json({ error: "Invalid discount_type." }, { status: 400 });
  }
  if (type !== "comp" && (body.discount_value === undefined || Number(body.discount_value) <= 0)) {
    return NextResponse.json({ error: "discount_value is required." }, { status: 400 });
  }

  try {
    const req = await createDiscountRequest({
      // Identity is the authenticated user — never a client-supplied value.
      requestedBy: user.email ?? user.id,
      requestedByRole: role ?? null,
      partnerId: body.partner_id ?? null,
      matterId: body.matter_id ?? null,
      clientEmail: body.client_email ?? null,
      discountType: type,
      discountValue: Number(body.discount_value ?? 0),
      reason: body.reason ?? null,
    });
    return NextResponse.json({ request: req, message: "Discount request submitted for operator review." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 400 },
    );
  }
}
