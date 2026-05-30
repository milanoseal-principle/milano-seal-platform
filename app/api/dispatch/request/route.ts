import { NextRequest, NextResponse } from "next/server";

interface DispatchRequestBody {
  request_type: string;
  state: string;
  priority?: "standard" | "rush";
  destination_country?: string;
  required_languages?: string[];
}

interface DispatchRequestResponse {
  dispatch_id: string;
  status: "queued" | "no_match";
  matched_operator: null | {
    name: string;
    state: string;
    trust_score: number;
  };
}

// Stub: create a new dispatch request
// Not mutating production records — handler is not yet wired to routing engine.
export async function POST(
  request: NextRequest,
): Promise<NextResponse<DispatchRequestResponse | { error: string }>> {
  let body: DispatchRequestBody;
  try {
    body = (await request.json()) as DispatchRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.request_type || !body.state) {
    return NextResponse.json(
      { error: "request_type and state are required" },
      { status: 422 },
    );
  }

  // TODO: route to matching engine, check operator availability, emit dispatch event
  return NextResponse.json({
    dispatch_id: `disp_stub_${Date.now()}`,
    status: "queued",
    matched_operator: null,
  });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
