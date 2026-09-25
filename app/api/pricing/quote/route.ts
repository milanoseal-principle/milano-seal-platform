import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isOperatorOrFounder } from "@/lib/security/access-control";
import { composeGovernedQuote } from "@/lib/pricing/governedQuotePreview";

export const runtime = "nodejs";

// Internal operator preview of canonical private pricing. The same governed
// composition (execution truth → route intelligence → projectCanonicalQuote)
// is re-run server-side by app/api/deals/[id]/quote before any commit, so this
// preview is never payment authority on its own.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const role = user?.app_metadata?.role as string | undefined;
    if (!user || !isOperatorOrFounder(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const { preview } = composeGovernedQuote(body);
    return NextResponse.json(preview);
  } catch (error) {
    console.error("[pricing/quote] error:", error);
    return NextResponse.json(
      { error: "Failed to compute quote" },
      { status: 500 },
    );
  }
}
