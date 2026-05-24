import { NextRequest, NextResponse } from "next/server";

// Stub: alliance status webhook
// Signature verification will be wired once provider credentials are configured.
export async function POST(request: NextRequest) {
  const sig = request.headers.get("x-alliance-signature");

  // Placeholder: reject requests missing the signature header entirely
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

  // TODO: verify HMAC signature against ALLIANCE_WEBHOOK_SECRET env var
  // TODO: route event_type to appropriate handler
  // Production records are NOT mutated until handler is wired.
  console.log("[webhook/alliance/status] received", body);

  return NextResponse.json({ received: true, status: "queued" });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
