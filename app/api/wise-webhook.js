import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function logEvent({ userId = null, dealId = null, eventType, metadata = {} }) {
  await supabase.from('events').insert({
    user_id: userId,
    deal_id: dealId,
    event_type: eventType,
    source: 'wise',
    metadata
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  try {
    const event = req.body

    console.log('WISE EVENT:', event)

    // Core event
    if (event.event_type === 'transfers#state-change') {
      const transfer = event.data

      const dealId = transfer.details?.reference || transfer.reference

      if (!dealId) {
        console.log('No deal_id reference found')
        return res.status(200).json({ received: true })
      }

      const state = transfer.status

      // COMPLETED (money moved)
      if (state === 'outgoing_payment_sent' || state === 'completed') {
        await supabase
          .from('execution_jobs')
          .update({ state: 'PAID_OUT' })
          .eq('deal_id', dealId)

        await logEvent({
          dealId,
          eventType: 'wise_transfer_completed',
          metadata: {
            amount: transfer.sourceValue,
            currency: transfer.sourceCurrency,
            transfer_id: transfer.id
          }
        })
      }

      // FAILED
      if (state === 'failed' || state === 'cancelled') {
        await logEvent({
          dealId,
          eventType: 'wise_transfer_failed',
          metadata: {
            reason: transfer.statusMessage,
            transfer_id: transfer.id
          }
        })
      }
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('WISE WEBHOOK ERROR:', err)
    return res.status(500).json({ error: 'Webhook failed' })
  }
}
