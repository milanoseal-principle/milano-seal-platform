// FINAL CANONICAL INTAKE — MILANO SEAL OS (LOCKED)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculatePrice } from '@/lib/pricingEngine'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function genDealId() {
  return `MS-${Date.now()}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      name,
      email,
      phone,
      country,
      document_type,
      urgency,
      apostille_required,
      client_doc_ready
    } = body

    // REQUIRED VALIDATION
    if (!name || !email || !country || !document_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // PRICING ENGINE
    const { lane, price } = calculatePrice({
      country,
      urgency,
      apostille_required,
      client_doc_ready
    })

    const deal_id = genDealId()

    const { data, error } = await supabase
      .from('deals')
      .insert([
        {
          id: deal_id,
          client_name: name,
          email,
          phone,
          country,
          document_type,
          lane,
          total_price: price,
          status: 'awaiting_payment',
          payment_status: 'pending',
          payment_method: 'wise',
          payment_reference: deal_id
        }
      ])
      .select()
      .single()

    if (error || !data) {
      console.error('Insert failed', error)
      return NextResponse.json(
        { error: 'Insert failed' },
        { status: 500 }
      )
    }

    // WISE PAYMENT URL
    const payment_url = `${process.env.PAYMENT_PROVIDER_URL}?ref=${deal_id}`

    return NextResponse.json({
      success: true,
      deal_id,
      lane,
      price,
      payment_url
    })

  } catch (err) {
    console.error('Intake error:', err)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}