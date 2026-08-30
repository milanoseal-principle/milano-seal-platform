export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Operator Notifications — The Milano Seal™",
  robots: { index: false, follow: false },
};

interface NotificationRow {
  id: string;
  deal_id: string | null;
  channel: string;
  type: string;
  subject: string | null;
  message: string;
  status: string;
  provider: string | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  sent_at: string | null;
  read_at: string | null;
  deals: { id: string; deal_id: string | null; client_name: string | null; status: string | null; deal_status: string | null } | null;
}

function timeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function severityFor(row: NotificationRow) {
  const type = row.type.toLowerCase();
  const status = row.status.toLowerCase();
  if (status === "failed" || status === "bounced" || status === "complained" || status === "suppressed" || type.includes("exception") || type.includes("failed")) return "exception" as const;
  if (type.includes("observed") || type.includes("review") || type.includes("required") || status === "pending") return "action" as const;
  if (type.includes("confirmed") || type.includes("delivered") || status === "delivered" || status === "sent") return "verified" as const;
  return "info" as const;
}

function tone(severity: ReturnType<typeof severityFor>) {
  if (severity === "exception") return "border-red-500/25 bg-red-500/[0.05] text-red-300";
  if (severity === "action") return "border-amber-500/25 bg-amber-500/[0.05] text-amber-200";
  if (severity === "verified") return "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300";
  return "border-white/[0.07] bg-white/[0.02] text-white/55";
}

function actionHref(row: NotificationRow) {
  const matterId = row.deals?.id ?? row.deal_id;
  if (!matterId) return "/dashboard";
  const type = row.type.toLowerCase();
  if (type.includes("payment")) return `/dashboard/deals/${encodeURIComponent(matterId)}`;
  if (type.includes("ron") || type.includes("sign")) return `/dashboard/ron`;
  if (type.includes("apostille")) return `/dashboard/apostille?matter=${encodeURIComponent(matterId)}`;
  if (type.includes("release") || type.includes("courier") || type.includes("delivery")) return `/dashboard/releases?matter=${encodeURIComponent(matterId)}`;
  return `/dashboard/deals/${encodeURIComponent(matterId)}`;
}

function nextAction(row: NotificationRow) {
  const type = row.type.toLowerCase();
  const severity = severityFor(row);
  if (severity === "exception") return "Review the provider/audit failure before the Matter advances.";
  if (type.includes("payment_observed")) return "Wise submission is recorded. Verify settlement separately while scheduling authority follows the canonical gate.";
  if (type.includes("payment_confirmed")) return "Verified settlement is available to downstream execution and release gates.";
  if (type.includes("ron")) return "Open the Signing Room and follow the current Matter readiness gate.";
  if (type.includes("apostille")) return "Open Apostille Desk and review the canonical submission state.";
  if (type.includes("delivery") || type.includes("courier") || type.includes("release")) return "Open Release Control and verify custody/tracking truth.";
  return "Open the Matter and follow the canonical next action.";
}

export default async function OperatorNotificationsPage() {
  await requireDashboardAccess();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, deal_id, channel, type, subject, message, status, provider, error_message, metadata, created_at, sent_at, read_at, deals:deal_id(id, deal_id, client_name, status, deal_status)")
    .order("created_at", { ascending: false })
    .limit(150);

  const rows = (data ?? []) as unknown as NotificationRow[];
  const unread = rows.filter((row) => !row.read_at).length;
  const action = rows.filter((row) => ["action", "exception"].includes(severityFor(row))).length;
  const exceptions = rows.filter((row) => severityFor(row) === "exception").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-5 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-2xl border border-[#C6A65B]/20 bg-[radial-gradient(circle_at_85%_0%,rgba(198,166,91,0.12),transparent_32%),linear-gradient(135deg,#070707,#0b0b0b)] p-5 shadow-[0_26px_90px_rgba(0,0,0,0.36)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A65B]/60">Operator Command / Notification Truth</p>
            <h1 className="mt-2 font-serif text-3xl text-[#F6F1E6]">Notification Center</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">A command view over the existing transactional notification audit log. Delivery evidence remains provider-backed; this surface does not fabricate acknowledgement or execution state.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
            {[["Unread", unread, "text-white"], ["Action", action, "text-amber-300"], ["Exceptions", exceptions, "text-red-300"]].map(([label, value, color]) => (
              <div key={String(label)} className="rounded-xl border border-white/[0.06] bg-black/25 p-3 text-center">
                <p className={`text-xl font-semibold ${color}`}>{value}</p>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-white/30">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-5 text-sm text-red-200">Notification audit data is unavailable. The system is not presenting a false empty state.</section>
      ) : rows.length === 0 ? (
        <section className="rounded-2xl border border-white/[0.07] bg-[#090909] p-10 text-center text-sm text-white/35">No notification audit records are available.</section>
      ) : (
        <section className="space-y-3">
          {rows.map((row) => {
            const severity = severityFor(row);
            const matterRef = row.deals?.deal_id ?? row.deal_id ?? "System event";
            return (
              <article key={row.id} className={`rounded-2xl border p-4 sm:p-5 ${tone(severity)}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-current/20 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.13em]">{severity}</span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">{row.channel} · {row.status}</span>
                      {!row.read_at ? <span className="h-1.5 w-1.5 rounded-full bg-[#C6A65B] shadow-[0_0_12px_rgba(198,166,91,0.75)]" aria-label="Unread" /> : null}
                    </div>
                    <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[#C6A65B]/55">{matterRef}</p>
                    <h2 className="mt-1 text-sm font-semibold text-white/90">{row.subject ?? row.type.replaceAll("_", " ")}</h2>
                    <p className="mt-2 text-xs leading-5 text-white/50">{row.message}</p>
                    {row.error_message ? <p className="mt-2 text-xs leading-5 text-red-300/80">Provider error: {row.error_message}</p> : null}
                    <div className="mt-4 rounded-xl border border-white/[0.055] bg-black/20 p-3">
                      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">Action Required / Next Expected Event</p>
                      <p className="mt-1 text-xs leading-5 text-white/50">{nextAction(row)}</p>
                    </div>
                  </div>
                  <div className="flex min-w-[150px] flex-col gap-2 sm:items-end">
                    <span className="font-mono text-[9px] text-white/25">{timeLabel(row.created_at)}</span>
                    <Link href={actionHref(row)} className="flex min-h-11 w-full items-center justify-center rounded-xl border border-[#C6A65B]/25 bg-[#C6A65B]/[0.055] px-3 py-2 text-xs font-semibold text-[#E4CA8C] transition hover:border-[#C6A65B]/45 hover:bg-[#C6A65B]/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A65B]/60 sm:w-auto">Open Source Matter →</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
