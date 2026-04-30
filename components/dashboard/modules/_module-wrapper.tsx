'use client'
import { type DashboardModule } from '@/lib/dashboard-modules'

export function ModuleWrapper({
  mod, children, actions
}: {
  mod?: DashboardModule
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="p-6 md:p-8 h-full">
      {mod && (
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[#C6A55A] text-[10px] tracking-[0.25em] uppercase font-semibold mb-1">{mod.group}</p>
            <h1 className="text-white text-2xl font-serif font-medium">{mod.name}</h1>
            <p className="text-[#8A8A8A] text-sm mt-1">{mod.description}</p>
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

export function DataCard({ title, value, sub, gold }: { title: string; value: string | number; sub?: string; gold?: boolean }) {
  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-5">
      <p className="text-[#8A8A8A] text-[10px] uppercase tracking-[0.1em] mb-2">{title}</p>
      <p className={`text-2xl font-light ${gold ? 'text-[#C6A55A]' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-[#C6A55A] text-[10px] mt-1">{sub}</p>}
    </div>
  )
}

export function TableWrapper({ headers, children, empty }: {
  headers: string[]; children: React.ReactNode; empty?: string
}) {
  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {headers.map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.12em] uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  )
}

export function ScriptCard({ title, channel, body, when, status }: {
  title: string; channel: string; body: string; when?: string; status?: string
}) {
  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white font-medium text-sm">{title}</p>
          <p className="text-[#C6A55A] text-[10px] tracking-wide uppercase mt-0.5">{channel}</p>
        </div>
        {status && <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 ${status === 'Ready' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>{status}</span>}
      </div>
      <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-4 font-mono text-xs text-[#B0B0B0] leading-relaxed whitespace-pre-wrap">{body}</div>
      {when && <p className="text-[#8A8A8A] text-xs">{when}</p>}
    </div>
  )
}
