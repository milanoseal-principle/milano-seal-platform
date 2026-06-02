export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { InstitutionalMemory } from "@/components/dashboard/InstitutionalMemory";

export const metadata = {
  title: "Memory Engine — Milano Seal",
};

export interface RejectedMatter {
  id: string;
  client_name: string | null;
  destination_country: string | null;
  document_type: string | null;
  matter_status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TerminalEvent {
  event_type: string;
  metadata: Record<string, unknown> | null;
  actor: string | null;
  created_at: string;
}

export default async function MemoryPage() {
  await requireDashboardAccess();
  const supabase = createAdminClient();

  const { data: rejectedMatters } = await supabase
    .from("deals")
    .select(
      "id, client_name, destination_country, document_type, matter_status, notes, created_at, updated_at"
    )
    .or("matter_status.eq.rejected,notes.ilike.%reject%,notes.ilike.%return%,notes.ilike.%error%")
    .order("created_at", { ascending: false })
    .limit(100);

  let terminalEvents: TerminalEvent[] = [];
  try {
    const { data } = await supabase
      .from("operator_event_log")
      .select("event_type, metadata, actor, created_at")
      .in("event_type", [
        "REJECTION_LOGGED",
        "AUTHORITY_DEMOTED",
        "CORRECTION_APPLIED",
        "RELEASE_FAILED",
        "PAYMENT_FAILED",
      ])
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) terminalEvents = data as TerminalEvent[];
  } catch {
    // table may not exist — safe to ignore
    terminalEvents = [];
  }

  return (
    <InstitutionalMemory
      incidents={(rejectedMatters || []) as RejectedMatter[]}
      events={terminalEvents}
    />
  );
}
