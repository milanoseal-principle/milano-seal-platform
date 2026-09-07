import { NextResponse } from "next/server";

// Legacy endpoint retained as a fail-closed compatibility surface. RON Matters
// must pass the signed-document and execution-truth controls in the canonical
// session Apostille QA endpoint; non-RON transitions use the governed Matter
// status action.
export async function POST() {
  return NextResponse.json(
    {
      error: "USE_GOVERNED_APOSTILLE_TRANSITION",
      message:
        "Use the RON session Apostille QA action or the governed Matter status action.",
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
