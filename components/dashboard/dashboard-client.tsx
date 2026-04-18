'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  Globe,
  Mail,
  Phone,
  Calendar,
  Building2
} from 'lucide-react'

interface Deal {
  id: string
  full_name: string
  email: string
  phone: string | null
  company: string | null
  service_type: string
  document_type: string | null
  document_count: number
  urgency: string
  destination_country: string | null
  stage: string
  payment_status: string
  estimated_value: number | null
  notes: string | null
  source: string | null
  created_at: string
}

interface Stats {
  total: number
  pending: number
  paid: number
  revenue: number
}

interface DashboardClientProps {
  initialDeals: Deal[]
  stats: Stats
}

const stageColors: Record<string, { bg: string; text: string }> = {
  new_lead: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  contacted: { bg: 'bg-cyan-500/10', text: 'text-cyan-500' },
  quote_sent: { bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
  negotiating: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
  documents_received: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
  in_progress: { bg: 'bg-indigo-500/10', text: 'text-indigo-500' },
  completed: { bg: 'bg-green-500/10', text: 'text-green-500' },
  lost: { bg: 'bg-red-500/10', text: 'text-red-500' },
  on_hold: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
}

const stageLabels: Record<string, string> = {
  new_lead: 'New Lead',
  contacted: 'Contacted',
  quote_sent: 'Quote Sent',
  negotiating: 'Negotiating',
  documents_received: 'Docs Received',
  in_progress: 'In Progress',
  completed: 'Completed',
  lost: 'Lost',
  on_hold: 'On Hold',
}

const serviceTypeLabels: Record<string, string> = {
  apostille: 'Apostille',
  notary: 'Notary',
  ron: 'RON',
  signing_agent: 'Signing Agent',
  document_retrieval: 'Doc Retrieval',
  translation: 'Translation',
  other: 'Other',
}

export function DashboardClient({ initialDeals, stats }: DashboardClientProps) {
  const [deals, setDeals] = useState(initialDeals)
  const [searchQuery, setSearchQuery] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch = 
      deal.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.destination_country?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStage = stageFilter === 'all' || deal.stage === stageFilter
    
    return matchesSearch && matchesStage
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/deals')
      const data = await response.json()
      if (data.deals) {
        setDeals(data.deals)
      }
    } catch (error) {
      console.error('Failed to refresh:', error)
    }
    setIsRefreshing(false)
  }

  const updateDealStage = async (dealId: string, newStage: string) => {
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })
      
      if (response.ok) {
        setDeals(deals.map(d => 
          d.id === dealId ? { ...d, stage: newStage } : d
        ))
      }
    } catch (error) {
      console.error('Failed to update stage:', error)
    }
  }

  const updatePaymentStatus = async (dealId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: newStatus }),
      })
      
      if (response.ok) {
        setDeals(deals.map(d => 
          d.id === dealId ? { ...d, payment_status: newStatus } : d
        ))
      }
    } catch (error) {
      console.error('Failed to update payment status:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-[#2A2A2A] bg-[#0A0A0A]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 text-[#B0B0B0] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Image
                src="/logo.png"
                alt="The Milano Seal"
                width={36}
                height={36}
                className="object-contain"
              />
              <div>
                <h1 className="font-serif text-xl font-medium text-white">
                  Operator Dashboard
                </h1>
                <p className="text-sm text-[#B0B0B0]">Matter Management</p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[#B0B0B0] hover:text-white border border-[#2A2A2A] rounded-lg transition-colors hover:border-[#C6A55A]/50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#C6A55A]/10">
                <FileText className="w-5 h-5 text-[#C6A55A]" />
              </div>
              <span className="text-sm text-[#B0B0B0] uppercase tracking-wide">Total Matters</span>
            </div>
            <p className="text-3xl font-serif font-medium text-white">{stats.total}</p>
          </div>
          
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <span className="text-sm text-[#B0B0B0] uppercase tracking-wide">Pending</span>
            </div>
            <p className="text-3xl font-serif font-medium text-white">{stats.pending}</p>
          </div>
          
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-sm text-[#B0B0B0] uppercase tracking-wide">Paid</span>
            </div>
            <p className="text-3xl font-serif font-medium text-white">{stats.paid}</p>
          </div>
          
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#C6A55A]/10">
                <DollarSign className="w-5 h-5 text-[#C6A55A]" />
              </div>
              <span className="text-sm text-[#B0B0B0] uppercase tracking-wide">Revenue</span>
            </div>
            <p className="text-3xl font-serif font-medium text-white">
              ${stats.revenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0B0B0]" />
            <input
              type="text"
              placeholder="Search by name, email, company, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#111111] border border-[#2A2A2A] rounded-lg text-white placeholder:text-[#B0B0B0]/50 focus:outline-none focus:border-[#C6A55A] transition-colors"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0B0B0]" />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="pl-10 pr-8 py-3 bg-[#111111] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-[#C6A55A] transition-colors appearance-none cursor-pointer min-w-[200px]"
            >
              <option value="all">All Stages</option>
              {Object.entries(stageLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Deals Table */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A2A2A]">
                  <th className="text-left px-6 py-4 text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Client</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Service</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Country</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Urgency</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Value</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Stage</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Payment</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="w-10 h-10 text-[#2A2A2A]" />
                        <p className="text-[#B0B0B0]">No matters found.</p>
                        <p className="text-sm text-[#B0B0B0]/60">New intake submissions will appear here.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal) => (
                    <tr key={deal.id} className="border-b border-[#2A2A2A] hover:bg-[#1A1A1A] transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{deal.full_name}</p>
                          {deal.company && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-[#B0B0B0]" />
                              <span className="text-xs text-[#B0B0B0]">{deal.company}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <a
                              href={`mailto:${deal.email}`}
                              className="flex items-center gap-1 text-xs text-[#B0B0B0] hover:text-[#C6A55A] transition-colors"
                            >
                              <Mail className="w-3 h-3" />
                              <span>{deal.email}</span>
                            </a>
                            {deal.phone && (
                              <a
                                href={`tel:${deal.phone}`}
                                className="flex items-center gap-1 text-xs text-[#B0B0B0] hover:text-[#C6A55A] transition-colors"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{deal.phone}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#C6A55A]" />
                          <span className="text-white text-sm">
                            {serviceTypeLabels[deal.service_type] || deal.service_type}
                          </span>
                        </div>
                        {deal.document_type && (
                          <span className="text-xs text-[#B0B0B0] mt-1 block capitalize">
                            {deal.document_type.replace(/_/g, ' ')}
                          </span>
                        )}
                        {deal.document_count > 1 && (
                          <span className="text-xs text-[#C6A55A] mt-0.5 block">
                            {deal.document_count} documents
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {deal.destination_country ? (
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-[#B0B0B0]" />
                            <span className="text-[#B0B0B0] text-sm">{deal.destination_country}</span>
                          </div>
                        ) : (
                          <span className="text-[#B0B0B0]/50 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded capitalize ${
                          deal.urgency === 'emergency' ? 'bg-red-500/10 text-red-500' :
                          deal.urgency === 'same_day' ? 'bg-orange-500/10 text-orange-500' :
                          deal.urgency === 'rush' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-[#2A2A2A] text-[#B0B0B0]'
                        }`}>
                          {deal.urgency?.replace(/_/g, ' ') || 'Standard'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">
                          {deal.estimated_value ? `$${Number(deal.estimated_value).toLocaleString()}` : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={deal.stage}
                          onChange={(e) => updateDealStage(deal.id, e.target.value)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border-0 cursor-pointer ${
                            stageColors[deal.stage]?.bg || 'bg-gray-500/10'
                          } ${stageColors[deal.stage]?.text || 'text-gray-500'}`}
                        >
                          {Object.entries(stageLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={deal.payment_status || 'pending'}
                          onChange={(e) => updatePaymentStatus(deal.id, e.target.value)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border-0 cursor-pointer ${
                            deal.payment_status === 'paid' 
                              ? 'bg-green-500/10 text-green-500'
                              : deal.payment_status === 'failed'
                              ? 'bg-red-500/10 text-red-500'
                              : deal.payment_status === 'refunded'
                              ? 'bg-purple-500/10 text-purple-500'
                              : 'bg-yellow-500/10 text-yellow-500'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-[#B0B0B0] text-sm">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(deal.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Showing count */}
        <p className="text-sm text-[#B0B0B0] mt-4">
          Showing {filteredDeals.length} of {deals.length} matters
        </p>
      </main>
    </div>
  )
}
