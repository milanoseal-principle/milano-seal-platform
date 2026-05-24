import { NextRequest, NextResponse } from "next/server";

// Stub: assign an operator to a dispatch request
export async function POST(
  request: NextRequest,
): Promise<NextResponse<{ status: string } | { error: string }>> {
  let body: { dispatch_id?: string; partner_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.dispatch_id || !body.partner_id) {
    return NextResponse.json(
      { error: "dispatch_id and partner_id are required" },
      { status: 422 },
    );
  }

  // TODO: verify partner eligibility (credentials, toolbelt ≥80%, compliance, availability)
  // TODO: update dispatch queue record, emit DISPATCH_ASSIGNED event
  return NextResponse.json({ status: "assigned" });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
