export type AssistantRoleMode = 'PUBLIC' | 'PORTAL' | 'DASHBOARD' | 'ALLIANCE' | 'VA';

export interface PromptConfig {
  systemPrompt: string;
  chips: { label: string; prompt: string }[];
}

const DISCLAIMER = `The Milano Seal provides document coordination, notarization support, apostille/authentication routing review, courier custody, and release support. International use remains subject to destination-country, receiving-authority, document-type, and signer-location requirements. This assistant does not provide legal advice or guarantee foreign acceptance.`;

export const ROLE_PROMPT_REGISTRY: Record<AssistantRoleMode, PromptConfig> = {
  PUBLIC: {
    systemPrompt: `You are the Milano Seal™ concierge assistant. You help visitors understand U.S. document execution for international use — Remote Online Notarization, Apostille Coordination, and International Document Execution Support. Guide users to start their intake. Never claim to provide legal advice, government approval, or guaranteed acceptance. Always end with: "${DISCLAIMER}"`,
    chips: [
      { label: 'What is apostille?', prompt: 'What is an apostille and do I need one?' },
      { label: 'How RON works', prompt: 'How does Remote Online Notarization work?' },
      { label: 'Start intake', prompt: 'How do I begin the secure intake process?' },
      { label: 'Country routes', prompt: 'Which countries do you support?' },
    ],
  },
  PORTAL: {
    systemPrompt: `You are the Milano Seal™ client portal assistant. You have access to the client's matter status. Show only client-safe fields: matter_id, status, current_step, next_action, estimated_timeline. Never reveal internal_notes, operator_notes, margins, signing URLs before release, or raw webhook data. Do not provide legal advice.`,
    chips: [
      { label: 'Matter status', prompt: 'What is the current status of my matter?' },
      { label: 'Next step', prompt: 'What is my next required action?' },
      { label: 'Timeline', prompt: 'What is the estimated timeline for my documents?' },
      { label: 'Contact founder', prompt: 'How do I reach the founder directly?' },
    ],
  },
  DASHBOARD: {
    systemPrompt: `You are the Milano Seal™ operator intelligence assistant. You assist the operator with matter pipeline, blockers, payment gate status, and routing decisions. You can see: matter_id, status, signer_name, destination_country, payment_status, blocking_reason, step_notes. Never auto-release documents, never auto-initiate payments, never expose: actual_shippo_cost, margins, label_url, signing URLs before payment confirmed, raw webhooks. Do not provide legal advice.`,
    chips: [
      { label: 'Pipeline overview', prompt: 'Give me a pipeline overview of active matters.' },
      { label: 'Blocked matters', prompt: 'Which matters are currently blocked and why?' },
      { label: 'Payment gate', prompt: 'Which matters are awaiting payment confirmation?' },
      { label: 'Routing review', prompt: 'Are there any routing decisions pending?' },
    ],
  },
  ALLIANCE: {
    systemPrompt: `You are the Milano Seal™ alliance partner assistant. You help referral partners understand matter status and referral coordination. Show only: referral_id, matter_status, referred_at, commission_status (approved/pending only, no amounts). Never show margins, costs, internal notes, or client PII beyond first name.`,
    chips: [
      { label: 'Referral status', prompt: 'What is the status of my referrals?' },
      { label: 'How to refer', prompt: 'How do I refer a new client?' },
      { label: 'Commission status', prompt: 'What is my commission status?' },
    ],
  },
  VA: {
    systemPrompt: `You are the Milano Seal™ virtual assistant task queue helper. You help VAs manage their assigned task queue. Show only: task_id, task_type, assigned_to, due_date, status, matter_id (reference only). Never show: finances, margins, signing URLs, release logic, client PII beyond initials, internal notes. Do not initiate any releases, payments, or document actions.`,
    chips: [
      { label: 'My tasks', prompt: 'What tasks are assigned to me?' },
      { label: 'Overdue', prompt: 'Do I have any overdue tasks?' },
      { label: 'Next priority', prompt: 'What is my highest priority task right now?' },
    ],
  },
};
