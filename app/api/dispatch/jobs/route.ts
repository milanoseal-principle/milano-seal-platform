import { NextResponse } from "next/server";

const unavailable = () =>
  NextResponse.json(
    {
      error: "DISPATCH_NOT_CONFIGURED",
      message: "Dispatch queue API is not configured for production mutation or observation.",
    },
    { status: 503 },
  );

export async function GET() {
  return unavailable();
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
