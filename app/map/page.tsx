'use client'

import { useState } from 'react'
import { Header } from '@/components/landing/header'
import { Footer } from '@/components/landing/footer'
import Link from 'next/link'
import { Globe, ArrowRight, X, ChevronRight } from 'lucide-react'

interface ComplianceResult {
  jurisdiction: string
  jurisdiction_type: string
  ron_allowed: boolean
  apostille_required: boolean
  witnesses_required: boolean
  witness_count: number
  hague_member: boolean
  restrictions: string[]
  notes: string
  execution_path: string[]
  requires_review?: boolean
}

const JURISDICTIONS = [
  // US States
  { key: 'florida',              label: 'Florida',           type: 'state',   region: 'US States',     flag: '🇺🇸' },
  { key: 'colorado',             label: 'Colorado',          type: 'state',   region: 'US States',     flag: '🇺🇸' },
  { key: 'virginia',             label: 'Virginia',          type: 'state',   region: 'US States',     flag: '🇺🇸' },
  { key: 'texas',                label: 'Texas',             type: 'state',   region: 'US States',     flag: '🇺🇸' },
  { key: 'new york',             label: 'New York',          type: 'state',   region: 'US States',     flag: '🇺🇸' },
  { key: 'california',           label: 'California',        type: 'state',   region: 'US States',     flag: '🇺🇸' },
  { key: 'georgia',              label: 'Georgia',           type: 'state',   region: 'US States',     flag: '🇺🇸' },
  { key: 'nevada',               label: 'Nevada',            type: 'state',   region: 'US States',     flag: '🇺🇸' },
  { key: 'washington',           label: 'Washington',        type: 'state',   region: 'US States',     flag: '🇺🇸' },
  { key: 'pennsylvania',         label: 'Pennsylvania',      type: 'state',   region: 'US States',     flag: '🇺🇸' },
  // Europe
  { key: 'italy',          label: 'Italy',             type: 'country', region: 'Europe',        flag: '🇮🇹' },
  { key: 'spain',          label: 'Spain',             type: 'country', region: 'Europe',        flag: '🇪🇸' },
  { key: 'portugal',       label: 'Portugal',          type: 'country', region: 'Europe',        flag: '🇵🇹' },
  { key: 'france',         label: 'France',            type: 'country', region: 'Europe',        flag: '🇫🇷' },
  { key: 'germany',        label: 'Germany',           type: 'country', region: 'Europe',        flag: '🇩🇪' },
  { key: 'greece',         label: 'Greece',            type: 'country', region: 'Europe',        flag: '🇬🇷' },
  { key: 'united kingdom', label: 'United Kingdom',    type: 'country', region: 'Europe',        flag: '🇬🇧' },
  // Latin America
  { key: 'brazil',         label: 'Brazil',            type: 'country', region: 'Latin America', flag: '🇧🇷' },
  { key: 'mexico',         label: 'Mexico',            type: 'country', region: 'Latin America', flag: '🇲🇽' },
  { key: 'argentina',      label: 'Argentina',         type: 'country', region: 'Latin America', flag: '🇦🇷' },
  { key: 'colombia',       label: 'Colombia',          type: 'country', region: 'Latin America', flag: '🇨🇴' },
  // North America
  { key: 'canada',         label: 'Canada',            type: 'country', region: 'North America', flag: '🇨🇦' },
  // Middle East
  { key: 'united arab emirates', label: 'UAE',         type: 'country', region: 'Middle East',   flag: '🇦🇪' },
  { key: 'israel',         label: 'Israel',            type: 'country', region: 'Middle East',   flag: '🇮🇱' },
  // Asia Pacific
  { key: 'japan',          label: 'Japan',             type: 'country', region: 'Asia Pacific',  flag: '🇯🇵' },
  { key: 'australia',      label: 'Australia',         type: 'country', region: 'Asia Pacific',  flag: '🇦🇺' },
]

const REGIONS = ['US States', 'Europe', 'Latin America', 'North America', 'Middle East', 'Asia Pacific']

