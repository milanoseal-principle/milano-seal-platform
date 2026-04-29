"use client";
import { ModuleWrapper } from "./_module-wrapper";

const SUMMARY = `16 document types classified`;
const DETAIL = `POA General $425-750 | Birth Cert $350-600 | FBI BGC $400-750 | One and Same Affidavit $500-760 | Corporate Resolution $500-900`;

export function DocumentsModule({ mod, data }: any) {
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
                  key="Doc ID"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Doc ID
                </th>
                <th
                  key="Document Name"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Document Name
                </th>
                <th
                  key="Category"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Category
                </th>
                <th
                  key="RON"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  RON
                </th>
                <th
                  key="Mobile"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Mobile
                </th>
                <th
                  key="Apostille"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Apostille
                </th>
                <th
                  key="Price Low"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Price Low
                </th>
                <th
                  key="Price High"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  Price High
                </th>
                <th
                  key="SEO Vol"
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                >
                  SEO Vol
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={10}
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
