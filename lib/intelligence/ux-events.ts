import { createClient } from "@/lib/supabase/server";

export type UxEventSurface =
  | "public_site"
  | "intake"
  | "secure_matter_portal"
  | "execution_center"
  | "operations_desk";

export type UxEventType =
  | "counsel_visit"
  | "counsel_inquiry_opened"
  | "counsel_inquiry_submitted"
  | "counsel_submission_failed"
  | "service_intent_selected"
  | "lead_fallback_opened"
  | "intake_started"
  | "description_completed"
  | "document_uploaded"
  | "analysis_completed"
  | "analysis_corrected"
  | "clarification_requested"
  | "clarification_completed"
  | "step_1_completed"
  | "step_2_completed"
  | "review_viewed"
  | "review_edited"
  | "intake_submitted"
  | "intake_abandoned"
  | "intake_error"
  | "upload_failed"
  | "upload_retry_started"
  | "upload_retry_completed"
  | "invoice_viewed"
  | "payment_clicked"
  | "vault_opened"
  | "custody_rail_opened"
  | "review_clicked"
  | "support_clicked";

export async function recordUxLearningEvent(params: {
  userId?: string;
  clientEmail?: string;
  matterId?: string;
  surface: UxEventSurface;
  eventType: UxEventType;
  eventLabel?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ recorded: boolean }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("ux_learning_events").insert({
      user_id: params.userId ?? null,
      client_email: params.clientEmail ?? null,
      matter_id: params.matterId ?? null,
      surface: params.surface,
      event_type: params.eventType,
      event_label: params.eventLabel ?? null,
      metadata: params.metadata ?? {},
    });
    if (error) console.warn("[ux-events] observation unavailable", { event_type: params.eventType, surface: params.surface, code: error.code });
    return { recorded: !error };
  } catch {
    // Observational failure cannot block execution; callers can expose unavailable telemetry.
    console.warn("[ux-events] observation unavailable", { event_type: params.eventType, surface: params.surface });
    return { recorded: false };
  }
}
