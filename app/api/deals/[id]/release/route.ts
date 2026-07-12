import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isFounderAdmin } from "@/lib/security/access-control";
import { recordSecurityEvent } from "@/lib/security/security-events";
import { performFinalRelease } from "@/lib/release/performFinalRelease";
import { notifyClient } from "@/lib/notifications/orchestrator";

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
  const role = user.app_metadata?.role ?? user.app_metadata?.role;
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

  // Mirror a successful release into the client notification log. Runs only after
  // the release gate has already passed (status 200); non-blocking and client-safe.
  // Resolves the deal UUID (params [id] may be a UUID or business reference) for
  // messages.deal_id without touching the release-gate logic.
  if (outcome.status === 200) {
    try {
      const admin = createAdminClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id);
      const { data: d } = await admin
        .from("deals")
        .select("id")
        .eq(isUuid ? "id" : "deal_id", id)
        .maybeSingle();
      if (d?.id) await notifyClient(d.id, "release_ready");
    } catch (err) {
      console.error(
        "[release] notify failed:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  return NextResponse.json(outcome.body, { status: outcome.status });
}

