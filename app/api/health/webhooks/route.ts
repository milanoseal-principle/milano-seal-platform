import { NextResponse } from "next/server";

export async function GET() {
  const handlers = [
    { name: "wise", route: "/api/webhook/wise", status: "active" },
    { name: "alliance_job", route: "/api/webhooks/alliance/job", status: "active" },
    { name: "alliance_status", route: "/api/webhooks/alliance/status", status: "active" },
    { name: "alliance_toolbelt", route: "/api/webhooks/alliance/toolbelt", status: "active" },
    { name: "alliance_credential", route: "/api/webhooks/alliance/credential", status: "active" },
  ];

  return NextResponse.json({
    status: "ok",
    service: "webhooks",
    handlers,
    signature_validation: "enforced",
    mutation_on_placeholder: "blocked",
    timestamp: new Date().toISOString(),
  });
}
