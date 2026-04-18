import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, country, document, notes, tier } = body

    // Validate required fields
    if (!name || !email || !phone || !country || !document) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Insert into deals table
    const { data, error } = await supabase
      .from('deals')
      .insert({
        name,
        email,
        phone,
        document_type: document,
        country,
        notes,
        tier,
        status: 'new',
        payment_status: 'unpaid',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: 'Failed to create intake record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      dealId: data.id,
      message: 'Intake submitted successfully',
    })
  } catch (err) {
    console.error('Intake API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
