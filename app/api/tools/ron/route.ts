import { NextRequest, NextResponse } from "next/server";
import { requireExecutionToolAccess } from "@/lib/auth/executionToolAccess";
import { checkRONEligibility } from "@/lib/tools/executionTools";

export const dynamic = "force-dynamic";


export async function POST(req: NextRequest) {
  const access = await requireExecutionToolAccess();
  if (!access.ok) return access.response;

  let body: {
    signer_state?: string;
    document_type?: string;
    signer_location?: "in_state" | "out_of_state" | "international" | "unknown";
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.signer_state) {
    return NextResponse.json(
      { error: "signer_state is required" },
      { status: 422 },
    );
  }

  const result = checkRONEligibility({
    signer_state: body.signer_state,
    document_type: body.document_type,
    signer_location: body.signer_location,
  });
  return NextResponse.json(result);
}
