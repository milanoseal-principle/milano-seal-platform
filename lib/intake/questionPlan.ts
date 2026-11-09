import { parseIntake } from '@/lib/parseIntake';
import { normalizeServiceIntent } from './serviceIntent';
import { isDomesticDestination } from './reviewReadiness';
import type { IntakeQuestion } from './intakeClarifications';
import type { SmartIntakeClassification } from './smartClassification';
// Visibility policy only. No legal conclusions, pricing, route or scheduling writes.
export function getSmartIntakeQuestionPlan(context:{intent:unknown;description?:string;internationalUse?:boolean;classification:SmartIntakeClassification;questions:IntakeQuestion[]}) {
 const intent=normalizeServiceIntent(context.intent),c=context.classification;
 const countryHint=parseIntake(context.description ?? '').country;
 const international=Boolean((countryHint&&!isDomesticDestination(countryHint))||context.internationalUse||['apostille','authentication','international_execution','foreign_counsel'].includes(intent)||(c.destinationCountry&&!isDomesticDestination(c.destinationCountry))||c.apostille==='required'||c.authentication==='required');
 const domestic=['ron','witness','domestic_execution'].includes(intent)&&!international;
 const professional=intent==='foreign_counsel';
 const signerDetailsNeeded=!professional&&(!['apostille','authentication'].includes(intent)||c.notarization==='required');
 return {intent,international,domestic,professional,
  witnessAfterTiming:['ron','domestic_execution'].includes(intent),showDestination:!domestic,showOrigin:international,showAuthority:international,showAuthentication:international,showTranslation:international,showDelivery:!domestic,showServiceLocation:intent==='domestic_execution',
  questions:context.questions.filter(q=>!domestic||!['destination','document_origin','apostille_needed'].includes(q.id)),
  detailSteps:!signerDetailsNeeded?['use','contact']:domestic?['signers','contact']:['ron','witness','domestic_execution'].includes(intent)?['signers','use','contact']:['use','signers','contact'],
  requiredClientInputs:['description','name','email','timelineChoice'],
  reviewOnlyFields:['witness_requirement','ron_eligibility','apostille_eligibility','confirmed_execution_route','private_price'],
 };
}
