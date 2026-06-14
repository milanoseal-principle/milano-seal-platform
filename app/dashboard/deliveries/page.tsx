import Link from "next/link";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface DeliveryLogRow {
  id: string;
  matter_id: string;
  invoice_number: string | null;
  client_name: string | null;
  matter_type: string | null;
  execution_lane: string | null;
  sent_at: string;
  file_name: string | null;
  sent_by: string | null;
  status: string;
  confirmation_received: boolean;
  follow_up_required: boolean;
  pdf_locked: boolean;
  version_type: string | null;
}

export default async function DeliveryLogPage() {
  await requireDashboardAccess();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("delivery_logs")
    .select(
      "id,matter_id,invoice_number,client_name,matter_type,execution_lane,sent_at,file_name,sent_by,status,confirmation_received,follow_up_required,pdf_locked,version_type",
    )
    .order("sent_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as DeliveryLogRow[];

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.32em] text-[#C6A55A]/60">
              Controlled Records / Final Delivery
            </p>
            <h1 className="font-serif text-3xl text-[#E4D2A4]">Delivery Log</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/45">
              Operator-visible history for locked files, client delivery, receipt
              confirmation, and follow-up control.
            </p>
          </div>
          <Link
            href="/dashboard/releases"
            className="min-h-11 rounded border border-[#C6A55A]/25 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#C6A55A]"
          >
            Open Release Review
          </Link>
        </div>

        {error ? (
          <div className="rounded border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-200/70">
            Delivery records are unavailable. Confirm migration 033 has been
            applied before using this view.
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded border border-[#C6A55A]/10 bg-[#0D0B08] p-10 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#C6A55A]/55">
              No delivery records
            </p>
            <p className="mt-3 text-sm text-white/35">
              Records appear after an approved delivery is generated or sent.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-[#C6A55A]/10 bg-[#0D0B08]">
            <table className="w-full min-w-[1050px] text-left text-xs">
              <thead className="border-b border-[#C6A55A]/10 font-mono text-[9px] uppercase tracking-[0.18em] text-[#C6A55A]/55">
                <tr>
                  <th className="px-4 py-3">Sent</th>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Client / Matter</th>
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Lock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row) => (
                  <tr key={row.id} className="text-white/60">
                    <td className="px-4 py-4">
                      {new Date(row.sent_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 font-mono">
                      {row.invoice_number ?? "—"}
                    </td>
                    <td className="px-4 py-4">
                      <span className="block text-white/80">
                        {row.client_name ?? "Client withheld"}
                      </span>
                      <span className="mt-1 block font-mono text-[9px] text-white/30">
                        {row.matter_id}
                      </span>
                    </td>
                    <td className="max-w-[300px] truncate px-4 py-4 font-mono text-[10px]">
                      {row.file_name ?? "—"}
                    </td>
                    <td className="px-4 py-4">{row.version_type ?? "—"}</td>
                    <td className="px-4 py-4">
                      {row.pdf_locked ? "Locked" : "Not locked"}
                    </td>
                    <td className="px-4 py-4 text-[#C6A55A]">{row.status}</td>
                    <td className="px-4 py-4">
                      {row.confirmation_received
                        ? "Confirmed"
                        : row.follow_up_required
                          ? "Required"
                          : "Pending"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
