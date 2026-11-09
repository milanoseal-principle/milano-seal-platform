import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { NextResponse } from "next/server";
import { getLedger, verifyChain } from "@/lib/custodyLedger";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireDashboardAccess();
  const { id } = await params;
  const ledger = await getLedger(id);
  const verdict = verifyChain(ledger);
  return NextResponse.json({ ledger, verdict });
}
