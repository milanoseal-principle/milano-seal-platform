import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
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
      console.error('[v0] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch deal' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ deal })
  } catch (error) {
    console.error('[v0] API error:', error)
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
    const supabase = await createClient()
    
    // Valid stages based on database schema
    const validStages = [
      'new_lead', 'contacted', 'quote_sent', 'negotiating',
      'documents_received', 'in_progress', 'completed', 'lost', 'on_hold'
    ]
    if (body.stage && !validStages.includes(body.stage)) {
      return NextResponse.json(
        { error: 'Invalid stage' },
        { status: 400 }
      )
    }
    
    // Valid payment statuses based on database schema
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded']
    if (body.payment_status && !validPaymentStatuses.includes(body.payment_status)) {
      return NextResponse.json(
        { error: 'Invalid payment status' },
        { status: 400 }
      )
    }
    
    // Enforce payment rule: Can't move to in_progress without payment
    if (body.stage === 'in_progress') {
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
      'stage',
      'payment_status',
      'estimated_value',
      'actual_value',
      'notes',
      'urgency',
      'assigned_to',
    ]
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }
    
    if (Object.keys(updateData).length === 1) { // Only updated_at
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
      console.error('[v0] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update deal' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ deal })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
