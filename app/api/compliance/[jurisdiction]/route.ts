import { NextRequest, NextResponse } from 'next/server'
import { validateCompliance } from '@/lib/compliance'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jurisdiction: string }> }
) {
  const { jurisdiction } = await params
  const key = decodeURIComponent(jurisdiction).toLowerCase()

  const compliance = validateCompliance({
    country: key,
    documentType: 'general',
    executionType: 'ron',
  })

  return NextResponse.json({ success: true, compliance })
}
