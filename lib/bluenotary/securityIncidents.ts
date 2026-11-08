import { z } from 'zod';

const reference = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9:_/.-]*$/);
export const RON_INCIDENT_ROLES = new Set(['founder','founder_admin','admin','admin_operator','superadmin','ops_manager']);
const notification = z.object({ reference, sent_at: z.string().datetime({offset:true}) }).strict();
export const ronIncidentSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  detected_at: z.string().datetime({offset:true}),
  summary: z.string().trim().min(10).max(2000),
  status: z.enum(['INCIDENT_OPENED','ROOT_CAUSE_REVIEW','CORRECTION_PLAN_DRAFTED','FINAL_QA_COMPLETED','CLOSED']),
  evidence: z.object({
    category: z.enum(['ELECTRONIC_SEAL','ELECTRONIC_SIGNATURE','RON_CREDENTIALS','JOURNAL','RECORDING','PROVIDER_CREDENTIALS']),
    containment: z.enum(['OPEN','CONTAINED','REMEDIATED']),
    responsible_operator: z.string().uuid(),
    authority_basis_reference: reference,
    required_authorities: z.array(z.enum(['FLORIDA_DEPARTMENT_OF_STATE','LAW_ENFORCEMENT'])).min(1).max(2),
    notifications: z.object({ FLORIDA_DEPARTMENT_OF_STATE: notification.optional(), LAW_ENFORCEMENT: notification.optional() }).strict(),
    remediation_reference: reference.optional(),
    credential_action_reference: reference.optional(),
    closure_reference: reference.optional(),
  }).strict(),
}).strict();

// Applicable seven-day compromise control; derived from immutable detection time.
// This reports the evidence state and never sends or infers a notification.
export function ronIncidentDeadline(detected: string, evidence: z.infer<typeof ronIncidentSchema>['evidence'], now = Date.now()) {
  const start = Date.parse(detected);
  if (!Number.isFinite(start) || start > now) throw new Error('INVALID_DETECTION_TIME');
  const due = start + 7 * 24 * 60 * 60 * 1000;
  const sent = evidence.required_authorities.map(authority => evidence.notifications[authority]);
  const complete = sent.every(value => value && Number.isFinite(Date.parse(value.sent_at)) && Date.parse(value.sent_at)>=start && Date.parse(value.sent_at)<=now && reference.safeParse(value.reference).success);
  return { due_at: new Date(due).toISOString(), state: complete ? (sent.every(value => Date.parse(value!.sent_at)<=due) ? 'EVIDENCED_ON_TIME' : 'EVIDENCED_LATE') : now > due ? 'OVERDUE' : 'PENDING' };
}
