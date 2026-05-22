"use client";
import { ModuleWrapper } from "./_module-wrapper";

const SUMMARY = `High-value bundle & market intel — 7 bundles mapped`;
const DETAIL = `Italian Citizenship $800-2000 | FBI Apostille $400-900 | International Property $400-1200 | Immigration Package $500-1400 | Missing Record $300-700 | Translation Pack $200-500 | POA+Apostille $425-650`;

export function IntelligenceModule({ mod, data }: any) {
  return (
    <ModuleWrapper mod={mod}>
      <div className="bg-[#111111] border border-[#C6A55A]/15 rounded-xl p-5 mb-6">
        <p className="text-[#C6A55A] text-xs font-semibold tracking-widest uppercase mb-2">
          Module Summary
        </p>
        <p className="text-[#B0B0B0] text-sm leading-relaxed whitespace-pre-line">
          {SUMMARY}
        </p>
      </div>
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th
                  key="Bundle"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Bundle
                </th>
                <th
                  key="Typical Documents"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Typical Documents
                </th>
                <th
                  key="Apostilles"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Apostilles
                </th>
                <th
                  key="Client Type"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Client Type
                </th>
                <th
                  key="Low $"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Low $
                </th>
                <th
                  key="High $"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  High $
                </th>
                <th
                  key="Priority"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Priority
                </th>
                <th
                  key="Market"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Market
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-[#8A8A8A] text-sm italic"
                >
                  Data populated from spreadsheet. Wire to Supabase table as
                  volume scales.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-5">
        <p className="text-[#C6A55A] text-[10px] tracking-widest uppercase font-semibold mb-3">
          Current Data
        </p>
        <p className="text-[#8A8A8A] text-sm leading-relaxed whitespace-pre-line font-mono text-xs">
          {DETAIL}
        </p>
      </div>
    </ModuleWrapper>
  );
}
