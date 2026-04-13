import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculatePricing, type ExecutionTier, type AddOnType } from '@/lib/pricing'
import { validateCompliance, classifyServiceType } from '@/lib/compliance'

interface IntakeBody {
  name: string
  email: string
  phone: string
  country: string
  document: string
  notes?: string
  tier: ExecutionTier
}

export async function POST(request: NextRequest) {
  try {
    const body: IntakeBody = await request.json()
    
    // Validate required fields
    if (!body.name || !body.email || !body.phone || !body.country || !body.document || !body.tier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }
    
    // Validate tier
    if (!['signature', 'priority', 'executive'].includes(body.tier)) {
      return NextResponse.json(
        { error: 'Invalid execution tier' },
        { status: 400 }
      )
    }
    
    // Run compliance check
    const complianceResult = validateCompliance({
      country: body.country,
      documentType: body.document,
      executionType: 'ron',
      destinationCountry: body.country,
    })
    
    // Classify service type based on compliance
    const serviceType = classifyServiceType(
      body.country,
      body.document,
      complianceResult.requiresApostille
    )
    
    // Calculate pricing
    const addOns: AddOnType[] = []
    if (complianceResult.requiresApostille) {
      addOns.push('apostille')
    }
    
    const pricing = calculatePricing({
      tier: body.tier,
      addOns,
    })
    
    // Create Supabase client
    const supabase = await createClient()
    
    // Generate payment link placeholder (Wise integration would go here)
    const paymentLink = `https://wise.com/pay/business/milanoseal?amount=${pricing.total}`
    
    // Insert deal into database
    const { data: deal, error: dbError } = await supabase
      .from('deals')
      .insert({
        client_name: body.name,
        email: body.email,
        phone: body.phone,
        country: body.country,
        document: body.document,
        notes: body.notes || null,
        service_type: serviceType,
        execution_tier: body.tier,
        amount: pricing.total,
        add_ons: addOns,
        status: 'awaiting_payment',
        payment_status: 'pending',
        payment_link: paymentLink,
        requires_apostille: complianceResult.requiresApostille,
        destination_country: body.country,
      })
      .select('id')
      .single()
    
    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create deal' },
        { status: 500 }
      )
    }
    
    // TODO: Send WhatsApp message via automation
    // This would integrate with WhatsApp Business API
    // For now, we'll log the message that would be sent
    const whatsappMessage = `Your matter has been received and structured for execution.

To proceed, complete the secure payment below:

${paymentLink}

Reference: ${deal.id}

Once received, your matter will move into execution immediately.

Nicholas Milano
The Milano Seal™`
    
    console.log('WhatsApp message to be sent:', whatsappMessage)
    
    return NextResponse.json({
      success: true,
      dealId: deal.id,
      serviceType,
      requiresApostille: complianceResult.requiresApostille,
      complianceWarnings: complianceResult.warnings,
      complianceRecommendations: complianceResult.recommendations,
    })
  } catch (error) {
    console.error('Intake error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
