import { NextRequest, NextResponse } from "next/server";

// Stub: escalate a dispatch to admin review after repeated SLA misses
export async function POST(
  request: NextRequest,
): Promise<NextResponse<{ status: string } | { error: string }>> {
  let body: { dispatch_id?: string; escalation_reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.dispatch_id) {
    return NextResponse.json(
      { error: "dispatch_id is required" },
      { status: 422 },
    );
  }

  // TODO: set current_assignment_state = ESCALATED_ALERT, notify admin, write audit record
  return NextResponse.json({ status: "escalated" });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
