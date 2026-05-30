import { NextResponse } from "next/server";

interface StubJob {
  dispatch_id: string;
  current_assignment_state: string;
  is_rush_priority: boolean;
  sla_expiration_timestamp: string;
}

// Stub: list dispatch jobs in the queue
// Returns an empty list until the dispatch engine is wired.
export async function GET(): Promise<NextResponse<{ jobs: StubJob[]; total: number }>> {
  // TODO: query alliance_live_execution_queue with tenant RLS, pagination, filters
  return NextResponse.json({ jobs: [], total: 0 });
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
