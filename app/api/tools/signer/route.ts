import { NextRequest, NextResponse } from "next/server";
import { requireExecutionToolAccess } from "@/lib/auth/executionToolAccess";
import { checkSignerRequirements } from "@/lib/tools/executionTools";

export const dynamic = "force-dynamic";


export async function POST(req: NextRequest) {
  const access = await requireExecutionToolAccess();
  if (!access.ok) return access.response;

  let body: { jurisdiction?: string; document_type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.jurisdiction) {
    return NextResponse.json(
      { error: "jurisdiction is required" },
      { status: 422 },
    );
  }

  const result = checkSignerRequirements({
    jurisdiction: body.jurisdiction,
    document_type: body.document_type,
  });
  return NextResponse.json(result);
}
