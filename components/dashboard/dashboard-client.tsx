'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
  LogOut
} from 'lucide-react'

interface Deal {
  id: string
  client_name: string
  email: string
  phone: string
  country: string
  document: string
  notes: string | null
  service_type: string
  execution_tier: string
  amount: number
  status: string
  payment_status: string
  requires_apostille: boolean
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

const statusColors: Record<string, { bg: string; text: string }> = {
  awaiting_payment: { bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
  scheduled: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  in_execution: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
  apostille: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
  completed: { bg: 'bg-green-500/10', text: 'text-green-500' },
  lost: { bg: 'bg-red-500/10', text: 'text-red-500' },
}

const statusLabels: Record<string, string> = {
  awaiting_payment: 'Awaiting Payment',
  scheduled: 'Scheduled',
  in_execution: 'In Execution',
  apostille: 'Apostille',
  completed: 'Completed',
  lost: 'Lost',
}

export function DashboardClient({ initialDeals, stats }: DashboardClientProps) {
  const [deals, setDeals] = useState(initialDeals)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/operator/login')
  }

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch = 
      deal.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.document.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || deal.status === statusFilter
    
    return matchesSearch && matchesStatus
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

  const updateDealStatus = async (dealId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.ok) {
        setDeals(deals.map(d => 
          d.id === dealId ? { ...d, status: newStatus } : d
        ))
      }
    } catch (error) {
      console.error('Failed to update status:', error)
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
              <div>
                <h1 className="font-serif text-xl font-medium text-white">
                  Dashboard
                </h1>
                <p className="text-sm text-[#B0B0B0]">Matter Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm text-[#B0B0B0] hover:text-white transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-[#B0B0B0] hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#1A1A1A]">
                <FileText className="w-5 h-5 text-[#C6A55A]" />
              </div>
              <span className="text-sm text-[#B0B0B0]">Total Matters</span>
            </div>
            <p className="text-3xl font-medium text-white">{stats.total}</p>
          </div>
          
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#1A1A1A]">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <span className="text-sm text-[#B0B0B0]">Awaiting Payment</span>
            </div>
            <p className="text-3xl font-medium text-white">{stats.pending}</p>
          </div>
          
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#1A1A1A]">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-sm text-[#B0B0B0]">Paid</span>
            </div>
            <p className="text-3xl font-medium text-white">{stats.paid}</p>
          </div>
          
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#1A1A1A]">
                <DollarSign className="w-5 h-5 text-[#C6A55A]" />
              </div>
              <span className="text-sm text-[#B0B0B0]">Revenue</span>
            </div>
            <p className="text-3xl font-medium text-white">
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
              placeholder="Search by name, email, or document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#111111] border border-[#2A2A2A] rounded-lg text-white placeholder:text-[#B0B0B0]/50 focus:outline-none focus:border-[#C6A55A] transition-colors"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0B0B0]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-3 bg-[#111111] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-[#C6A55A] transition-colors appearance-none cursor-pointer min-w-[200px]"
            >
              <option value="all">All Statuses</option>
              {Object.entries(statusLabels).map(([value, label]) => (
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
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#B0B0B0]">Client</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#B0B0B0]">Document</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#B0B0B0]">Country</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#B0B0B0]">Tier</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#B0B0B0]">Amount</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#B0B0B0]">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#B0B0B0]">Payment</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#B0B0B0]">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[#B0B0B0]">
                      No matters found.
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal) => (
                    <tr key={deal.id} className="border-b border-[#2A2A2A] hover:bg-[#1A1A1A] transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{deal.client_name}</p>
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
                          <span className="text-white text-sm">{deal.document}</span>
                        </div>
                        {deal.requires_apostille && (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs text-orange-500">
                            <Globe className="w-3 h-3" />
                            Apostille Required
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#B0B0B0] text-sm">{deal.country}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium text-[#C6A55A] bg-[#C6A55A]/10 rounded capitalize">
                          {deal.execution_tier}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">
                          ${Number(deal.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={deal.status}
                          onChange={(e) => updateDealStatus(deal.id, e.target.value)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border-0 cursor-pointer ${
                            statusColors[deal.status]?.bg || 'bg-gray-500/10'
                          } ${statusColors[deal.status]?.text || 'text-gray-500'}`}
                        >
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={deal.payment_status}
                          onChange={(e) => updatePaymentStatus(deal.id, e.target.value)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border-0 cursor-pointer ${
                            deal.payment_status === 'paid' 
                              ? 'bg-green-500/10 text-green-500'
                              : deal.payment_status === 'failed'
                              ? 'bg-red-500/10 text-red-500'
                              : 'bg-yellow-500/10 text-yellow-500'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
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
