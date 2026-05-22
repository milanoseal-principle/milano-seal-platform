import { createAdminClient } from "@/lib/supabase/admin";

export type ActivityAction =
  | "created"
  | "stage_advanced"
  | "scheduled"
  | "executed"
  | "apostille"
  | "shipped"
  | "completed"
  | "lost"
  | "payment_confirmed"
  | "payment_updated"
  | "assignee_changed"
  | "note_added"
  | "tracking_added"
  | "follow_up_sent"
  | "system";

export interface ActivityEntry {
  deal_id: string | null;
  actor?: string | null;
  action: ActivityAction | string;
  detail?: string | null;
  meta?: Record<string, unknown> | null;
}

export async function logActivity(entry: ActivityEntry): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("activity_logs").insert({
      deal_id: entry.deal_id,
      actor: entry.actor ?? "system",
      action: entry.action,
      detail: entry.detail ?? null,
      meta: entry.meta ?? null,
    });
    if (error) {
      console.error("[activity] insert failed:", error.message);
    }
  } catch (err) {
    console.error(
      "[activity] unexpected error:",
      err instanceof Error ? err.message : err
    );
  }
}

export async function getActivityForDeal(
  dealId: string,
  limit = 100
): Promise<
  Array<{
    id: string;
    deal_id: string | null;
    actor: string | null;
    action: string;
    detail: string | null;
    meta: Record<string, unknown> | null;
    created_at: string;
  }>
> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("[activity] read failed:", error.message);
      return [];
    }
    return (data ?? []) as Awaited<ReturnType<typeof getActivityForDeal>>;
  } catch (err) {
    console.error(
      "[activity] read error:",
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

export async function resolveActor(supabase: {
  auth: {
    getUser: () => Promise<{
      data: { user: { email?: string | null } | null };
    }>;
  };
}): Promise<string> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.email ?? "admin";
  } catch {
    return "admin";
  }
}
