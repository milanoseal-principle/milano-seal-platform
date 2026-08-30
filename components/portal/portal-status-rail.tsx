'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export interface StatusStep { keys: string[]; label: string; desc: string }

export const MATTER_STEPS: StatusStep[] = [
  { keys: ['new','intake_received'], label: 'Intake Received', desc: 'Your Matter has been received and is being structured for review.' },
  { keys: ['under_review','compliance_review','needs_info','compliance_blocked'], label: 'Under Review', desc: 'Your document path is being reviewed for execution readiness and international use.' },
  { keys: ['quoted','awaiting_payment'], label: 'Invoice Issued', desc: 'Your execution proposal is ready. Payment is required before scheduling can begin.' },
  { keys: ['payment_confirmed'], label: 'Payment Confirmed', desc: 'Verified payment has unlocked the next governed execution step.' },
  { keys: ['scheduled','in_execution'], label: 'In Execution', desc: 'Your execution session or document handling step is in progress.' },
  { keys: ['apostille_processing','courier_ready'], label: 'Apostille & Packaging', desc: 'Your document is in apostille/authentication processing or secure release preparation.' },
  { keys: ['shipped','delivered'], label: 'Delivery', desc: 'Your document has been released into governed courier delivery.' },
  { keys: ['completed','closed'], label: 'Matter Closed', desc: 'Your Matter has been completed and release evidence recorded.' },
];

export function resolveStepIndex(status: string | null | undefined) {
  if (!status) return 0;
  const idx = MATTER_STEPS.findIndex((step) => step.keys.includes(status));
  return idx === -1 ? 0 : idx;
}

export function resolvePortalLifecycleSummary(status: string | null | undefined, paymentStatus?: string | null) {
  const normalized = status ?? 'intake_received';
  const step = MATTER_STEPS[resolveStepIndex(normalized)];
  const paymentVerified = ['paid','confirmed'].includes(String(paymentStatus ?? '').toLowerCase()) || normalized === 'payment_confirmed';
  const actionRequired = normalized === 'awaiting_payment' && !paymentVerified
    ? 'Complete the Wise payment requirement shown in Payment.'
    : normalized === 'needs_info'
      ? 'Provide the requested Matter information.'
      : normalized === 'compliance_blocked'
        ? 'Wait for Milano Execution Desk review before proceeding.'
        : 'No client action is currently required.';
  const nextExpectedEvent: Record<string,string> = {
    new: 'Matter review', intake_received: 'Matter review', under_review: 'Validation or execution proposal', compliance_review: 'Compliance review decision',
    needs_info: 'Requested information received', compliance_blocked: 'Operator review decision', quoted: 'Wise payment submission', awaiting_payment: 'Verified payment or scheduling authority',
    payment_confirmed: 'Execution scheduling', scheduled: 'Execution', in_execution: 'Apostille or authentication processing', apostille_processing: 'Custody and release preparation',
    courier_ready: 'Courier release', shipped: 'Delivery confirmation', delivered: 'Matter close', completed: 'No further event expected', closed: 'No further event expected',
  };
  return { currentStage: step?.label ?? 'Matter Review', actionRequired, nextExpectedEvent: nextExpectedEvent[normalized] ?? 'Operator review' };
}

const GOLD = 'var(--ms-gold)';
const GOLD_FAINT = 'rgba(198,165,90,0.18)';
const GOLD_MID = 'rgba(198,165,90,0.45)';

