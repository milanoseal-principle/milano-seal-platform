"use client";
import { ModuleWrapper } from "./_module-wrapper";

const SUMMARY = `21 countries — global apostille intelligence database`;
const DETAIL = `Italy 95 | Spain 82 | Mexico 78 | Portugal 71 | Brazil 68 | Germany 55 | France 52 | Greece 48 | Australia 44 | UK 43`;

export function CountriesModule({ mod, data }: any) {
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
                  key="#"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  #
                </th>
                <th
                  key="Country"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Country
                </th>
                <th
                  key="Hague"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Hague
                </th>
                <th
                  key="Apostille Req"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Apostille Req
                </th>
                <th
                  key="Method"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Method
                </th>
                <th
                  key="Std Days"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Std Days
                </th>
                <th
                  key="Translation"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Translation
                </th>
                <th
                  key="Demand Score"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Demand Score
                </th>
                <th
                  key="Tier"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Tier
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={9}
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
