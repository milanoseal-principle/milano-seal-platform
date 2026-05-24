import { runFollowups } from "@/lib/followupEngine";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const results = await runFollowups();
  return NextResponse.json({
    ran: results.length,
    sent: results.filter((r) => r.sent).length,
    results,
  });
}
