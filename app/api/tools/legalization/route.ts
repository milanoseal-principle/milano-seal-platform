import { NextRequest, NextResponse } from "next/server";
import { requireExecutionToolAccess } from "@/lib/auth/executionToolAccess";
import { validateLegalization } from "@/lib/tools/executionTools";

export const dynamic = "force-dynamic";


export async function POST(req: NextRequest) {
  const access = await requireExecutionToolAccess();
  if (!access.ok) return access.response;

  let body: { country?: string; document_type?: string; apostille_required?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.country) {
    return NextResponse.json(
      { error: "country is required" },
      { status: 422 },
    );
  }

  const result = validateLegalization({
    country: body.country,
    document_type: body.document_type,
    apostille_required: body.apostille_required,
  });
  return NextResponse.json(result);
}
