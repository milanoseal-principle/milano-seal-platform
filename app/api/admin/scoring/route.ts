import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { scoreDeal, scoreAllDeals } from '@/lib/scoringEngine'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { deal_id } = await req.json()

  if (!deal_id) {
    // Score all deals
    const result = await scoreAllDeals()
    return NextResponse.json(result)
  }

  const supabase = createAdminClient()
  const { data: deal } = await supabase.from('deals').select('*').eq('deal_id', deal_id).single()
  if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })

  const scored = scoreDeal(deal)
  await supabase.from('deals').update({ priority_score: scored.priority }).eq('deal_id', deal_id)

  return NextResponse.json({ deal_id, ...scored })
}

export async function GET() {
  const supabase = createAdminClient()
  const { data: deals } = await supabase
    .from('deals')
    .select('deal_id, client_name, country, document_type, amount, payment_status, status, requires_apostille, is_attorney, timeline, created_at')
    .not('status', 'in', '("completed","lost")')

  const scored = (deals || []).map(d => ({ ...d, ...scoreDeal(d) }))
    .sort((a, b) => b.score - a.score)

  return NextResponse.json(scored)
}
