import { NextRequest, NextResponse } from "next/server";

interface StubJobDetail {
  dispatch_id: string;
  current_assignment_state: string;
  is_rush_priority: boolean;
  sla_expiration_timestamp: string | null;
  assigned_partner_id: string | null;
  reassigned_count: number;
}

// Stub: get a single dispatch job by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<StubJobDetail | { error: string }>> {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // TODO: query alliance_live_execution_queue by job_dispatch_id with RLS
  return NextResponse.json({
    dispatch_id: id,
    current_assignment_state: "UNASSIGNED_STAGED",
    is_rush_priority: false,
    sla_expiration_timestamp: null,
    assigned_partner_id: null,
    reassigned_count: 0,
  });
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
