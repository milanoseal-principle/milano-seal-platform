"use client";
import { useState } from 'react';

import { Card, SectionHeader, Select, Input, GoldBtn, GhostBtn, Badge } from "./SalesLabShared";
import { PLATFORMS, PRIORITIES, ACCOUNT_STATUSES } from "./constants";
import type { Account, Priority, AccountStatus } from "./types";

const prTone = (p: Priority) => (p === "vip" ? "gold" : p === "high" ? "green" : "gray");

export function EcosystemTracker({ accounts, setAccounts }: { accounts: Account[]; setAccounts: (a: Account[]) => void }) {
  const [filter, setFilter] = useState<string>("all");
  const [form, setForm] = useState({ handle: "", name: "", platform: PLATFORMS[0], priority: "medium" as Priority });

  function addAccount() {
    if (!form.handle.trim()) return;
    const acc: Account = {
      id: `acc-${accounts.length + 1}-${form.handle}`,
      handle: form.handle.startsWith("@") ? form.handle : `@${form.handle}`,
      name: form.name || form.handle, platform: form.platform, priority: form.priority,
      status: "new", dms: 0, lastContact: null, tags: [], demo: true,
    };
    setAccounts([acc, ...accounts]);
    setForm({ handle: "", name: "", platform: PLATFORMS[0], priority: "medium" });
  }

  const shown = accounts.filter((a) =>
    filter === "all" ? true : ["vip", "high", "medium", "low"].includes(filter) ? a.priority === filter : a.status === filter,
  );

  return (
    <div className="space-y-5">
      <Card>
        <SectionHeader title="Outreach Ecosystem" subtitle="Demo workspace only. Add real prospects manually before outreach." />
        <div className="grid gap-2.5 sm:grid-cols-4">
          <Input value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} placeholder="@handle" />
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
          <Select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as typeof form.platform })}>
            {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
          </Select>
          <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </Select>
        </div>
        <div className="mt-3"><GoldBtn onClick={addAccount}>Add Account</GoldBtn></div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {["all", ...ACCOUNT_STATUSES, "vip", "high"].map((f) => <GhostBtn key={f} onClick={() => setFilter(f)}>{f}</GhostBtn>)}
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[#1E1E1E] text-left">
              {["Handle", "Name", "Platform", "Priority", "Status", "DMs", "Last Contact"].map((h) => (
                <th key={h} className="px-4 py-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#8A8A8A]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((a) => (
              <tr key={a.id} className="border-b border-[#1E1E1E]/60 last:border-0">
                <td className="px-4 py-3 font-mono text-[#C6A55A]">{a.handle}</td>
                <td className="px-4 py-3 text-[#E8E4DC]">{a.name}</td>
                <td className="px-4 py-3 text-[#8A8A8A]">{a.platform}</td>
                <td className="px-4 py-3"><Badge tone={prTone(a.priority)}>{a.priority}</Badge></td>
                <td className="px-4 py-3 text-[#E8E4DC]/80">{a.status}</td>
                <td className="px-4 py-3 tabular-nums text-[#E8E4DC]/80">{a.dms}</td>
                <td className="px-4 py-3 text-[#8A8A8A]">{a.lastContact ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
