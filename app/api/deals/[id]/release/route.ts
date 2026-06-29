import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isFounderAdmin } from "@/lib/security/access-control";
import { recordSecurityEvent } from "@/lib/security/security-events";
import { performFinalRelease } from "@/lib/release/performFinalRelease";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Optional founder override for releasing on non-cleared (e.g. pending card
  // settlement) funds. Requires a written reason; always ledgered below.
  const body = (await req.json().catch(() => ({}))) as {
    override_reason?: string;
  };
  const overrideReason = (body.override_reason ?? "").trim();

  // Auth check — role from server-side token only, never client body
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await recordSecurityEvent({
      event_name: "ADMIN_ACTION_DENIED",
      severity: "high",
      route: "/api/deals/[id]/release",
      client_safe: false,
      metadata: { reason: "unauthenticated" },
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Release requires founder_admin — not admin_operator
  const role = user.app_metadata?.role ?? user.user_metadata?.role;
  if (!isFounderAdmin(role)) {
    await recordSecurityEvent({
      event_name: "ADMIN_ACTION_DENIED",
      severity: "high",
      actor: user.email ?? user.id,
      route: "/api/deals/[id]/release",
      client_safe: false,
      metadata: { role: String(role ?? "none"), reason: "founder_only_action" },
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Run the shared final-release gate (payment + settlement/override + Codice
  // Fiscale + custody/audit ledger). Identical logic is exercised by the
  // authenticated production test runner.
  const outcome = await performFinalRelease({
    id,
    actorId: user.email ?? user.id,
    overrideReason,
  });
  return NextResponse.json(outcome.body, { status: outcome.status });
}

