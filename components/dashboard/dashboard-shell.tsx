'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DASHBOARD_MODULES, MODULE_GROUPS, type DashboardModule } from '@/lib/dashboard-modules'
import {
  LayoutGrid, BarChart3, Users, TrendingUp, DollarSign, Search,
  Stamp, Tag, Lightbulb, ClipboardList, MessageSquare, Mail, Share2,
  Star, FileText, Megaphone, Globe, Zap, Map, BookOpen, Route,
  Shield, Scale, Lock, Sparkles, FolderOpen, Menu, X, ChevronRight,
  Funnel
} from 'lucide-react'

const ICONS: Record<string, React.ElementType> = {
  LayoutGrid, BarChart3, Users, TrendingUp, DollarSign, Search,
  Stamp, Tag, Lightbulb, ClipboardList, MessageSquare, Mail, Share2,
  Star, FileText, Megaphone, Globe, Zap, Map, BookOpen, Route,
  Shield, Scale, Lock, Sparkles, FolderOpen, Funnel
}

function NavItem({ mod, active }: { mod: DashboardModule; active: boolean }) {
  const Icon = ICONS[mod.icon] || LayoutGrid
  return (
    <Link
      href={`/dashboard/${mod.route}`}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group ${
        active
          ? 'bg-[#C6A55A]/12 text-[#C6A55A] border border-[#C6A55A]/20'
          : 'text-[#8A8A8A] hover:text-white hover:bg-[#1A1A1A]'
      }`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#C6A55A]' : 'text-[#8A8A8A] group-hover:text-[#B0B0B0]'}`} />
      <span className="font-medium truncate">{mod.name}</span>
      {active && <ChevronRight className="w-3 h-3 ml-auto text-[#C6A55A]" />}
    </Link>
  )
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const activeModule = pathname.split('/').pop() || 'deals'

  const sidebar = (
    <aside className="w-64 flex-shrink-0 bg-[#080808] border-r border-[#1A1A1A] h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-5 border-b border-[#1A1A1A]">
        <Link href="/" className="flex items-center gap-3">
          <img src="/milano-seal-gold-transparent-512.png" alt="" className="w-8 h-8" />
          <div>
            <p className="text-white text-sm font-medium leading-tight">The Milano Seal™</p>
            <p className="text-[#C6A55A] text-[10px] tracking-[0.15em] uppercase">Operator OS</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {MODULE_GROUPS.map(group => {
          const mods = DASHBOARD_MODULES.filter(m => m.group === group)
          return (
            <div key={group}>
              <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[#4A4A4A] px-3 mb-2">{group}</p>
              <div className="space-y-0.5">
                {mods.map(mod => (
                  <NavItem key={mod.route} mod={mod} active={activeModule === mod.route} />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1A1A1A]">
        <p className="text-[10px] text-[#4A4A4A]">Nicholas Milano · FL #668288</p>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">{sidebar}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0">{sidebar}</div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A]">
          <button onClick={() => setMobileOpen(true)} className="text-[#8A8A8A] hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <p className="text-white text-sm font-medium">The Milano Seal™ OS</p>
          <div />
        </div>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
