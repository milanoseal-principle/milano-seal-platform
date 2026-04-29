import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeMatter, validateMatter, riskScore } from '@/lib/validation'
import { determineLaneAndPrice } from '@/lib/pricing'
import { generateInvoice } from '@/lib/invoice'
import { validateCompliance } from '@/lib/compliance'
import { parseIntake } from '@/lib/parseIntake'

function genDealId(): string {
  return `MS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
}

async function createStripeLink(deal: { deal_id: string; lane: string; total: number; client_name: string; document_type: string; country: string }): Promise<string | null> {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  try {
    const res = await fetch('https://api.stripe.com/v1/payment_links', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': `The Milano Seal™ — ${deal.lane} Lane`,
        'line_items[0][price_data][product_data][description]': `${deal.document_type} · ${deal.country} · Deal ${deal.deal_id}`,
        'line_items[0][price_data][unit_amount]': String(Math.round(deal.total * 100)),
        'line_items[0][quantity]': '1',
        'metadata[deal_id]': deal.deal_id,
        'metadata[client_name]': deal.client_name,
        'after_completion[type]': 'redirect',
        'after_completion[redirect][url]': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://themilanoseal.com'}/intake/confirmation`,
      }).toString(),
    })
    const data = await res.json()
    return data.url || null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  try {
    let raw = await req.json()

    // If message field present (WhatsApp/IG text), parse it first
    if (raw.message && !raw.document_type) {
      const parsed = parseIntake(raw.message)
      raw = {
        ...raw,
        name: raw.name || parsed.client_name || '',
        client_name: raw.client_name || parsed.client_name || '',
        country: raw.country || parsed.country || '',
        document_type: parsed.document_type,
        signers: raw.signers || parsed.signer_count,
        urgency: raw.urgency || parsed.urgency,
        apostille: raw.apostille ?? parsed.apostille_needed,
      }
    }

    const data = normalizeMatter(raw)

    try { validateMatter(data) } catch (e: any) {
      return NextResponse.json({ error: e.message, code: e.message }, { status: 400 })
    }

    const country = data.country || 'United States'
    let compliance = null
    try {
      compliance = validateCompliance({
        country,
        documentType: data.document_type || 'general',
        executionType: data.mobile ? 'mobile' : 'ron',
        destinationCountry: country,
      })
      if (compliance.apostille_required) data.apostille = true
    } catch {}

    const pricingInput = {
      ...data,
      urgency:      data.urgency      as 'standard' | 'urgent'   | undefined,
      witness_type: data.witness_type as 'ron'      | 'in_person' | undefined,
    }
    const pricing = determineLaneAndPrice(pricingInput)
    const invoice = generateInvoice(pricing.total)
    const decline_risk = riskScore(data)
    const deal_id = genDealId()
    const access_token = randomUUID()
    const client_name = data.name || (raw as Record<string, string>).client_name || ''
    const source = (data as Record<string, unknown>).source_channel as string || (raw as Record<string, string>).source_detail || 'web'

    const payment_link = await createStripeLink({
      deal_id,
      lane: pricing.lane,
      total: pricing.total,
      client_name,
      document_type: data.document_type || '',
      country,
    })

    const supabase = createAdminClient()
    const { data: deal, error } = await supabase.from('deals').insert([{
      client_name,
      email:                 data.email || '',
      phone:                 data.phone || '',
      country,
      document:              data.document_type || '',
      notes:                 data.notes || '',
      execution_tier:        pricing.lane,
      amount:                pricing.total,
      status:                'awaiting_payment',
      payment_status:        'pending',
      payment_method:        'stripe',
      invoice_status:        'proforma',
      invoice_subtotal:      invoice.subtotal,
      invoice_retainer:      invoice.retainer,
      invoice_balance:       invoice.balance,
      invoice_valid_until:   new Date(invoice.valid_until).toISOString(),
      compliance_result:     JSON.stringify(compliance),
      decline_risk,
      follow_up_active:      true,
      followup_schedule:     JSON.stringify(['48h', '96h', '7d']),
      requires_apostille:    data.apostille,
      destination_country:   country,
      source,
      payment_link,
      access_token,
    }]).select().single()

    if (error) console.error('DB insert error:', error)

    return NextResponse.json({
      success:         true,
      deal_id:         deal?.id || deal_id,
      lane:            pricing.lane,
      estimated_value: pricing.total,
      invoice,
      payment_options: invoice.payment_options,
      payment_link,
      execution_stage: 'Awaiting Payment',
      portal_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://themilanoseal.com'}/portal/${access_token}`,
      compliance_result: compliance,
      decline_risk,
      deal,
    })
  } catch (err: any) {
    console.error('Intake error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
