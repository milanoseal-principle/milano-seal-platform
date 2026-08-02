import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDiscountEngineEnabled } from "@/lib/discounts/env";
import { canReviewDiscountRequest } from "@/lib/discounts/permissions";
import { listDiscountRequests } from "@/lib/discounts/requests";

export const runtime = "nodejs";

// Operator list of discount requests, optionally filtered by ?matter_id=.
export async function GET(request: Request) {
  if (!isDiscountEngineEnabled()) {
    return NextResponse.json({ error: "Discount engine is disabled." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (user.app_metadata?.role ?? user.app_metadata?.role) as string | undefined;
  if (!canReviewDiscountRequest(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const matterId = url.searchParams.get("matter_id") ?? undefined;
  try {
    const requests = await listDiscountRequests(matterId);
    return NextResponse.json({ requests });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "List failed." },
      { status: 400 },
    );
  }
}
