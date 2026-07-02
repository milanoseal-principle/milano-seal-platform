import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentClientDeal } from "@/lib/portalAuth";
import { applyDiscountToMatter, removeDiscountFromMatter } from "@/src/features/discounts/discountService";

export const runtime = "nodejs";

// Operators who may apply/remove discounts on any matter.
const OPERATOR_ROLES = new Set([
  "founder",
  "founder_admin",
  "admin",
  "admin_operator",
  "ops_manager",
  "finance",
  "finance_operator",
]);

// Authorize a discount mutation on matter `id`: an operator (any matter) OR the
// authenticated portal client who owns that matter. Never trusts a client-supplied
// actor identity. Returns the resolved actor email when authorized.
async function authorize(id: string): Promise<{ ok: boolean; actorEmail: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, actorEmail: null };

  const role = (user.app_metadata?.role ?? user.user_metadata?.role) as string | undefined;
  if (role && OPERATOR_ROLES.has(role)) {
    return { ok: true, actorEmail: user.email ?? user.id };
  }

  // Authenticated portal client may only act on a matter they own.
  const ctx = await getCurrentClientDeal(id);
  if (ctx?.deal && ctx.deal.id === id) {
    return { ok: true, actorEmail: ctx.email };
  }
  return { ok: false, actorEmail: null };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await authorize(id);
    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = (await request.json()) as { code?: string };
    if (!body.code) return NextResponse.json({ error: "Discount code is required." }, { status: 400 });
    // actorEmail is the authenticated identity — never the client-supplied value.
    const matter = await applyDiscountToMatter(id, body.code, auth.actorEmail ?? undefined);
    return NextResponse.json({ matter });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Discount failed." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await authorize(id);
    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const matter = await removeDiscountFromMatter(id, auth.actorEmail);
    return NextResponse.json({ matter });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Discount removal failed." },
      { status: 400 },
    );
  }
}
