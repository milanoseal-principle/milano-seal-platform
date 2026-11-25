import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { buildReviewEventMeta } from "@/lib/reviews/googleBusinessProfile";

const MAX_BODY_BYTES = 8 * 1024;
const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : undefined);

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text().catch(() => "");
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false, code: "REVIEW_EVENT_TOO_LARGE" }, { status: 413 });
    }
    let body: unknown = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      body = {};
    }
    const {
      token,
      rating,
      feedback,
      executionLane,
      destinationCountry,
      documentType,
      source,
    } = body as {
      token?: string;
      rating?: number;
      feedback?: string;
      executionLane?: string;
      destinationCountry?: string;
      documentType?: string;
      source?: string;
    };

    const supabase = createAdminClient();
    let dealId: string | null = null;

    // Only the portal's secret access token can attribute this event to a
    // Matter. A bare matterId is not authority: the public /review page sends
    // neither, and an unauthenticated caller must not write into any Matter's
    // activity history.
    if (typeof token === "string" && token) {
      const { data } = await supabase
        .from("deals")
        .select("id, deal_id")
        .eq("access_token", token)
        .maybeSingle();
      if (data) {
        dealId = (data as { id: string; deal_id?: string }).deal_id ?? (data as { id: string }).id ?? null;
      }
    }

    await logActivity({
      deal_id: dealId,
      actor: "client",
      action: "review_requested",
      detail: "Google review prompt opened from client portal",
      meta: buildReviewEventMeta({
        rating: typeof rating === "number" && Number.isFinite(rating) ? Math.min(5, Math.max(0, Math.round(rating))) : undefined,
        feedback: text(feedback, 2000),
        executionLane: text(executionLane, 100),
        destinationCountry: text(destinationCountry, 100),
        documentType: text(documentType, 200),
        source: text(source, 100),
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
