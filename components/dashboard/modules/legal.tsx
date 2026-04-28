'use client'
import { ModuleWrapper } from './_module-wrapper'

const SUMMARY = `Entity, banking & compliance records — 16 items`
const DETAIL = `Milano Seal International LLC | EIN 41-5272965 | FL L26000188523 | DBA G26000052114 | Notary #668288 | RON Active | E&O FL-2472245 | Trademark: NOT STARTED`

export function LegalModule({ mod, data }: any) {
  return (
    <ModuleWrapper mod={mod}>
      <div className="bg-[#111111] border border-[#C6A55A]/15 rounded-xl p-5 mb-6">
        <p className="text-[#C6A55A] text-xs font-semibold tracking-widest uppercase mb-2">Module Summary</p>
        <p className="text-[#B0B0B0] text-sm leading-relaxed whitespace-pre-line">{SUMMARY}</p>
      </div>
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><th key="#" className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap">#</th><th key="Category" className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap">Category</th><th key="Item" className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap">Item</th><th key="Doc Number" className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap">Doc Number</th><th key="Filed" className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap">Filed</th><th key="Status" className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap">Status</th><th key="Drive Link" className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap">Drive Link</th></tr></thead>
            <tbody>
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[#8A8A8A] text-sm italic">
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
