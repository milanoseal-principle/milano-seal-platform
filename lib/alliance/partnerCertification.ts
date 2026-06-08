export type CertificationStep = {
  id: string;
  label: string;
  description: string;
  attestation_prompt: string;
  requires_operator_confirmation: boolean;
};

export const CERTIFICATION_STEPS: CertificationStep[] = [
  {
    id: 'identity_confirmed',
    label: 'Identity Confirmation',
    description: 'Confirm your legal name and contact information are accurate.',
    attestation_prompt: 'I confirm that my name, business name, and contact information are accurate and current.',
    requires_operator_confirmation: true,
  },
  {
    id: 'service_scope_reviewed',
    label: 'Service Scope Review',
    description: 'Review what The Milano Seal™ handles and what you refer.',
    attestation_prompt: 'I understand that The Milano Seal™ handles execution, notarization, apostille, and delivery. I refer clients — I do not handle document execution.',
    requires_operator_confirmation: false,
  },
  {
    id: 'document_handling_attested',
    label: 'Document Handling Attestation',
    description: 'Confirm you do not handle client documents on our behalf.',
    attestation_prompt: 'I confirm that I will not take physical or digital possession of client documents on behalf of The Milano Seal™. All documents are handled directly by The Milano Seal™.',
    requires_operator_confirmation: false,
  },
  {
    id: 'client_communication_attested',
    label: 'Client Communication',
    description: 'Confirm client communication standards.',
    attestation_prompt: 'I confirm that I will not make representations about timelines, pricing, or document validity on behalf of The Milano Seal™ without written approval.',
    requires_operator_confirmation: false,
  },
  {
    id: 'referral_routing_confirmed',
    label: 'Referral Routing',
    description: 'Confirm how you route referrals.',
    attestation_prompt: 'I confirm that I route all referrals through the approved intake process and will not bypass the intake review step.',
    requires_operator_confirmation: false,
  },
  {
    id: 'security_attestation_signed',
    label: 'Security Attestation',
    description: 'Confirm data handling responsibilities.',
    attestation_prompt: 'I confirm that I will not share, store, or transmit client personal information except as required to complete the referral intake.',
    requires_operator_confirmation: true,
  },
  {
    id: 'compliance_acknowledgement_signed',
    label: 'Compliance Acknowledgement',
    description: 'Acknowledge compliance requirements.',
    attestation_prompt: 'I acknowledge that I am responsible for compliance with all applicable laws in my jurisdiction regarding referral of legal document services.',
    requires_operator_confirmation: true,
  },
];

export type CertificationStatus = 'ROUTING_LOCKED' | 'ROUTING_ELIGIBLE' | 'ACTIVE_PARTNER';

export function computeCertificationStatus(completedSteps: string[]): CertificationStatus {
  const all = CERTIFICATION_STEPS.map((s) => s.id);
  if (completedSteps.length === 0) return 'ROUTING_LOCKED';
  if (all.every((s) => completedSteps.includes(s))) return 'ROUTING_ELIGIBLE';
  return 'ROUTING_LOCKED';
}
