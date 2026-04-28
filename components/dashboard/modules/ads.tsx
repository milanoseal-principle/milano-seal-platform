'use client'
import { ModuleWrapper } from './_module-wrapper'

const SUMMARY = `Paid acquisition performance — 9 campaigns staged, $0 spend currently`
const DETAIL = `ROAS rules: >4 SCALE HARD | >2 OPTIMIZE | <1 PAUSE. Italy POA, Spain FBI, General POA/FBI, Meta retargeting, LinkedIn attorney cold`

export function AdsModule({ mod, data }: any) {
  return (
    <ModuleWrapper mod={mod}>
      <div className="bg-[#111111] border border-[#C6A55A]/15 rounded-xl p-5 mb-6">
        <p className="text-[#C6A55A] text-xs font-semibold tracking-widest uppercase mb-2">Module Summary</p>
        <p className="text-[#B0B0B0] text-sm leading-relaxed whitespace-pre-line">{SUMMARY}</p>
      </div>
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><th key="ID" className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap">ID</th><th key="Platform" className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap">Platform</th><th key="Campaign" className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap">Campaign</th><th key="Target Keyword" className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap">Target Keyword</th><th key="Type" className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap">Type</th><th key="Spend" className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap">Spend</th><th key="Clicks" className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap">Clicks</th><th key="ROAS" className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap">ROAS</th><th key="Status" className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap">Status</th></tr></thead>
            <tbody>
              <tr><td colSpan={9} className="px-4 py-10 text-center text-[#8A8A8A] text-sm italic">
                Data populated from spreadsheet. Wire to Supabase table as volume scales.
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-5">
        <p className="text-[#C6A55A] text-[10px] tracking-widest uppercase font-semibold mb-3">Current Data</p>
        <p className="text-[#8A8A8A] text-sm leading-relaxed whitespace-pre-line font-mono text-xs">{DETAIL}</p>
      </div>
    </ModuleWrapper>
  )
}
