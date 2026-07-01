export interface ScriptTemplate {
  id: string;
  label: string;
  channel: "instagram" | "email" | "attorney" | "referral";
  stage: string;
  body: string;
}

export const inboundScripts: ScriptTemplate[] = [
  {
    id: "instagram-new-inbound",
    label: "Instagram New Inbound",
    channel: "instagram",
    stage: "new_inbound",
    body: "Hey — appreciate you reaching out.\nSend me: • document type • number of signers • destination country\nI'll structure this properly for you.",
  },
];

export const emailTemplates: ScriptTemplate[] = [
  {
    id: "email-intake-confirmation",
    label: "Email Intake Confirmation",
    channel: "email",
    stage: "intake_received",
    body: "Thank you for your request.\nI've received the details and will review the document structure, signer information, and destination requirements before confirming the next step.\nAll matters are reviewed before execution is scheduled.\nMany blessings, Nicholas Milano",
  },
  {
    id: "attorney-intro",
    label: "Attorney Intro",
    channel: "attorney",
    stage: "relationship_intro",
    body: "Hi [Name],\nI work with attorneys handling matters that require international document execution and apostille coordination.\nIf you ever need structured support on multi-signer or cross-border documents, I'd be happy to connect.\nBest, Nicholas",
  },
];

export const referralTemplates: ScriptTemplate[] = [
  {
    id: "partner-referral-followup",
    label: "Referral Follow-Up",
    channel: "referral",
    stage: "partner_referral",
    body: "Thank you for the referral. We'll keep the matter structured through intake, payment-gated execution, apostille coordination, and final packet release.",
  },
];

export function getScriptsByChannel(channel: ScriptTemplate["channel"]): ScriptTemplate[] {
  return [...inboundScripts, ...emailTemplates, ...referralTemplates].filter((script) => script.channel === channel);
}

export function getTemplatesByStage(stage: string): ScriptTemplate[] {
  return [...inboundScripts, ...emailTemplates, ...referralTemplates].filter((script) => script.stage === stage);
}
