import { NextResponse } from "next/server";
import { requireSeoControlApiAccess } from "@/lib/seo/activation/access";
import { createAuthorityRelationship, getSeoAuthorityActivationSnapshot } from "@/lib/seo/activation/repository";
import { createAuthorityRelationshipSchema } from "@/lib/seo/activation/schemas";

export const runtime = "nodejs";

export async function GET() {
  const access = await requireSeoControlApiAccess();
  if (!access.ok) return access.response;
  try {
    const snapshot = await getSeoAuthorityActivationSnapshot([]);
    return NextResponse.json({
      provisioned: snapshot.provisioned,
      provisioningMessage: snapshot.provisioningMessage,
      relationships: snapshot.relationships,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Authority relationship read failed." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await requireSeoControlApiAccess();
  if (!access.ok) return access.response;
  const parsed = createAuthorityRelationshipSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const relationship = await createAuthorityRelationship(parsed.data, access.userId);
    return NextResponse.json({ relationship }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Authority relationship create failed." }, { status: 500 });
  }
}
