"use client";
import { useState } from "react";
import { ModuleWrapper } from "./_module-wrapper";

export function AutomationModule({ mod }: any) {
  const [followupResult, setFollowupResult] = useState<any>(null);
  const [slaResult, setSlaResult] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function runFollowups() {
    setLoading("followup");
    const r = await fetch("/api/admin/followups");
    setFollowupResult(await r.json());
    setLoading(null);
  }

  async function checkSLA() {
    setLoading("sla");
    const r = await fetch("/api/admin/sla");
    setSlaResult(await r.json());
    setLoading(null);
  }

  return (
    <ModuleWrapper mod={mod}>
      {/* Follow-up Engine */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-medium text-sm">Follow-Up Engine</p>
            <p className="text-[#8A8A8A] text-xs mt-0.5">
              24h · 72h · 7d SMS cadence on unpaid deals
            </p>
          </div>
          <button
            onClick={runFollowups}
            disabled={loading === "followup"}
            className="px-4 py-2 bg-[#C6A55A] text-[#0A0A0A] text-xs font-semibold rounded-lg hover:bg-[#D4BB7A] disabled:opacity-50 transition-colors"
          >
            {loading === "followup" ? "Running…" : "Run Now"}
          </button>
        </div>
        {followupResult && (
          <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-3 mt-3">
            <p className="text-[10px] text-[#C6A55A] uppercase tracking-widest mb-2">
              Result
            </p>
            <p className="text-sm text-[#B0B0B0]">
              Ran: {followupResult.ran} · Sent: {followupResult.sent}
            </p>
            {followupResult.results?.map((r: any, i: number) => (
              <div key={i} className="text-xs text-[#8A8A8A] mt-1">
                {r.client_name} — {r.step} — {r.sent ? "✓ sent" : "✗ no phone"}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SLA Engine */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-medium text-sm">
              SLA Breach Detection
            </p>
            <p className="text-[#8A8A8A] text-xs mt-0.5">
              Flags deals stuck unpaid, in execution, or in apostille too long
            </p>
          </div>
          <button
            onClick={checkSLA}
            disabled={loading === "sla"}
            className="px-4 py-2 border border-[#C6A55A] text-[#C6A55A] text-xs font-semibold rounded-lg hover:bg-[#C6A55A]/10 disabled:opacity-50 transition-colors"
          >
            {loading === "sla" ? "Checking…" : "Check SLA"}
          </button>
        </div>
        {slaResult && (
          <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-3 mt-3">
            <div className="flex gap-4 mb-3">
              <div>
                <p className="text-[9px] text-[#8A8A8A] uppercase tracking-widest">
                  Total
                </p>
                <p className="text-white text-lg">{slaResult.total}</p>
              </div>
              <div>
                <p className="text-[9px] text-[#8A8A8A] uppercase tracking-widest">
                  Critical
                </p>
                <p className="text-red-400 text-lg">{slaResult.critical}</p>
              </div>
              <div>
                <p className="text-[9px] text-[#8A8A8A] uppercase tracking-widest">
                  Warnings
                </p>
                <p className="text-amber-400 text-lg">{slaResult.warnings}</p>
              </div>
            </div>
            {slaResult.breaches?.map((b: any, i: number) => (
              <div
                key={i}
                className={`flex items-start gap-3 py-2 border-t border-[#1A1A1A] ${
                  b.severity === "critical" ? "text-red-400" : "text-amber-400"
                }`}
              >
                <span className="text-xs flex-shrink-0 mt-0.5">
                  {b.severity === "critical" ? "🔴" : "🟡"}
                </span>
                <div>
                  <p className="text-xs font-medium">{b.client_name}</p>
                  <p className="text-[10px] opacity-75">
                    {b.breach_type} · {b.age_hours}h old
                  </p>
                </div>
              </div>
            ))}
            {slaResult.total === 0 && (
              <p className="text-[#5DBB8A] text-sm">✓ All deals within SLA</p>
            )}
          </div>
        )}
      </div>

      {/* Automation rules reference */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-5">
        <p className="text-[#C6A55A] text-[10px] tracking-widest uppercase font-semibold mb-4">
          Trigger Rules
        </p>
        <div className="space-y-2">
          {[
            ["24h", "Unpaid deal → SMS retainer reminder"],
            ["72h", "Still unpaid → Personal SMS from Nicholas"],
            ["7d", "Final notice → Release slot warning"],
            ["SLA", "Payment overdue 48h → Warning flag"],
            ["SLA", "Payment overdue 7d → Critical flag"],
            ["SLA", "Paid but not scheduled 24h → Critical"],
            ["SLA", "Execution stalled 5 days → Critical"],
            ["Payment", "Confirmed → auto-trigger runStep(schedule)"],
          ].map(([type, desc], i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <span className="w-16 text-[#C6A55A] font-mono text-[10px] flex-shrink-0">
                {type}
              </span>
              <span className="text-[#8A8A8A]">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </ModuleWrapper>
  );
}
