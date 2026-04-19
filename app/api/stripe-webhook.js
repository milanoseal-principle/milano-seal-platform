import Stripe from 'stripe'
import { buffer } from 'micro'
import { createClient } from '@supabase/supabase-js'

export const config = {
  api: {
    bodyParser: false
  }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function logEvent({ userId = null, dealId = null, eventType, source = 'stripe', metadata = {} }) {
  const payload = {
    user_id: userId,
    deal_id: dealId,
    event_type: eventType,
    source,
    metadata
  }

  const { error } = await supabase.from('events').insert(payload)
  if (error) {
    console.error('Failed to log event:', error.message)
  }
}

async function updateDealPaid({ dealId, amountPaid, paymentIntentId, checkoutSessionId, customerId }) {
  const { data: deal, error: fetchError } = await supabase
    .from('deals')
    .select('id, lead_id, status, quoted_amount, paid_amount')
    .eq('id', dealId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(`Failed to fetch deal ${dealId}: ${fetchError.message}`)
  }

  if (!deal) {
    throw new Error(`Deal not found: ${dealId}`)
  }

  const { error: updateError } = await supabase
    .from('deals')
    .update({
      status: 'paid',
      paid_amount: amountPaid
    })
    .eq('id', dealId)

  if (updateError) {
    throw new Error(`Failed to update deal ${dealId}: ${updateError.message}`)
  }

  const paymentInsert = {
    deal_id: dealId,
    amount: amountPaid,
    source_channel: 'stripe',
    stripe_payment_intent_id: paymentIntentId || null,
    stripe_checkout_session_id: checkoutSessionId || null,
    stripe_customer_id: customerId || null
  }

  const { error: paymentError } = await supabase.from('payments').insert(paymentInsert)
  if (paymentError) {
    throw new Error(`Failed to insert payment for ${dealId}: ${paymentError.message}`)
  }

  await logEvent({
    userId: deal.lead_id,
    dealId,
    eventType: 'payment_completed',
    metadata: {
      amount_paid: amountPaid,
      payment_intent_id: paymentIntentId,
      checkout_session_id: checkoutSessionId,
      customer_id: customerId
    }
  })

  return deal
}

async function markDealPaymentFailed({ dealId, reason, paymentIntentId = null, checkoutSessionId = null, customerId = null }) {
  const { data: deal, error: fetchError } = await supabase
    .from('deals')
    .select('id, lead_id')
    .eq('id', dealId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(`Failed to fetch failed deal ${dealId}: ${fetchError.message}`)
  }

  if (!deal) {
    throw new Error(`Deal not found for failed payment: ${dealId}`)
  }

  const { error: updateError } = await supabase
    .from('deals')
    .update({ status: 'payment_failed' })
    .eq('id', dealId)

  if (updateError) {
    throw new Error(`Failed to mark deal payment_failed ${dealId}: ${updateError.message}`)
  }

  await logEvent({
    userId: deal.lead_id,
    dealId,
    eventType: 'payment_failed',
    metadata: {
      reason,
      payment_intent_id: paymentIntentId,
      checkout_session_id: checkoutSessionId,
      customer_id: customerId
    }
  })
}

async function handleCheckoutCompleted(session) {
  const dealId = session.metadata?.deal_id
  if (!dealId) {
    throw new Error('Missing deal_id in checkout.session.completed metadata')
  }

  const amountPaid = typeof session.amount_total === 'number' ? session.amount_total / 100 : 0

  await updateDealPaid({
    dealId,
    amountPaid,
    paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
    checkoutSessionId: session.id,
    customerId: typeof session.customer === 'string' ? session.customer : null
  })

  const executionPayload = {
    deal_id: dealId,
    state: 'READY_FOR_EXECUTION'
  }

  const { error: execError } = await supabase.from('execution_jobs').insert(executionPayload)
  if (execError) {
    console.error(`Failed creating execution job for deal ${dealId}:`, execError.message)
  } else {
    await logEvent({
      dealId,
      eventType: 'execution_job_created',
      metadata: {
        initial_state: 'READY_FOR_EXECUTION',
        source_event: 'checkout.session.completed'
      }
    })
  }
}

async function handleChargeSucceeded(charge) {
  const dealId = charge.metadata?.deal_id
  if (!dealId) return

  const amountPaid = typeof charge.amount === 'number' ? charge.amount / 100 : 0

  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('stripe_payment_intent_id', charge.payment_intent || '')
    .limit(1)

  if (existing && existing.length > 0) {
    return
  }

  await updateDealPaid({
    dealId,
    amountPaid,
    paymentIntentId: typeof charge.payment_intent === 'string' ? charge.payment_intent : null,
    checkoutSessionId: null,
    customerId: typeof charge.customer === 'string' ? charge.customer : null
  })
}

async function handleChargeFailed(charge) {
  const dealId = charge.metadata?.deal_id
  if (!dealId) return

  await markDealPaymentFailed({
    dealId,
    reason: charge.failure_message || 'Charge failed',
    paymentIntentId: typeof charge.payment_intent === 'string' ? charge.payment_intent : null,
    customerId: typeof charge.customer === 'string' ? charge.customer : null
  })
}

async function handleInvoicePaymentSucceeded(invoice) {
  const dealId = invoice.metadata?.deal_id
  if (!dealId) return

  const amountPaid = typeof invoice.amount_paid === 'number' ? invoice.amount_paid / 100 : 0

  await updateDealPaid({
    dealId,
    amountPaid,
    paymentIntentId: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : null,
    checkoutSessionId: null,
    customerId: typeof invoice.customer === 'string' ? invoice.customer : null
  })
}

async function handleInvoicePaymentFailed(invoice) {
  const dealId = invoice.metadata?.deal_id
  if (!dealId) return

  await markDealPaymentFailed({
    dealId,
    reason: 'Invoice payment failed',
    paymentIntentId: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : null,
    customerId: typeof invoice.customer === 'string' ? invoice.customer : null
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const signature = req.headers['stripe-signature']
  if (!signature) {
    return res.status(400).json({ error: 'Missing Stripe signature' })
  }

  let event

  try {
    const rawBody = await buffer(req)
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Stripe signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break

      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object)
        break

      case 'charge.failed':
        await handleChargeFailed(event.data.object)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object)
        break

      case 'customer.created':
        await logEvent({
          eventType: 'stripe_customer_created',
          metadata: {
            stripe_customer_id: event.data.object.id,
            email: event.data.object.email || null
          }
        })
        break

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`)
        break
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('Stripe webhook processing failed:', err)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }h
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Milano Seal Execution Service'
        },
        unit_amount: Math.round(amount * 100)
      },
      quantity: 1
    }
  ],
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/intake`,
  metadata: {
    deal_id: dealId
  }
})
  
  
}
