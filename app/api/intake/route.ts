import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Valid enum values based on database schema
const validServiceTypes = ['apostille', 'notary', 'ron', 'signing_agent', 'document_retrieval', 'translation', 'other']
const validDocumentTypes = ['birth_certificate', 'marriage_certificate', 'death_certificate', 'divorce_decree', 'diploma', 'transcript', 'power_of_attorney', 'affidavit', 'corporate_document', 'fbi_background_check', 'court_document', 'medical_record', 'immigration_document', 'real_estate', 'other']
const validUrgencyLevels = ['standard', 'rush', 'same_day', 'emergency']

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      phone, 
      country, 
      document, 
      notes, 
      tier,
      company,
      serviceType,
      urgency,
      documentCount,
      source,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Map tier to service_type if provided
    let mappedServiceType = serviceType || 'apostille'
    if (tier === 'signature') mappedServiceType = 'notary'
    if (tier === 'priority') mappedServiceType = 'apostille'
    if (tier === 'executive') mappedServiceType = 'ron'
    
    // Ensure service type is valid
    if (!validServiceTypes.includes(mappedServiceType)) {
      mappedServiceType = 'other'
    }

    // Map document type
    let mappedDocType = null
    if (document) {
      const docLower = document.toLowerCase().replace(/\s+/g, '_')
      if (validDocumentTypes.includes(docLower)) {
        mappedDocType = docLower
      } else if (document.toLowerCase().includes('affidavit')) {
        mappedDocType = 'affidavit'
      } else if (document.toLowerCase().includes('power')) {
        mappedDocType = 'power_of_attorney'
      } else {
        mappedDocType = 'other'
      }
    }

    // Map urgency
    let mappedUrgency = urgency || 'standard'
    if (!validUrgencyLevels.includes(mappedUrgency)) {
      mappedUrgency = 'standard'
    }

    const supabase = await createClient()

    // Insert into deals table with correct column names
    const { data, error } = await supabase
      .from('deals')
      .insert({
        full_name: name,
        email,
        phone: phone || null,
        company: company || null,
        service_type: mappedServiceType,
        document_type: mappedDocType,
        document_count: documentCount || 1,
        urgency: mappedUrgency,
        destination_country: country || null,
        stage: 'new_lead',
        notes: notes || null,
        source: source || 'website_intake',
        utm_source: utmSource || null,
        utm_medium: utmMedium || null,
        utm_campaign: utmCampaign || null,
      })
      .select('id, full_name, email, service_type, stage')
      .single()

    if (error) {
      console.error('[v0] Supabase insert error:', error)
      return NextResponse.json(
        { error: 'Failed to create intake record', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      dealId: data.id,
      deal: data,
      message: 'Intake submitted successfully. Our team will contact you within 24 hours.',
    })
  } catch (err) {
    console.error('[v0] Intake API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
