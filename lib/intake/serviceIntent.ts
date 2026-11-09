import { normalizeServiceIntent } from '@/lib/conversion/commercialCta';
export { normalizeServiceIntent } from '@/lib/conversion/commercialCta';
// Customer context only. Never consumed as route, eligibility or pricing authority.
import { type ConciergeServiceIntent } from '@/lib/acquisition/concierge-service-intents';
export const SERVICE_ENTRIES = [
 {intent:'ron',label:'Online Notary / RON',description:'I need something notarized online.',cta:'Start Online Notary'},
 {intent:'witness',label:'Witness Support',description:'My document requires a witness.',cta:'Request Witness Support'},
 {intent:'apostille',label:'Apostille',description:'I need a document apostilled.',cta:'Start Apostille Review'},
 {intent:'international_execution',label:'International Document Execution',description:'My document will be used in another country.',cta:'Begin Matter Review'},
 {intent:'domestic_execution',label:'In-person / Domestic Notary',description:'I need a notary to meet me.',cta:'Request a Notary'},
 {intent:'foreign_counsel',label:'Professional / Counsel',description:'I represent a client who needs U.S. execution.',cta:'Send a Matter'},
 {intent:'unsure',label:'Not Sure',description:'I have a document, but I’m not sure what I need.',cta:'Tell Us What You Need'},
] as const satisfies ReadonlyArray<{intent:ConciergeServiceIntent;label:string;description:string;cta:string}>;
export function serviceIntentLabel(value:unknown):string {
 const intent=normalizeServiceIntent(value);
 return SERVICE_ENTRIES.find(entry=>entry.intent===intent)?.label??'Authentication';
}
export function serviceIntakeHref(value:unknown):string {
 const intent=normalizeServiceIntent(value);
 return '/intake?intent='+intent+(intent==='foreign_counsel'?'&lane=professional':'');
}
