import { createClient } from "@/lib/supabase/server";

export type UxEventSurface =
  | "public_site"
  | "intake"
  | "secure_matter_portal"
  | "execution_center"
  | "operations_desk";

export type UxEventType =
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
}): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("ux_learning_events").insert({
      user_id: params.userId ?? null,
      client_email: params.clientEmail ?? null,
      matter_id: params.matterId ?? null,
      surface: params.surface,
      event_type: params.eventType,
      event_label: params.eventLabel ?? null,
      metadata: params.metadata ?? {},
    });
  } catch {
    // Silent fail — never block client workflow
  }
}
