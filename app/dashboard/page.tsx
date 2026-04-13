import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | The Milano Seal™',
  description: 'Admin dashboard for managing document execution matters.',
  robots: 'noindex, nofollow',
}

export const dynamic = 'force-dynamic'

async function getDeals() {
  const supabase = await createClient()
  
  const { data: deals, error } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  
  if (error) {
    console.error('Error fetching deals:', error)
    return []
  }
  
  return deals || []
}

async function getStats() {
  const supabase = await createClient()
  
  const { data: deals } = await supabase
    .from('deals')
    .select('status, payment_status, amount')
  
  if (!deals) return { total: 0, pending: 0, paid: 0, revenue: 0 }
  
  const total = deals.length
  const pending = deals.filter(d => d.status === 'awaiting_payment').length
  const paid = deals.filter(d => d.payment_status === 'paid').length
  const revenue = deals
    .filter(d => d.payment_status === 'paid')
    .reduce((sum, d) => sum + Number(d.amount), 0)
  
  return { total, pending, paid, revenue }
}

export default async function DashboardPage() {
  const [deals, stats] = await Promise.all([getDeals(), getStats()])
  
  return <DashboardClient initialDeals={deals} stats={stats} />
}
