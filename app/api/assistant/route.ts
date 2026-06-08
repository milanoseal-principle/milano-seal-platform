import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { sanitizeTextPayload, enforceSecureProjection } from '@/lib/assistant/assistantSafety';
import { ROLE_PROMPT_REGISTRY, AssistantRoleMode } from '@/lib/assistant/assistantPrompts';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, role, context } = body as {
      message: string;
      role: AssistantRoleMode;
      context?: Record<string, unknown>;
    };

    const safeMode = (['PUBLIC', 'PORTAL', 'DASHBOARD', 'ALLIANCE', 'VA'] as const).includes(role)
      ? role
      : 'PUBLIC';

    const config = ROLE_PROMPT_REGISTRY[safeMode];
    const safeMessage = sanitizeTextPayload(message ?? '');

    let contextBlock = '';
    if (context && safeMode !== 'PUBLIC') {
      const allowedKeys = getAllowedKeys(safeMode);
      const safeContext = enforceSecureProjection(context, allowedKeys);
      contextBlock = `\n\nContext: ${JSON.stringify(safeContext)}`;
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: config.systemPrompt + contextBlock,
      messages: [{ role: 'user', content: safeMessage }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ reply: sanitizeTextPayload(text) });
  } catch {
    return NextResponse.json({ reply: 'The Milano Seal™ concierge is temporarily unavailable. Please try again shortly.' }, { status: 500 });
  }
}

function getAllowedKeys(mode: AssistantRoleMode): string[] {
  switch (mode) {
    case 'PORTAL': return ['matter_id', 'status', 'current_step', 'next_action', 'estimated_timeline'];
    case 'DASHBOARD': return ['matter_id', 'status', 'signer_name', 'destination_country', 'payment_status', 'blocking_reason', 'step_notes'];
    case 'ALLIANCE': return ['referral_id', 'matter_status', 'referred_at', 'commission_status'];
    case 'VA': return ['task_id', 'task_type', 'assigned_to', 'due_date', 'status', 'matter_id'];
    default: return [];
  }
}
