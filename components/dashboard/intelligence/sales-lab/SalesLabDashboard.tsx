"use client";

import { KPITile, Card, SectionHeader, Notify } from "./SalesLabShared";
import { SEED_DAILY, DEMO_VALUE_PER_CONVERSION } from "./constants";
import type { Account, Lead } from "./types";

// Sales Lab Snapshot — demo workspace estimates only, never live financial reporting.
// Uses CSS bars (no recharts dependency) for reliability.

export function SalesLabDashboard({ accounts, leads }: { accounts: Account[]; leads: Lead[] }) {
  const conversions = leads.filter((l) => l.status === "converted").length;
  const dms = accounts.reduce((s, a) => s + a.dms, 0);
  const estValue = conversions * DEMO_VALUE_PER_CONVERSION;
  const maxDaily = Math.max(...SEED_DAILY.map((d) => d.dms), 1);

  const byStatus = (["new", "contacted", "qualified", "converted", "lost"] as const).map((s) => ({
    s, n: leads.filter((l) => l.status === s).length,
  }));
  const maxStatus = Math.max(...byStatus.map((b) => b.n), 1);

  return (
    <div className="space-y-6">
      <Notify message="Demo workspace data only — not live financial reporting." tone="gold" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPITile label="Total Leads" value={leads.length} detail="demo workspace" />
        <KPITile label="Conversions" value={conversions} detail="demo workspace" />
        <KPITile label="Estimated Demo Value" value={`$${estValue.toLocaleString()}`} detail="workspace estimate — not live revenue" />
        <KPITile label="DMs Sent" value={dms} detail="demo workspace" />
      </div>

      <Card>
        <SectionHeader title="7-Day Demo Activity" subtitle="Illustrative activity — not live." />
        <div className="flex items-end gap-2" style={{ height: 120 }}>
          {SEED_DAILY.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center justify-end gap-1">
              <div className="w-full rounded-t bg-[#C6A55A]/70" style={{ height: `${(d.dms / maxDaily) * 96}px` }} title={`${d.dms} DMs`} />
              <span className="font-mono text-[8px] text-[#8A8A8A]">{d.day}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader title="Pipeline by Status" subtitle="Demo leads." />
        <div className="space-y-2">
          {byStatus.map((b) => (
            <div key={b.s} className="flex items-center gap-3">
              <span className="w-20 text-[11px] uppercase tracking-[0.1em] text-[#8A8A8A]">{b.s}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/40">
                <div className="h-full rounded-full bg-[#C6A55A]" style={{ width: `${(b.n / maxStatus) * 100}%` }} />
              </div>
              <span className="w-6 text-right text-[12px] tabular-nums text-[#E8E4DC]">{b.n}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader title="Daily Execution Tracker" />
        <ul className="space-y-2 text-[13px] text-[#E8E4DC]/85">
          {["Add 10 new accounts to Outreach Ecosystem", "Generate 5 DMs in DM Builder", "Create 2 reels in Content Studio", "Review + action all new leads", "Follow up with contacted accounts"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C6A55A]" /> {t}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
