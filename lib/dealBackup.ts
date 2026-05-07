import { createAdminClient } from "@/lib/supabase/admin";

export type BackupTrigger =
  | "payment"
  | "shipment"
  | "delivery"
  | "completion"
  | "manual";

export interface SnapshotInput {
  deal_id: string;
  trigger: BackupTrigger;

  deal?: Record<string, unknown> | null;
}

export async function snapshotDeal({
  deal_id,
  trigger,
  deal,
}: SnapshotInput): Promise<{ id: string } | null> {
  if (!deal_id) return null;

  try {
    const supabase = createAdminClient();

    let snapshot = deal ?? null;
    if (!snapshot) {
      const { data } = await supabase
        .from("deals")
        .select("*")
        .eq("id", deal_id)
        .single();
      snapshot = data as Record<string, unknown> | null;
    }
    if (!snapshot) return null;

    const { count } = await supabase
      .from("custody_ledger")
      .select("id", { count: "exact", head: true })
      .eq("deal_id", deal_id);

    const { data: row, error } = await supabase
      .from("deal_backups")
      .insert({
        deal_id,
        trigger,
        snapshot,
        ledger_count: count ?? 0,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[dealBackup] insert failed:", error.message);
      return null;
    }
    return row as { id: string };
  } catch (err) {
    console.error(
      "[dealBackup] unexpected error:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
