import { NextRequest, NextResponse } from "next/server";
import { recordAllianceWebhookEvent } from "@/lib/alliance/webhookEvidence";

export async function POST(req: NextRequest) {
  return recordAllianceWebhookEvent(req, "credential");
}

export async function GET() {
  return NextResponse.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
}
