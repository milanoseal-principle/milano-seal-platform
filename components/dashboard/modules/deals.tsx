'use client'
import { ModuleWrapper, DataCard } from './_module-wrapper'
import Link from 'next/link'
const STATUS_COLORS: Record<string,string> = {
  new:'text-gray-400',reviewing:'text-gray-300',quoted:'text-cyan-400',awaiting_payment:'text-yellow-400',
  scheduled:'text-blue-400',in_execution:'text-purple-400',apostille:'text-orange-400',
  completed:'text-green-400',lost:'text-red-400'
}
export function DealsModule({ mod, data }: any) {
  const deals = data?.deals || []
  const collected = deals.filter((d:any)=>d.payment_status==='paid').reduce((s:number,d:any)=>s+(d.amount||0),0)
  const active = deals.filter((d:any)=>!['completed','lost'].includes(d.status)).length
  return (
    <ModuleWrapper mod={mod} actions={<Link href="/intake" className="px-4 py-2 bg-[#C6A55A] text-[#0A0A0A] text-xs font-semibold rounded-lg hover:bg-[#D4B76A] transition-colors">+ New Matter</Link>}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <DataCard title="Total Deals" value={deals.length} sub="All time" />
        <DataCard title="Active" value={active} sub="Open pipeline" />
        <DataCard title="Collected" value={`$${collected.toFixed(2)}`} sub="Revenue" gold />
        <DataCard title="Avg Deal" value={deals.length ? `$${(collected/Math.max(deals.filter((d:any)=>d.payment_status==='paid').length,1)).toFixed(0)}` : "—"} sub="Per paid deal" />
      </div>
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#2A2A2A] flex items-center justify-between">
          <p className="text-white text-sm font-medium">All Matters</p>
          <span className="text-[#8A8A8A] text-xs">{deals.length} deals</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>{["Client","Country","Lane","Amount","Status","Created"].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {deals.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#8A8A8A] text-sm italic">No deals yet. Submit intake to create your first matter.</td></tr>
              ) : deals.map((d:any)=>(
                <tr key={d.id} className="hover:bg-[#1A1A1A] transition-colors">
                  <td className="px-4 py-3 text-white text-sm font-medium">{d.client_name||"—"}</td>
                  <td className="px-4 py-3 text-[#8A8A8A] text-sm">{d.country||"—"}</td>
                  <td className="px-4 py-3 text-[#8A8A8A] text-sm capitalize">{d.execution_tier||"—"}</td>
                  <td className="px-4 py-3 text-[#C6A55A] text-sm">{d.amount?`$${d.amount}`:"—"}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium capitalize ${STATUS_COLORS[d.status]||"text-gray-400"}`}>{(d.status||"").replace(/_/g," ")}</span></td>
                  <td className="px-4 py-3 text-[#8A8A8A] text-xs">{d.created_at?new Date(d.created_at).toLocaleDateString():"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleWrapper>
  )
}