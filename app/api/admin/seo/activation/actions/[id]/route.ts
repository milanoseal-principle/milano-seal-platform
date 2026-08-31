import { NextResponse } from "next/server";
import { requireSeoControlApiAccess } from "@/lib/seo/activation/access";
import { updateSeoActivationAction } from "@/lib/seo/activation/repository";
import { updateActivationActionSchema } from "@/lib/seo/activation/schemas";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireSeoControlApiAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  const parsed = updateActivationActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const action = await updateSeoActivationAction(id, parsed.data, access.userId);
    return NextResponse.json({ action }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Activation action update failed." }, { status: 500 });
  }
}