function Badge({ yes }: { yes: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold tracking-wide ${
      yes ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
    }`}>{yes ? 'Yes' : 'No'}</span>
  )
}

function CompliancePanel({ result, onClose }: { result: ComplianceResult; onClose: () => void }) {
  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-serif text-xl text-white capitalize">{result.jurisdiction}</h3>
          <p className="text-[#8A8A8A] text-xs tracking-[0.1em] uppercase mt-1 capitalize">{result.jurisdiction_type}</p>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-[#1A1A1A] rounded-lg transition-colors">
          <X className="w-4 h-4 text-[#8A8A8A]" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-6">
        {[
          ['RON Allowed', result.ron_allowed],
          ['Apostille Required', result.apostille_required],
          ['Hague Convention', result.hague_member],
          ['Witnesses Required', result.witnesses_required],
        ].map(([label, val]) => (
          <div key={String(label)} className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-3">
            <div className="text-[#8A8A8A] text-[10px] uppercase tracking-wider mb-2">{String(label)}</div>
            <Badge yes={Boolean(val)} />
          </div>
        ))}
      </div>

      {result.notes && (
        <div className="bg-[#0A0A0A] border-l-2 border-[#C6A55A] px-4 py-3 rounded-r-lg mb-5">
          <p className="text-[#B0B0B0] text-sm italic leading-relaxed font-light">{result.notes}</p>
        </div>
      )}

      {result.restrictions.length > 0 && (
        <div className="mb-5">
          <p className="text-[#C6A55A] text-[9px] tracking-[0.2em] uppercase font-semibold mb-3">Restrictions</p>
          <div className="space-y-2">
            {result.restrictions.map((r, i) => (
              <div key={i} className="flex gap-2 text-sm text-[#8A8A8A] font-light">
                <span className="text-amber-500 flex-shrink-0 text-xs mt-0.5">⚠</span>{r}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.execution_path.length > 0 && (
        <div className="mb-6">
          <p className="text-[#C6A55A] text-[9px] tracking-[0.2em] uppercase font-semibold mb-3">Execution Path</p>
          <div className="space-y-2">
            {result.execution_path.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-[#C6A55A] font-serif text-xs flex-shrink-0 mt-0.5">{i + 1}.</span>
                <span className="text-[#B0B0B0] text-sm font-light">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        href={`/intake?country=${encodeURIComponent(result.jurisdiction)}`}
        className="flex items-center justify-center gap-2 w-full py-3 bg-[#C6A55A] text-[#0A0A0A] font-medium text-sm rounded-lg hover:bg-[#D4BB7A] transition-colors"
      >
        Begin Execution for {result.jurisdiction.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

export default function MapPage() {
  const [selected, setSelected] = useState<ComplianceResult | null>(null)
  const [loading, setLoading]   = useState(false)
  const [search, setSearch]     = useState('')
  const [custom, setCustom]     = useState('')
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const fetchCompliance = async (key: string) => {
    setLoading(true)
    setActiveKey(key)
    try {
      const res = await fetch('/api/compliance/' + encodeURIComponent(key))
      if (res.ok) {
        const data = await res.json()
        setSelected(data.compliance || data)
      } else {
        // Fallback: use client-side data
        const { validateCompliance } = await import('@/lib/compliance')
        const result = validateCompliance({ country: key, documentType: 'general', executionType: 'ron' })
        setSelected(result as any)
      }
    } catch {
      const { validateCompliance } = await import('@/lib/compliance')
      const result = validateCompliance({ country: key, documentType: 'general', executionType: 'ron' })
      setSelected(result as any)
    } finally { setLoading(false) }
  }

  const filtered = search
    ? JURISDICTIONS.filter(j => j.label.toLowerCase().includes(search.toLowerCase()))
    : JURISDICTIONS

  return (
    <>
      <Header />
      <main className="bg-[#0A0A0A] min-h-screen pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-14">
            <p className="text-[#C6A55A] text-xs tracking-[0.3em] uppercase font-medium mb-4">Compliance Intelligence</p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium text-white mb-6">
              Global Compliance <em className="text-[#C6A55A]">Map</em>
            </h1>
            <p className="text-[#8A8A8A] text-lg font-light max-w-2xl mx-auto">
              Select any jurisdiction to view RON authorization, apostille requirements, witness rules, and your execution path.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_400px] gap-8">

            {/* Left — jurisdiction selector */}
            <div>
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  placeholder="Search jurisdictions…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-[#111111] border border-[#2A2A2A] rounded-lg text-white text-sm placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#C6A55A] transition-colors"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Any country…"
                    value={custom}
                    onChange={e => setCustom(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && custom.trim()) { fetchCompliance(custom.trim().toLowerCase()); setCustom('') }}}
                    className="px-4 py-2.5 bg-[#111111] border border-[#2A2A2A] rounded-lg text-white text-sm placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#C6A55A] transition-colors w-40"
                  />
                  <button
                    onClick={() => { if (custom.trim()) { fetchCompliance(custom.trim().toLowerCase()); setCustom('') }}}
                    className="px-4 py-2.5 border border-[#2A2A2A] text-[#C6A55A] text-xs font-semibold tracking-wider uppercase rounded-lg hover:border-[#C6A55A] transition-colors"
                  >Look Up</button>
                </div>
              </div>

              {REGIONS.map(region => {
                const items = filtered.filter(j => j.region === region)
                if (!items.length) return null
                return (
                  <div key={region} className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[#C6A55A] text-[9px] tracking-[0.2em] uppercase font-semibold">{region}</span>
                      <div className="flex-1 h-px bg-[#1A1A1A]" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {items.map(j => (
                        <button
                          key={j.key}
                          onClick={() => fetchCompliance(j.key)}
                          className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-200 ${
                            activeKey === j.key
                              ? 'border-[#C6A55A] bg-[#C6A55A]/8'
                              : 'border-[#1A1A1A] bg-[#111111] hover:border-[#2A2A2A]'
                          }`}
                        >
                          <span className="text-lg flex-shrink-0">{j.flag}</span>
                          <div>
                            <div className={`text-xs font-medium ${activeKey === j.key ? 'text-[#C6A55A]' : 'text-[#B0B0B0]'}`}>{j.label}</div>
                            <div className="text-[10px] text-[#8A8A8A] uppercase tracking-wider mt-0.5">{j.type}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right — result panel */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              {loading && (
                <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-8 text-center">
                  <div className="w-8 h-8 border-2 border-[#C6A55A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[#8A8A8A] text-sm">Loading compliance data…</p>
                </div>
              )}
              {!loading && !selected && (
                <div className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-10 text-center">
                  <div className="w-14 h-14 rounded-full border border-[#2A2A2A] flex items-center justify-center mx-auto mb-5">
                    <Globe className="w-6 h-6 text-[#C6A55A]" />
                  </div>
                  <p className="text-[#8A8A8A] text-sm italic font-light">Select a jurisdiction to view compliance requirements and execution path.</p>
                </div>
              )}
              {!loading && selected && (
                <CompliancePanel result={selected} onClose={() => { setSelected(null); setActiveKey(null) }} />
              )}
            </div>
          </div>

          {/* Info strip */}
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            {[
              { title: 'RON Authorization by State', desc: 'Florida offers broad Remote Online Notarization (RON) authorization. Colorado and Virginia have active RON programs. Most other states permit traditional notarization for cross-border execution. International matters require in-person execution for apostille eligibility.' },
              { title: 'Hague Convention Members', desc: 'Italy, Spain, Portugal, France, Germany, Greece, Brazil, Argentina, and more are Hague members. U.S. documents for use in these countries require apostille authentication via the Florida Department of State.' },
              { title: 'Non-Hague Countries', desc: 'Mexico, UAE, and others require the full consular legalization chain rather than apostille. These matters require premium coordination and additional authentication steps.' },
            ].map(s => (
              <div key={s.title} className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-6">
                <h3 className="text-[#C6A55A] font-medium mb-3">{s.title}</h3>
                <p className="text-[#8A8A8A] text-sm leading-relaxed font-light">{s.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
