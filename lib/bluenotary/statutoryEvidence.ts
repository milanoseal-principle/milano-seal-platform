import { z } from 'zod';
// Opaque references only: no signed URLs, raw IDs, images, credentials or KBA answers.
export const evidenceReference = z.string().trim().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9:_/.-]*$/);
const verified = z.object({ status: z.literal('VERIFIED'), reference: evidenceReference }).strict();
const applicableProof = z.union([verified, z.object({ status: z.literal('NOT_REQUIRED'), basis_reference: evidenceReference }).strict()]);
export const ronStatutoryEvidenceSchema = z.object({
  provider_reference: evidenceReference,
  provider_evidence_reference: evidenceReference,
  notary_identity_reference: evidenceReference,
  commission_reference: evidenceReference,
  commission_jurisdiction: evidenceReference,
  commission_expires_at: z.string().datetime({ offset: true }),
  act_count: z.number().int().min(1).max(1000),
  qc_status: z.literal('PASSED'),
  notarial_act: z.enum(['acknowledgment', 'jurat', 'oath_affirmation', 'signature_witnessing', 'other']),
  executed_at: z.string().datetime({ offset: true }),
  certificate_reference: evidenceReference,
  seal_signature_reference: evidenceReference,
  journal_reference: evidenceReference,
  recording_reference: evidenceReference,
  recording_retention_reference: evidenceReference,
  recording_retained_until: z.string().datetime({ offset: true }),
  external_provider_fee: z.object({ classification: z.literal('EXTERNAL_PROVIDER_NOTARIAL_FEE'), reference: evidenceReference }).strict().optional(),
  custody_reference: evidenceReference,
  qc_reference: evidenceReference,
  signed_document_ids: z.array(z.string().uuid()).min(1).max(100),
  signers: z.array(z.object({
    signer_id: z.string().uuid(), location_reference: evidenceReference,
    identity_proofing: verified, credential_analysis: applicableProof, kba: applicableProof,
    awareness: verified, willingness: verified, oath: applicableProof,
  }).strict()).min(1).max(100),
  witness_applicability: z.object({status:z.enum(['REQUIRED','NOT_REQUIRED']),basis_reference:evidenceReference}).strict(),
  witnesses: z.array(z.object({ identity_reference: evidenceReference, evidence_reference: evidenceReference }).strict()).max(100),
}).strict().superRefine((value, ctx) => {
  if (Date.parse(value.commission_expires_at) < Date.parse(value.executed_at)) ctx.addIssue({code:'custom',message:'Commission expired at execution',path:['commission_expires_at']});
  if (new Set(value.signed_document_ids).size !== value.signed_document_ids.length) ctx.addIssue({code:'custom',message:'Duplicate document version',path:['signed_document_ids']});
  if (new Set(value.signers.map(s=>s.signer_id)).size !== value.signers.length) ctx.addIssue({code:'custom',message:'Duplicate signer',path:['signers']});
  if (Date.parse(value.recording_retained_until) <= Date.parse(value.executed_at)) ctx.addIssue({code:'custom',message:'Recording retention must extend beyond execution',path:['recording_retained_until']});
  for (const [index, signer] of value.signers.entries()) if (['jurat','oath_affirmation'].includes(value.notarial_act) && signer.oath.status !== 'VERIFIED') ctx.addIssue({code:'custom',message:'Oath evidence required for this act',path:['signers',index,'oath']});
});
export type RONStatutoryEvidence = z.infer<typeof ronStatutoryEvidenceSchema>;
export const ronEvidenceRequestSchema = z.object({
  evidence: ronStatutoryEvidenceSchema,
  expected_evidence_id: z.string().uuid().nullable(),
  idempotency_key: z.string().uuid(),
  reason: z.string().trim().min(10).max(500),
}).strict();
