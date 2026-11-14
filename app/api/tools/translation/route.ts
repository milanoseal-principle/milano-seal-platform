import { NextRequest, NextResponse } from "next/server";
import { requireExecutionToolAccess } from "@/lib/auth/executionToolAccess";
import { detectTranslation } from "@/lib/tools/executionTools";

export const dynamic = "force-dynamic";


export async function POST(req: NextRequest) {
  const access = await requireExecutionToolAccess();
  if (!access.ok) return access.response;

  let body: { destination_country?: string; document_language?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.destination_country) {
    return NextResponse.json(
      { error: "destination_country is required" },
      { status: 422 },
    );
  }

  const result = detectTranslation({
    destination_country: body.destination_country,
    document_language: body.document_language,
  });
  return NextResponse.json(result);
}
