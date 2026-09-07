import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      code: "USE_GOVERNED_RON_APOSTILLE_QA",
      message:
        "Legacy Apostille mutation is disabled. Use the governed RON Apostille QA endpoint for the canonical in_execution → apostille_processing transition.",
    },
    { status: 409 },
  );
}
