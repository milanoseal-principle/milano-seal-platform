import { NextResponse } from "next/server";

// Retired. This route used to write payment fields on a Matter through the
// caller's session. Payment truth is never established by a browser, operator
// form or demo: confirmed payment is written only by the signature-verified
// Wise reconciliation path, and authenticated sessions have no direct write
// access to public.deals (20261125231600). The route stays at its path so a
// stale caller gets an explicit answer instead of a 404; it reads and writes
// nothing.
export async function POST() {
  return NextResponse.json(
    {
      error: "Direct payment updates are retired. Payment is confirmed only through verified Wise settlement.",
      code: "USE_GOVERNED_WISE_RECONCILIATION",
    },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
