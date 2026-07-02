import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDiscountEngineEnabled } from "@/lib/discounts/env";
import { canReviewDiscountRequest, canApproveComp } from "@/lib/discounts/permissions";
import { listDiscountRequests, reviewDiscountRequest } from "@/lib/discounts/requests";

export const runtime = "nodejs";

// Operator approves or denies a discount request. A comp (100%) request requires
// the stricter owner/operator comp gate (canApproveComp) on top of operator role.
//
// NOTE: approving a request records the decision + audit only. It does NOT clear
// payment or set any comped payment-clear state — that path is deferred pending
// live-DB schema confirmation (see docs/audits/DISCOUNT_ENGINE_GAP_ANALYSIS.md).
// Applying an
// approved discount to a matter continues to go through the existing audited
// discountService via /api/deals/[id]/apply-discount.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDiscountEngineEnabled()) {
    return NextResponse.json({ error: "Discount engine is disabled." }, { status: 503 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (user.app_metadata?.role ?? user.user_metadata?.role) as string | undefined;
  if (!canReviewDiscountRequest(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    decision?: "approved" | "denied";
    review_note?: string;
  };
  const decision = body.decision === "denied" ? "denied" : "approved";

  // For a comp request, enforce the stricter owner/operator comp approval gate.
  if (decision === "approved") {
    const existing = (await listDiscountRequests()).find((r) => r.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    if (existing.discount_type === "comp" && !canApproveComp(role, user.email)) {
      return NextResponse.json(
        { error: "A 100% comp requires owner/operator approval." },
        { status: 403 },
      );
    }
    const isComp = existing.discount_type === "comp";
    try {
      const reviewed = await reviewDiscountRequest({
        id,
        decision,
        reviewedBy: user.email ?? user.id,
        reviewNote: body.review_note ?? null,
        compApproved: isComp,
      });
      return NextResponse.json({ request: reviewed });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Approval failed." },
        { status: 400 },
      );
    }
  }

  try {
    const reviewed = await reviewDiscountRequest({
      id,
      decision,
      reviewedBy: user.email ?? user.id,
      reviewNote: body.review_note ?? null,
      compApproved: false,
    });
    return NextResponse.json({ request: reviewed });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Denial failed." },
      { status: 400 },
    );
  }
}
