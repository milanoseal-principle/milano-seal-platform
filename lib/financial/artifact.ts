import { PDFDocument,StandardFonts } from 'pdf-lib';
import { createHash } from 'node:crypto';
import { z } from 'zod';
export const artifactSchema=z.object({id:z.string().uuid(),matter_id:z.string().uuid(),kind:z.enum(['PRO_FORMA','INVOICE','RECEIPT','PAID_AND_RELEASED']),version:z.number().int().positive(),snapshot:z.record(z.string(),z.unknown()),snapshot_sha256:z.string().regex(/^[a-f0-9]{64}$/),pdf_sha256:z.string().nullable(),generator_version:z.string(),created_at:z.string()}).passthrough();
/** Formatting only: amounts and classifications come from the immutable database snapshot. */
export async function financialArtifactPdf(raw:unknown) {
 const artifact=artifactSchema.parse(raw);const pdf=await PDFDocument.create();const created=new Date(artifact.created_at);pdf.setCreationDate(created);pdf.setModificationDate(created);pdf.setProducer(artifact.generator_version);pdf.setCreator('The Milano Seal');pdf.setTitle(`${artifact.kind} ${artifact.id}`);
 const font=await pdf.embedFont(StandardFonts.Helvetica);let page=pdf.addPage([612,792]),y=750;
 const line=(text:string)=>{const words=text.split(' ');let current='';for(const word of words){if(font.widthOfTextAtSize(current+' '+word,10)>500&&current){write(current);current=word;}else current=current?current+' '+word:word;}if(current)write(current);};
 const write=(text:string)=>{if(y<45){page=pdf.addPage([612,792]);y=750;}page.drawText(text,{x:45,y,size:10,font});y-=16;};
 line('THE MILANO SEAL');line(`${artifact.kind} | ${artifact.id} | version ${artifact.version}`);line(`Issued ${artifact.created_at}`);
 for(const [key,value] of Object.entries(artifact.snapshot).sort(([a],[b])=>a.localeCompare(b)))line(`${key}: ${typeof value==='object'?JSON.stringify(value):String(value??'NOT_VERIFIED')}`);
 line(`Canonical snapshot SHA-256: ${artifact.snapshot_sha256}`);line('Government and receiving authorities determine acceptance. This artifact does not authorize scheduling or release.');
 const bytes=await pdf.save();const sha256=createHash('sha256').update(bytes).digest('hex');
 if(artifact.pdf_sha256&&artifact.pdf_sha256!==sha256)throw Error('ARTIFACT_REGENERATION_HASH_MISMATCH');return {bytes,sha256,artifact};
}
