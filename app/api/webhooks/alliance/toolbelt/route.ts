import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "ALLIANCE_WEBHOOK_NOT_CONFIGURED",
      message: "Alliance toolbelt webhook processing is not configured in production.",
    },
    { status: 503 },
  );
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
