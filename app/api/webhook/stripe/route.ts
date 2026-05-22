import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Stripe was removed from the platform. Wise is now the sole payment
 * provider — see /api/webhook/wise.
 *
 * This handler stays in place to:
 *   • Tell anyone still pointing here that the endpoint is intentionally
 *     retired (HTTP 410 Gone).
 *   • Avoid silent 404s if a Stripe webhook is still configured upstream
 *     and you forgot to detach it from your Stripe dashboard.
 *
 * If you re-introduce Stripe later, re-implement the verification +
 * payment confirmation logic here.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Stripe is no longer supported",
      message:
        "Payments are handled exclusively via Wise. Detach this Stripe webhook from your Stripe dashboard.",
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