export function PortalStatusRail({ matterStatus, paymentStatus }: { matterStatus: string | null | undefined; paymentStatus?: string | null }) {
  const reduced = useReducedMotion();
  const currentIdx = resolveStepIndex(matterStatus);
  const summary = resolvePortalLifecycleSummary(matterStatus, paymentStatus);
  const isPaymentGate = matterStatus === 'awaiting_payment' && !['paid','confirmed'].includes(String(paymentStatus ?? '').toLowerCase());

  return <div style={{ position: 'relative' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 8, marginBottom: 20 }}>
      {[
        ['CURRENT STAGE',summary.currentStage],
        ['ACTION REQUIRED',summary.actionRequired],
        ['NEXT EXPECTED EVENT',summary.nextExpectedEvent],
      ].map(([label,value]) => <div key={label} style={{ border: '1px solid rgba(198,165,90,0.14)', background: 'rgba(198,165,90,0.025)', borderRadius: 6, padding: '10px 12px' }}><div style={{ fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.14em', color: 'rgba(198,165,90,0.55)', marginBottom: 5 }}>{label}</div><div style={{ fontSize: 11.5, lineHeight: 1.45, color: 'rgba(255,255,255,0.68)' }}>{value}</div></div>)}
    </div>
    <div style={{ fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.24)', marginBottom: 10 }}>MATTER JOURNEY</div>
    {MATTER_STEPS.map((step,i) => {
      const done = currentIdx > i; const active = currentIdx === i;
      return <motion.div key={step.label} initial={reduced ? false : { opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={reduced ? {} : { duration: 0.3, delay: i * 0.055, ease: 'easeOut' }} style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:4, position:'relative' }}>
        {i < MATTER_STEPS.length - 1 && <div style={{ position:'absolute', left:14, top:28, width:2, height:28, background:done ? GOLD : GOLD_FAINT, borderRadius:1 }} />}
        <div style={{ position:'relative', flexShrink:0, width:28, height:28, marginTop:2 }}>
          {active && !reduced && <motion.div animate={{ scale:[1,1.55,1], opacity:[0.55,0,0.55] }} transition={{ duration:2.2, repeat:Infinity, ease:'easeInOut' }} style={{ position:'absolute', inset:-4, borderRadius:'50%', border:`1.5px solid ${GOLD}` }} />}
          <motion.div animate={active && !reduced ? { boxShadow:[`0 0 0 0 ${GOLD_MID}`,`0 0 8px 3px ${GOLD_MID}`,`0 0 0 0 ${GOLD_MID}`] } : {}} transition={active && !reduced ? { duration:2.2, repeat:Infinity, ease:'easeInOut' } : {}} style={{ width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:done?12:11,fontWeight:600,background:done?GOLD:active?'rgba(198,165,90,0.12)':'rgba(255,255,255,0.04)',border:`1.5px solid ${done||active?GOLD:GOLD_FAINT}`,color:done?'#1a1507':active?GOLD:'rgba(255,255,255,0.28)' }}>{done?'✓':active?'●':i+1}</motion.div>
        </div>
        <div style={{ paddingTop:4,paddingBottom:18,minWidth:0 }}>
          <div style={{ fontSize:13,fontWeight:active?600:done?500:400,color:active?GOLD:done?'rgba(198,165,90,0.75)':'rgba(255,255,255,0.3)',fontFamily:'var(--font-serif, Georgia, serif)' }}>{step.label}</div>
          <AnimatePresence>{(active||done) && <motion.div initial={reduced?false:{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={reduced?{}:{opacity:0,height:0}}><div style={{ marginTop:3,fontSize:11.5,color:active?'rgba(255,255,255,0.55)':'rgba(255,255,255,0.4)',lineHeight:1.5 }}>{step.desc}</div></motion.div>}</AnimatePresence>
          <AnimatePresence>{active && isPaymentGate && step.keys.includes('awaiting_payment') && <motion.div initial={reduced?false:{opacity:0,y:4}} animate={{opacity:1,y:0}} style={{ marginTop:8,padding:'7px 10px',borderRadius:4,background:'rgba(198,165,90,0.06)',border:'1px solid rgba(198,165,90,0.2)',fontSize:11,color:GOLD }}>Payment required to unlock scheduling</motion.div>}</AnimatePresence>
        </div>
      </motion.div>;
    })}
  </div>;
}
