import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

export const runtime = 'nodejs'

function verifyWiseSignature(payload: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const sig = req.headers.get('x-signature-sha256') || ''
  const secret = process.env.WISE_WEBHOOK_SECRET || ''

  if (secret && !verifyWiseSignature(raw, sig, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: any
  try { event = JSON.parse(raw) } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Wise event types: transfer#StateChange, balance#credit, etc.
  const eventType: string = event.event_type || event.data?.event_type || ''
  const state: string = event.data?.current_state || event.data?.resource?.current_state || ''

  if (eventType === 'transfer#StateChange' && state === 'outgoing_payment_sent') {
    const ref: string = event.data?.resource?.details?.reference || ''
    // Reference format: MS-{deal_id} or deal_id directly
    const deal_id = ref.replace(/^MS-/i, '').trim()

    if (!deal_id) {
      return NextResponse.json({ received: true, skipped: 'no ref' })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('deals')
      .update({
        payment_status: 'paid',
        payment_method: 'wise',
        status: 'scheduled',
        paid_at: new Date().toISOString(),
      })
      .eq('deal_id', deal_id)
      .eq('payment_status', 'unpaid') // idempotent guard

    if (error) {
      console.error('Wise webhook DB error:', error)
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }

    // Auto-trigger schedule step — idempotent, payment-gated internally
    try {
      const origin = req.nextUrl?.origin || process.env.NEXT_PUBLIC_SITE_URL || 'https://themilanoseal.com'
      await fetch(`${origin}/api/runStep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal_id, step: 'schedule' }),
      })
    } catch (e) {
      console.error('Auto runStep failed (non-fatal):', e)
    }

    return NextResponse.json({ received: true, deal_id, action: 'scheduled' })
  }

  return NextResponse.json({ received: true, skipped: 'unhandled event' })
}
