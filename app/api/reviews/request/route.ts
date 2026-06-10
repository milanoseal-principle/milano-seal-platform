import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { buildReviewEventMeta } from "@/lib/reviews/googleBusinessProfile";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      token,
      matterId,
      rating,
      feedback,
      executionLane,
      destinationCountry,
      documentType,
      source,
    } = body as {
      token?: string;
      matterId?: string;
      rating?: number;
      feedback?: string;
      executionLane?: string;
      destinationCountry?: string;
      documentType?: string;
      source?: string;
    };

    const supabase = createAdminClient();
    let dealId: string | null = null;

    if (token) {
      const { data } = await supabase
        .from("deals")
        .select("id, deal_id")
        .eq("access_token", token)
        .maybeSingle();
      if (data) {
        dealId = (data as { id: string; deal_id?: string }).deal_id ?? (data as { id: string }).id ?? null;
      }
    } else if (matterId) {
      const { data } = await supabase
        .from("deals")
        .select("id, deal_id")
        .or(`id.eq.${matterId},deal_id.eq.${matterId}`)
        .maybeSingle();
      if (data) {
        dealId = (data as { id: string; deal_id?: string }).deal_id ?? (data as { id: string }).id ?? null;
      }
    }

    await logActivity({
      deal_id: dealId ?? matterId ?? null,
      actor: "client",
      action: "review_requested",
      detail: "Google review prompt opened from client portal",
      meta: buildReviewEventMeta({
        rating,
        feedback,
        executionLane,
        destinationCountry,
        documentType,
        source,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reviews/request] error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { success: false, code: "REVIEW_EVENT_LOG_FAILED" },
      { status: 500 }
    );
  }
}
