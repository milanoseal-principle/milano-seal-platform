import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { extractActor, revokeComplimentaryMatter } from "@/lib/payments/complimentary-server";

export const runtime = "nodejs";
const schema = z.object({ authorizationId: z.string().uuid(), reason: z.string().min(8) });

export async function POST(request: Request, { params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", issues: parsed.error.flatten() }, { status: 422 });
  try {
    const result = await revokeComplimentaryMatter({ matterId, actor: extractActor(user), authorizationId: parsed.data.authorizationId, reason: parsed.data.reason });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Revocation failed" }, { status: 400 });
  }
}
