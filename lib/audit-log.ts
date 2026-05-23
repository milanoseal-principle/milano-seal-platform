import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";

// ============================================================
// Resource types
// ============================================================
export type AuditResourceType =
  | "deals"
  | "files"
  | "payments"
  | "users"
  | "auth"
  | "portal"
  | "custody"
  | "config";

// ============================================================
// Audit actions
// ============================================================
export type AuditAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "execute"
  | "export"
  | "login"
  | "logout"
  | "stage_advance"
  | "payment_confirmed"
  | "document_upload"
  | "document_download"
  | "portal_access"
  | "role_check_passed"
  | "role_check_failed";

// ============================================================
// Security event types
// ============================================================
export type SecurityEventType =
  | "login_failed"
  | "unauthorized_access"
  | "role_escalation_attempt"
  | "rate_limit_exceeded"
  | "token_reuse"
  | "suspicious_activity"
  | "unauthenticated_admin_attempt";

export type SecuritySeverity = "low" | "medium" | "high" | "critical";

// ============================================================
// Audit event payload
// ============================================================
export interface AuditEventPayload {
  actorId?: string | null;
  actorEmail?: string | null;
  resourceType: AuditResourceType;
  resourceId?: string | null;
  action: AuditAction;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  status?: "success" | "failure";
  errorMsg?: string | null;
}

// ============================================================
// Security event payload
// ============================================================
export interface SecurityEventPayload {
  eventType: SecurityEventType;
  userId?: string | null;
  actorEmail?: string | null;
  severity: SecuritySeverity;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// ============================================================
// Extract request metadata (IP + user agent)
// Works in Next.js App Router API routes.
// ============================================================
export function extractRequestMeta(req: NextRequest): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const ua = req.headers.get("user-agent") || null;
  return { ipAddress: ip, userAgent: ua };
}

// ============================================================
// logAuditEvent
// Writes to audit_events table. Never throws — audit failures
// must not block the operation being audited.
// ============================================================
export async function logAuditEvent(
  payload: AuditEventPayload
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("audit_events").insert({
      actor_id: payload.actorId ?? null,
      actor_email: payload.actorEmail ?? null,
      resource_type: payload.resourceType,
      resource_id: payload.resourceId ?? null,
      action: payload.action,
      old_value: payload.oldValue ?? null,
      new_value: payload.newValue ?? null,
      ip_address: payload.ipAddress ?? null,
      user_agent: payload.userAgent ?? null,
      status: payload.status ?? "success",
      error_msg: payload.errorMsg ?? null,
    });
    if (error) {
      console.error("[audit-log] audit_events insert failed:", error.message);
    }
  } catch (err) {
    console.error(
      "[audit-log] audit_events unexpected error:",
      err instanceof Error ? err.message : err
    );
  }
}

// ============================================================
// logSecurityEvent
// Writes to security_events table. Never throws.
// ============================================================
export async function logSecurityEvent(
  payload: SecurityEventPayload
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("security_events").insert({
      event_type: payload.eventType,
      user_id: payload.userId ?? null,
      actor_email: payload.actorEmail ?? null,
      severity: payload.severity,
      details: payload.details ?? null,
      ip_address: payload.ipAddress ?? null,
      user_agent: payload.userAgent ?? null,
      remediation: "open",
    });
    if (error) {
      console.error(
        "[audit-log] security_events insert failed:",
        error.message
      );
    }
  } catch (err) {
    console.error(
      "[audit-log] security_events unexpected error:",
      err instanceof Error ? err.message : err
    );
  }
}

// ============================================================
// Typed convenience helpers
// ============================================================

export async function auditDealStageAdvance(
  actorId: string,
  actorEmail: string,
  dealId: string,
  fromStage: string,
  toStage: string,
  req?: NextRequest
): Promise<void> {
  const meta = req ? extractRequestMeta(req) : { ipAddress: null, userAgent: null };
  await logAuditEvent({
    actorId,
    actorEmail,
    resourceType: "deals",
    resourceId: dealId,
    action: "stage_advance",
    oldValue: { stage: fromStage },
    newValue: { stage: toStage },
    ...meta,
  });
}

export async function auditPaymentConfirmed(
  dealId: string,
  amount: number,
  method: string,
  req?: NextRequest
): Promise<void> {
  const meta = req ? extractRequestMeta(req) : { ipAddress: null, userAgent: null };
  await logAuditEvent({
    actorId: null,
    actorEmail: "system",
    resourceType: "payments",
    resourceId: dealId,
    action: "payment_confirmed",
    newValue: { amount, method },
    ...meta,
  });
}

export async function auditDocumentUpload(
  actorId: string,
  actorEmail: string,
  dealId: string,
  fileName: string,
  req?: NextRequest
): Promise<void> {
  const meta = req ? extractRequestMeta(req) : { ipAddress: null, userAgent: null };
  await logAuditEvent({
    actorId,
    actorEmail,
    resourceType: "files",
    resourceId: dealId,
    action: "document_upload",
    newValue: { file_name: fileName },
    ...meta,
  });
}

export async function auditPortalAccess(
  actorEmail: string,
  dealId: string,
  req?: NextRequest
): Promise<void> {
  const meta = req ? extractRequestMeta(req) : { ipAddress: null, userAgent: null };
  await logAuditEvent({
    actorId: null,
    actorEmail,
    resourceType: "portal",
    resourceId: dealId,
    action: "portal_access",
    ...meta,
  });
}

export async function auditUnauthorizedAccess(
  actorEmail: string | null,
  endpoint: string,
  req?: NextRequest
): Promise<void> {
  const meta = req ? extractRequestMeta(req) : { ipAddress: null, userAgent: null };
  await logSecurityEvent({
    eventType: "unauthorized_access",
    actorEmail,
    severity: "high",
    details: { endpoint },
    ...meta,
  });
}

export async function auditUnauthenticatedAdminAttempt(
  endpoint: string,
  req?: NextRequest
): Promise<void> {
  const meta = req ? extractRequestMeta(req) : { ipAddress: null, userAgent: null };
  await logSecurityEvent({
    eventType: "unauthenticated_admin_attempt",
    severity: "high",
    details: { endpoint },
    ...meta,
  });
}
