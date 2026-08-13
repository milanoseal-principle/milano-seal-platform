import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentClientDeal } from "@/lib/portalAuth";
import {
  applyDiscountToMatter,
  removeDiscountFromMatter,
} from "@/src/features/discounts/discountService";

export const runtime = "nodejs";

const OPERATOR_ROLES = new Set([
  "founder",
  "founder_admin",
  "admin",
  "admin_operator",
  "ops_manager",
  "finance",
  "finance_operator",
]);

async function authorize(
  id: string,
): Promise<{ ok: boolean; actorEmail: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, actorEmail: null };

  const role = user.app_metadata?.role as string | undefined;
  if (role && OPERATOR_ROLES.has(role)) {
    return { ok: true, actorEmail: user.email ?? user.id };
  }

  const ctx = await getCurrentClientDeal(id);
  if (ctx?.deal && ctx.deal.id === id) {
    return { ok: true, actorEmail: ctx.email };
  }
  return { ok: false, actorEmail: null };
}

function matterSource(internalNotes: unknown): string {
  if (typeof internalNotes !== "string" || !internalNotes.trim()) return "";
  try {
    const parsed = JSON.parse(internalNotes) as Record<string, unknown>;
    return String(parsed.source ?? "").trim().toLowerCase();
  } catch {
    return "";
  }
}

async function enforceSourceRestriction(id: string, rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  const admin = createAdminClient();
  const [{ data: discount, error: discountError }, { data: matter, error: matterError }] =
    await Promise.all([
      admin
        .from("discount_codes")
        .select("metadata")
        .eq("code", code)
        .maybeSingle(),
      admin.from("deals").select("internal_notes").eq("id", id).single(),
    ]);

  if (discountError) throw discountError;
  if (matterError) throw matterError;

  const metadata = (discount?.metadata ?? {}) as Record<string, unknown>;
  const allowedSource = String(metadata.allowed_source_channel ?? "")
    .trim()
    .toLowerCase();
  if (!allowedSource) return;

  const source = matterSource(matter?.internal_notes);
  if (!source || source !== allowedSource) {
    throw new Error("Discount code is not eligible for this intake source.");
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await authorize(id);
    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = (await request.json()) as { code?: string };
    if (!body.code) {
      return NextResponse.json(
        { error: "Discount code is required." },
        { status: 400 },
      );
    }

    await enforceSourceRestriction(id, body.code);
    const matter = await applyDiscountToMatter(
      id,
      body.code,
      auth.actorEmail ?? undefined,
    );
    return NextResponse.json({ matter });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Discount failed." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
      {
        error:
          error instanceof Error ? error.message : "Discount removal failed.",
      },
      { status: 400 },
    );
  }
}
