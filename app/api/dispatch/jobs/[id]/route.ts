import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error: "DISPATCH_NOT_CONFIGURED",
      message: "Dispatch job detail is unavailable until the governed routing engine is configured.",
    },
    { status: 503 },
  );
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
