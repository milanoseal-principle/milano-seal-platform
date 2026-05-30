import { NextRequest, NextResponse } from "next/server";

// Stub: alliance toolbelt webhook
// Triggers when a partner completes or updates a toolbelt integration.
export async function POST(request: NextRequest) {
  const sig = request.headers.get("x-alliance-signature");
  if (!sig) {
    return NextResponse.json(
      { error: "Missing webhook signature" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // TODO: verify signature, recalculate toolbelt_completion_percent, re-evaluate eligibility
  console.log("[webhook/alliance/toolbelt] received", body);

  return NextResponse.json({ received: true, status: "queued" });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
