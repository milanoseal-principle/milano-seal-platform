import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    
    const { data: deal, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Deal not found' },
          { status: 404 }
        )
      }
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch deal' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ deal })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = createAdminClient()
    
    // Validate status if being updated
    const validStatuses = ['new','reviewing','quoted','awaiting_payment','scheduled','in_execution','apostille','shipped','completed','lost']
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }
    
    // Validate payment_status if being updated
    const validPaymentStatuses = ['pending', 'paid', 'failed']
    if (body.payment_status && !validPaymentStatuses.includes(body.payment_status)) {
      return NextResponse.json(
        { error: 'Invalid payment status' },
        { status: 400 }
      )
    }
    
    // Enforce payment rule: Can't move to execution without payment
    if (body.status === 'in_execution' || body.status === 'scheduled') {
      const { data: existingDeal } = await supabase
        .from('deals')
        .select('payment_status')
        .eq('id', id)
        .single()
      
      if (existingDeal?.payment_status !== 'paid' && body.payment_status !== 'paid') {
        return NextResponse.json(
          { error: 'Payment must be confirmed before execution can proceed' },
          { status: 400 }
        )
      }
    }
    
    // Build update object with allowed fields only
    const allowedFields = [
      'status',
      'payment_status',
      'payment_method',
      'payment_reference',
      'payment_amount_received',
      'invoice_status',
      'execution_date',
      'completed_at',
      'followup_24h',
      'followup_72h',
      'follow_up_active',
      'decline_risk',
    ]
    
    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }
    
    const { data: deal, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Deal not found' },
          { status: 404 }
        )
      }
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update deal' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ deal })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
