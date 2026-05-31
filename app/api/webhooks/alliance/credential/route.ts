import { NextRequest, NextResponse } from "next/server";

// Stub: alliance credential webhook
// Triggers when a partner's credential verification status changes externally.
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

  // TODO: verify signature, update partner credential status, emit audit event
  console.log("[webhook/alliance/credential] received", body);

  return NextResponse.json({ received: true, status: "queued" });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
