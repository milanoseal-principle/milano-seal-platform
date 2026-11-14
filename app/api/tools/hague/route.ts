import { NextRequest, NextResponse } from "next/server";
import { requireExecutionToolAccess } from "@/lib/auth/executionToolAccess";
import { checkHague } from "@/lib/tools/executionTools";

export const dynamic = "force-dynamic";


export async function POST(req: NextRequest) {
  const access = await requireExecutionToolAccess();
  if (!access.ok) return access.response;

  let body: { country?: string };
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

  const result = checkHague(body.country);
  return NextResponse.json(result);
}
