import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { COMPLIMENTARY_CONFIRMATION } from "@/lib/payments/complimentary-policy";
import { authorizeComplimentaryMatter, extractActor } from "@/lib/payments/complimentary-server";

export const runtime = "nodejs";
const schema = z.object({ quoteId: z.string().nullable().optional(), reasonCode: z.enum(["founder_authorized", "family_and_friends", "strategic_partner", "pilot_matter", "service_recovery", "internal_quality_test", "charitable", "other"]), reasonDetail: z.string().min(12), confirmation: z.literal(COMPLIMENTARY_CONFIRMATION) });

export async function POST(request: Request, { params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", issues: parsed.error.flatten() }, { status: 422 });
  try {
    const result = await authorizeComplimentaryMatter({ matterId, actor: extractActor(user), quoteId: parsed.data.quoteId ?? null, reasonCode: parsed.data.reasonCode, reasonDetail: parsed.data.reasonDetail, confirmation: parsed.data.confirmation });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Authorization failed" }, { status: 400 });
  }
}
