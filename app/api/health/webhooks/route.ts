import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try { await requireDashboardAccess(); }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'private, no-store' } }); }
  const handlers = [
    { name: "wise", route: "/api/webhooks/wise", status: "registered_not_verified", payment_provider: true },
    { name: "alliance_job", route: "/api/webhooks/alliance/job", status: "registered_not_verified" },
    { name: "alliance_status", route: "/api/webhooks/alliance/status", status: "registered_not_verified" },
    { name: "alliance_toolbelt", route: "/api/webhooks/alliance/toolbelt", status: "registered_not_verified" },
    { name: "alliance_credential", route: "/api/webhooks/alliance/credential", status: "registered_not_verified" },
  ];

  return NextResponse.json({
    status: "not_verified",
    service: "webhooks",
    payment_provider: "wise",
    handlers,
    provider_delivery: "NOT_VERIFIED",
    mutation_on_placeholder: "blocked",
    timestamp: new Date().toISOString(),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
