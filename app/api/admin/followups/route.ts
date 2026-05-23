import { runFollowups } from "@/lib/followupEngine";
import { NextResponse } from "next/server";
import { requireOperator, isGuardFailure } from "@/lib/auth-guards";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireOperator();
  if (isGuardFailure(guard)) return guard.response;

  const results = await runFollowups();
  return NextResponse.json({
    ran: results.length,
    sent: results.filter((r) => r.sent).length,
    results,
  });
}
