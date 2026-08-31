import { NextResponse } from "next/server";
import { requireSeoControlApiAccess } from "@/lib/seo/activation/access";
import { createAuthorityPlacement, getSeoAuthorityActivationSnapshot } from "@/lib/seo/activation/repository";
import { createAuthorityPlacementSchema } from "@/lib/seo/activation/schemas";

export const runtime = "nodejs";

export async function GET() {
  const access = await requireSeoControlApiAccess();
  if (!access.ok) return access.response;
  try {
    const snapshot = await getSeoAuthorityActivationSnapshot([]);
    return NextResponse.json({
      provisioned: snapshot.provisioned,
      provisioningMessage: snapshot.provisioningMessage,
      placements: snapshot.placements,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Authority placement read failed." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await requireSeoControlApiAccess();
  if (!access.ok) return access.response;
  const parsed = createAuthorityPlacementSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const placement = await createAuthorityPlacement(parsed.data, access.userId);
    return NextResponse.json({ placement }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Authority placement create failed." }, { status: 500 });
  }
}
