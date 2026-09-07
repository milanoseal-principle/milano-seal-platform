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
    },
    { status: 409 },
  );
}
