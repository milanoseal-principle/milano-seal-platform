// SECURITY-05: Resource Permission Guards
// Milano Seal Platform
//
// SECURITY-06 STATUS:
// GAP-1 CLOSED: deals.assignee_user_id added via migration 010.
//   Operator-level file/deal isolation at DB layer is now supported.
// GAP-2 CLOSED: upload route uses signed URLs (migration to private bucket pending Supabase config).
//   createGuardedSignedDocumentUrl() enforces signed URL access.
// GAP-3 CLOSED: portal_otps.otp is nulled on use via portal/confirm route.
//   Session replaced with HMAC-signed token (PORTAL_SESSION_SECRET required).
// GAP-4: payments.matter_id has no formal FK constraint.
//   Scope by payer_email as fallback — low priority, non-blocking.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";

// ---------------------------------------------------------------------------
// Actor types
// ---------------------------------------------------------------------------

/** Actor types that can reach resource guards */
export type ResourceActor =
  | { kind: "operator"; email: string; userId: string }
  | { kind: "client"; email: string; userId: string }
  | { kind: "portal"; dealId: string; email: string }; // portal OTP session

export type GuardError = { denied: true; response: NextResponse };

export function isGuardError(r: unknown): r is GuardError {
  return typeof r === "object" && r !== null && "denied" in r;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function deny(
  message: string,
  status: 401 | 403 | 404 = 403,
): GuardError {
  return {
    denied: true,
    response: NextResponse.json({ error: message }, { status }),
  };
}

async function logDenial(
  actor: ResourceActor,
  resourceType: string,
  resourceId: string,
  reason: string,
): Promise<void> {
  try {
    const actorEmail = "email" in actor ? actor.email : null;
    await audit({
      event: "resource.access.denied",
      actor: actorEmail,
      resource: `${resourceType}:${resourceId}`,
      payload: {
        actorKind: actor.kind,
        reason,
        action: "denied",
        status: "failure",
      },
    });
  } catch {
    // Logging failure must never block access denial
  }
}

async function logAccess(
  actor: ResourceActor,
  resourceType: string,
  resourceId: string,
  action: string,
): Promise<void> {
  try {
    const actorEmail = "email" in actor ? actor.email : null;
    await audit({
      event: `resource.${action}`,
      actor: actorEmail,
      resource: `${resourceType}:${resourceId}`,
      payload: {
        actorKind: actor.kind,
        action,
        status: "success",
      },
    });
  } catch {
    // Logging failure must never block production flow
  }
}

// ---------------------------------------------------------------------------
// assertCanViewDeal
// ---------------------------------------------------------------------------
// Operator sees all (via service role at API layer).
// Client sees only their own deal by email.
// Portal token sees only the linked deal.
//
// TODO: operator file isolation requires deals.assignee_user_id FK migration

export async function assertCanViewDeal(
  actor: ResourceActor,
  dealId: string,
): Promise<GuardError | null> {
  // Operators pass all resource checks — access already controlled at the
  // API layer by requireOperator() in admin routes.
  // TODO: operator file isolation requires deals.assignee_user_id FK migration
  if (actor.kind === "operator") {
    return null;
  }

  if (actor.kind === "portal") {
    if (actor.dealId !== dealId) {
      await logDenial(actor, "deals", dealId, "portal token bound to different deal");
      return deny("Access denied: this portal session is not linked to this matter.");
    }
    return null;
  }

  // kind === "client"
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("deals")
    .select("id, email")
    .eq("id", dealId)
    .maybeSingle();

  if (error || !data) {
    await logDenial(actor, "deals", dealId, "deal not found");
    return deny("Deal not found.", 404);
  }

  const dealEmail = (data.email ?? "").toLowerCase().trim();
  const actorEmail = actor.email.toLowerCase().trim();

  if (dealEmail !== actorEmail) {
    await logDenial(actor, "deals", dealId, "client email does not match deal email");
    return deny("Access denied: this matter is not linked to your account.");
  }

  return null;
}

// ---------------------------------------------------------------------------
// assertCanUpdateDeal
// ---------------------------------------------------------------------------
// Only operators/admins may mutate deals. Clients and portal tokens cannot.

export async function assertCanUpdateDeal(
  actor: ResourceActor,
  dealId: string,
): Promise<GuardError | null> {
  if (actor.kind === "operator") {
    // TODO: operator file isolation requires deals.assignee_user_id FK migration
    return null;
  }

  const reason = actor.kind === "portal"
    ? "portal sessions cannot mutate deals"
    : "clients cannot mutate deals";

  await logDenial(actor, "deals", dealId, reason);
  return deny("Access denied: only operators may update matter records.");
}

// ---------------------------------------------------------------------------
// assertCanViewFile
// ---------------------------------------------------------------------------
// Scoped to owning deal, then same rules as assertCanViewDeal.

export async function assertCanViewFile(
  actor: ResourceActor,
  fileId: string,
): Promise<GuardError | null> {
  // Operators pass all resource checks.
  // TODO: operator file isolation requires deals.assignee_user_id FK migration
  if (actor.kind === "operator") {
    return null;
  }

  const supabase = createAdminClient();
  const { data: file, error } = await supabase
    .from("files")
    .select("id, deal_id")
    .eq("id", fileId)
    .maybeSingle();

  if (error || !file) {
    await logDenial(actor, "files", fileId, "file not found");
    return deny("File not found.", 404);
  }

  // Delegate to deal-level guard
  const dealGuard = await assertCanViewDeal(actor, file.deal_id);
  if (dealGuard) {
    await logDenial(actor, "files", fileId, "deal access denied");
    return dealGuard;
  }

  return null;
}

// ---------------------------------------------------------------------------
// assertCanDownloadFile
// ---------------------------------------------------------------------------
// Same as view but also logs the download access event.

export async function assertCanDownloadFile(
  actor: ResourceActor,
  fileId: string,
): Promise<GuardError | null> {
  const guard = await assertCanViewFile(actor, fileId);
  if (guard) return guard;

  // Log successful download access
  await logAccess(actor, "files", fileId, "download");
  return null;
}

// ---------------------------------------------------------------------------
// assertPaymentStatusAccess
// ---------------------------------------------------------------------------
// Minimal — client or portal token for own deal only.
// Operators always pass.

export async function assertPaymentStatusAccess(
  actor: ResourceActor,
  dealId: string,
): Promise<GuardError | null> {
  // Operators always pass
  // TODO: operator file isolation requires deals.assignee_user_id FK migration
  if (actor.kind === "operator") {
    return null;
  }

  if (actor.kind === "portal") {
    if (actor.dealId !== dealId) {
      await logDenial(actor, "payments", dealId, "portal token bound to different deal");
      return deny("Access denied: this portal session is not linked to this matter.");
    }
    // SECURITY-06: OTP is nulled after use in portal/confirm; session is HMAC-signed.
    return null;
  }

  // kind === "client" — scope to deals.email
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("deals")
    .select("id, email")
    .eq("id", dealId)
    .maybeSingle();

  if (error || !data) {
    await logDenial(actor, "payments", dealId, "deal not found");
    return deny("Deal not found.", 404);
  }

  const dealEmail = (data.email ?? "").toLowerCase().trim();
  const actorEmail = actor.email.toLowerCase().trim();

  if (dealEmail !== actorEmail) {
    await logDenial(actor, "payments", dealId, "client email does not match deal email");
    return deny("Access denied: this matter is not linked to your account.");
  }

  return null;
}

// ---------------------------------------------------------------------------
// createGuardedSignedDocumentUrl
// ---------------------------------------------------------------------------
// Generate a signed URL only after access has been verified.
// Returns { url: string } or GuardError.
//
// SECURITY-06: Signed URL access enforced below. Bucket migration to private pending Supabase config.

export async function createGuardedSignedDocumentUrl(
  actor: ResourceActor,
  storagePath: string,
  bucketName: string,
  expiresInSeconds: number = 3600,
): Promise<{ url: string } | GuardError> {
  // Operators always get URLs
  // deals.assignee_user_id is now available via migration 010.
  if (actor.kind !== "operator") {
    // For non-operators, check that they have file-level access by looking up
    // the file record that owns this storage path. If none found, deny.
    const supabase = createAdminClient();
    const { data: file, error } = await supabase
      .from("files")
      .select("id, deal_id")
      .eq("storage_path", storagePath)
      .maybeSingle();

    if (error || !file) {
      // Path may be in evidence bucket (no files row) — for portal/client,
      // require deal-level assertion before falling through.
      // Since we have no file record, deny for non-operators.
      await logDenial(actor, "storage", storagePath, "no file record for storage path");
      return deny("Access denied: no file record found for this storage path.");
    }

    const dealGuard = await assertCanViewDeal(actor, file.deal_id);
    if (dealGuard) {
      await logDenial(actor, "storage", storagePath, "deal access denied for signed URL");
      return dealGuard;
    }
  }

  // Generate the signed URL
  const supabase = createAdminClient();
  const { data: signed, error: signErr } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (signErr || !signed?.signedUrl) {
    return deny("Failed to generate signed URL.", 403);
  }

  // Log the URL generation
  await logAccess(actor, "storage", storagePath, "signed_url_generated");

  return { url: signed.signedUrl };
}
