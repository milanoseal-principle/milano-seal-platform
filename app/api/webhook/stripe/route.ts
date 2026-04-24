import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
  const body = await req.text()

  let event: any
  try { event = JSON.parse(body) } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data?.object
    const dealId = session?.metadata?.deal_id || session?.client_reference_id

    if (dealId) {
      await supabase.from('deals').update({
        payment_status:          'paid',
        invoice_status:          'paid',
        payment_method:          'stripe',
        payment_reference:       session.id,
        payment_amount_received: (session.amount_total || 0) / 100,
        status:                  'scheduled',
      }).eq('id', dealId)
    }
  }

  return NextResponse.json({ received: true })
}
