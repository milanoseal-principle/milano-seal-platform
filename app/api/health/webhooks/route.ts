import { NextResponse } from "next/server";

export async function GET() {
  const handlers = [
    { name: "wise", route: "/api/webhooks/wise", status: "active", payment_provider: true },
    { name: "alliance_job", route: "/api/webhooks/alliance/job", status: "active" },
    { name: "alliance_status", route: "/api/webhooks/alliance/status", status: "active" },
    { name: "alliance_toolbelt", route: "/api/webhooks/alliance/toolbelt", status: "active" },
    { name: "alliance_credential", route: "/api/webhooks/alliance/credential", status: "active" },
  ];

  return NextResponse.json({
    status: "ok",
    service: "webhooks",
    payment_provider: "wise",
    handlers,
    signature_validation: "enforced",
    mutation_on_placeholder: "blocked",
    timestamp: new Date().toISOString(),
  });
}
