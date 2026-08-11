import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Stripe was removed from the platform. Wise is now the sole payment
 * provider — see /api/webhook/wise.
 *
 * This permanent HTTP 410 tombstone prevents a retired integration from
 * being mistaken for a supported payment path. It performs no mutation.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Stripe is no longer supported",
      message:
        "Payments are handled exclusively via Wise. This endpoint is permanently retired.",
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "Stripe is no longer supported" },
    { status: 410 }
  );
}
