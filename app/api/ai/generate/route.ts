import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPTS: Record<string, string> = {
  dm: `You are The Milano Seal™ outreach specialist. Write concise, authoritative DMs for Instagram, WhatsApp, LinkedIn, Facebook.
Brand voice: precise, international, premium. Never casual. Never salesy.
Output message text only. Max 150 words.`,
  content: `You are The Milano Seal™ content strategist for a luxury international document execution platform.
Topics: apostille, notarization, Hague Convention, international documents.
Tone: authoritative, educational, premium. No filler. Output content only.`,
  intake: `You are The Milano Seal™ intake classifier. Extract and return JSON only from client messages:
{"client_name":null|string,"country":null|string,"document_type":string,"signer_count":number,"urgency":"standard"|"urgent"|"expedited","apostille_needed":boolean}
JSON only. No explanation.`,
  general: `You are The Milano Seal™ AI operator. Help Nicholas Milano manage international document execution.
Be precise, professional, actionable. Focus on deals, client communication, execution coordination.`,
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, system, type = 'general' } = await req.json()
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'AI not configured — add ANTHROPIC_API_KEY to Vercel env vars' }, { status: 503 })

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: system || SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.general,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()
    const text = data.content?.[0]?.text || ''

    if (type === 'intake') {
      try {
        const clean = text.replace(/```json|```/g, '').trim()
        return NextResponse.json({ success: true, parsed: JSON.parse(clean), raw: text })
      } catch {}
    }

    return NextResponse.json({ success: true, text })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
