'use client'
import { ModuleWrapper, DataCard } from './_module-wrapper'
export function KpiModule({ mod, data }: any) {
  const deals = data?.deals || []
  const paid = deals.filter((d:any)=>d.payment_status==='paid')
  const collected = paid.reduce((s:number,d:any)=>s+(d.amount||0),0)
  const outstanding = deals.filter((d:any)=>d.payment_status!=='paid').reduce((s:number,d:any)=>s+(d.amount||0),0)
  const closeRate = deals.length ? (paid.length/deals.length*100).toFixed(0)+"%" : "—"
  const kpis = [
    { title:'Total Collected', value:`$${collected.toFixed(2)}`, sub:'Revenue confirmed', gold:true },
    { title:'Outstanding', value:`$${outstanding.toFixed(2)}`, sub:'Awaiting payment' },
    { title:'Total Deals', value:deals.length, sub:'All time' },
    { title:'Close Rate', value:closeRate, sub:'Paid / total' },
    { title:'Italy Lane', value:`$${deals.filter((d:any)=>d.country==='Italy'&&d.payment_status==='paid').reduce((s:number,d:any)=>s+(d.amount||0),0).toFixed(2)}`, sub:'Strongest market', gold:true },
    { title:'Awaiting Payment', value:deals.filter((d:any)=>d.status==='awaiting_payment').length, sub:'Active unpaid' },
    { title:'In Execution', value:deals.filter((d:any)=>d.status==='in_execution').length, sub:'Being processed' },
    { title:'Completed', value:deals.filter((d:any)=>d.status==='completed').length, sub:'Delivered' },
  ]
  return (
    <ModuleWrapper mod={mod}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {kpis.map(k=><DataCard key={k.title} {...k} />)}
      </div>
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-5">
        <p className="text-[#C6A55A] text-xs font-semibold tracking-widest uppercase mb-4">Pipeline by Stage</p>
        <div className="space-y-2">
          {["new","reviewing","quoted","awaiting_payment","scheduled","in_execution","apostille","completed","lost"].map(s=>{
            const count = deals.filter((d:any)=>d.status===s).length
            const pct = deals.length ? (count/deals.length*100) : 0
            return (
              <div key={s} className="flex items-center gap-4">
                <span className="text-[#8A8A8A] text-xs w-36 capitalize">{s.replace(/_/g," ")}</span>
                <div className="flex-1 bg-[#1A1A1A] rounded-full h-1.5">
                  <div className="bg-[#C6A55A] h-1.5 rounded-full" style={{width:`${pct}%`}} />
                </div>
                <span className="text-white text-xs w-4 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </ModuleWrapper>
  )
}