import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { readAllKeyset } from "@/lib/data/keyset";
import { summarizeByServiceIntent, type ServiceIntentRow } from "@/lib/intake/serviceIntentAttribution";
import { serviceLane } from "@/lib/intake/serviceIntent";

const COLUMNS = "id, notes, quote_approved_at, payment_confirmed, payment_status, payment_settlement_status, amount_due, amount_paid, currency";
const PAGE = 500;

// Read-only operator report. Revenue comes only from exact verified settlement.
export async function ServiceIntentAttribution() {
  let summary: ReturnType<typeof summarizeByServiceIntent> | null = null;
  try {
    const admin = createAdminClient();
    const rows = await readAllKeyset<ServiceIntentRow>(async (cursor) => {
      let query = admin.from("deals").select(COLUMNS).order("id").limit(PAGE);
      if (cursor) query = query.gt("id", cursor.id);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ServiceIntentRow[];
    }, (row) => String(row.id));
    summary = summarizeByServiceIntent(rows);
  } catch {
    summary = null;
  }
  return (
    <section aria-labelledby="service-intent-heading" className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <h2 id="service-intent-heading" className="font-serif text-xl">Service intent attribution</h2>
      <p className="mt-1 text-xs text-white/50">Matters by the service the client requested at intake. Revenue counts exact verified Wise settlement only; quotes and pending payments are excluded.</p>
      {!summary ? (
        <p role="status" className="mt-4 text-sm text-amber-200">Attribution data is unavailable right now. No figures are shown rather than guessed.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.12em] text-white/50">
              <tr><th scope="col" className="py-2 pr-4">Requested service</th><th scope="col" className="py-2 pr-4">Matters</th><th scope="col" className="py-2 pr-4">Quoted</th><th scope="col" className="py-2 pr-4">Verified settled</th><th scope="col" className="py-2">Verified revenue</th></tr>
            </thead>
            <tbody>
              {summary.map((row) => (
                <tr key={row.intent} className="border-t border-white/5">
                  <th scope="row" className="py-2 pr-4 font-normal text-white/85">{row.intent === "not_captured" ? "Not captured" : serviceLane(row.intent).title}</th>
                  <td className="py-2 pr-4">{row.matters}</td>
                  <td className="py-2 pr-4">{row.quoted}</td>
                  <td className="py-2 pr-4">{row.verifiedSettled}</td>
                  <td className="py-2">{Object.keys(row.verifiedRevenueByCurrency).length ? Object.entries(row.verifiedRevenueByCurrency).map(([c, v]) => `${c} ${v.toFixed(2)}`).join(" · ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
