import { NextRequest, NextResponse } from "next/server";

// Stub: reassign a dispatch to a different operator after timeout or decline
export async function POST(
  request: NextRequest,
): Promise<NextResponse<{ status: string; reassigned_to: null } | { error: string }>> {
  let body: { dispatch_id?: string; reason?: string };
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

  // TODO: increment reassigned_count, find next eligible operator, emit event
  return NextResponse.json({ status: "reassignment_queued", reassigned_to: null });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
