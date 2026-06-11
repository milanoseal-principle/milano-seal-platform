import { createClient } from "@/lib/supabase/server";

export type UxEventSurface =
  | "public_site"
  | "intake"
  | "secure_matter_portal"
  | "execution_center"
  | "operations_desk";

export type UxEventType =
  | "intake_started"
  | "intake_submitted"
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
