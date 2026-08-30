'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MILANO_EASE, MILANO_MOTION } from '@/lib/motion/milanoMotionPresets';

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

  const summaryCards = [
    ['CURRENT STAGE', summary.currentStage, 'stage'],
    ['ACTION REQUIRED', summary.actionRequired, isPaymentGate ? 'action' : 'neutral'],
    ['NEXT EXPECTED EVENT', summary.nextExpectedEvent, 'next'],
  ] as const;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#C6A65B]/15 bg-[radial-gradient(circle_at_80%_0%,rgba(198,166,91,0.08),transparent_34%),linear-gradient(145deg,rgba(11,11,11,0.96),rgba(6,6,6,0.96))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-5">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C6A65B]/45 to-transparent" />

      <motion.div
        className="grid gap-2 sm:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: reduced ? 0 : MILANO_MOTION.stagger } } }}
      >
        {summaryCards.map(([label,value,tone]) => (
          <motion.div
            key={label}
            variants={{ hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: reduced ? 0.01 : MILANO_MOTION.standard, ease: MILANO_EASE }}
            className={`min-h-[92px] rounded-xl border p-3.5 ${tone === 'action' ? 'border-amber-500/25 bg-amber-500/[0.045]' : tone === 'stage' ? 'border-[#C6A65B]/22 bg-[#C6A65B]/[0.045]' : 'border-white/[0.06] bg-white/[0.018]'}`}
          >
            <div className={`font-mono text-[8px] uppercase tracking-[0.16em] ${tone === 'action' ? 'text-amber-200/80' : 'text-[#C6A65B]/55'}`}>{label}</div>
            <div className="mt-2 text-[12px] leading-5 text-white/68">{value}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-5 flex items-center justify-between gap-3 border-b border-white/[0.055] pb-3">
        <div>
          <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/28">Matter Journey</div>
          <div className="mt-1 text-[11px] text-white/35">Canonical lifecycle projection</div>
        </div>
        <div className="font-mono text-[9px] text-[#C6A65B]/65">{String(currentIdx + 1).padStart(2,'0')} / {String(MATTER_STEPS.length).padStart(2,'0')}</div>
      </div>

      <div className="relative mt-4">
        {MATTER_STEPS.map((step,i) => {
          const done = currentIdx > i;
          const active = currentIdx === i;
          return (
            <motion.div
              key={step.label}
              initial={reduced ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={reduced ? { duration: 0 } : { duration: MILANO_MOTION.standard, delay: i * MILANO_MOTION.stagger, ease: MILANO_EASE }}
              className="relative grid grid-cols-[34px_minmax(0,1fr)] gap-3"
            >
              <div className="relative flex justify-center">
                {i < MATTER_STEPS.length - 1 ? (
                  <div className="absolute left-1/2 top-8 h-[calc(100%-4px)] w-px -translate-x-1/2 overflow-hidden bg-white/[0.055]">
                    {done ? <motion.div initial={reduced ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={reduced ? { duration: 0 } : { duration: 0.5, ease: MILANO_EASE }} className="h-full origin-top bg-gradient-to-b from-[#C6A65B]/70 to-[#C6A65B]/25" /> : null}
                  </div>
                ) : null}

                <div className="relative mt-0.5 h-8 w-8 shrink-0">
                  {active && !reduced ? <motion.div aria-hidden="true" animate={{ scale:[1,1.6], opacity:[0.42,0] }} transition={{ duration:2.1, repeat:Infinity, ease:'easeOut' }} className="absolute inset-0 rounded-full border border-[#C6A65B]/70" /> : null}
                  <motion.div
                    animate={active && !reduced ? { boxShadow:[`0 0 0 0 ${GOLD_MID}`,`0 0 18px 3px ${GOLD_MID}`,`0 0 0 0 ${GOLD_MID}`] } : {}}
                    transition={active && !reduced ? { duration:2.1, repeat:Infinity, ease:'easeInOut' } : {}}
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border font-mono text-[10px] font-semibold ${done ? 'border-[#C6A65B] bg-[#C6A65B] text-[#171007]' : active ? 'border-[#C6A65B]/80 bg-[#C6A65B]/[0.12] text-[#E8CF94]' : 'border-white/[0.08] bg-white/[0.025] text-white/25'}`}
                  >
                    {done ? '✓' : active ? '●' : i + 1}
                  </motion.div>
                </div>
              </div>

              <div className="min-w-0 pb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className={`font-serif text-[14px] ${active ? 'text-[#E9D29C]' : done ? 'text-[#C6A65B]/75' : 'text-white/30'}`}>{step.label}</div>
                  {active ? <span className="rounded-full border border-[#C6A65B]/25 bg-[#C6A65B]/[0.055] px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.14em] text-[#C6A65B]/75">Current</span> : null}
                </div>
                <AnimatePresence initial={false}>
                  {(active||done) ? (
                    <motion.div initial={reduced?false:{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={reduced?{}:{opacity:0,height:0}} transition={reduced ? { duration: 0 } : { duration: 0.3, ease: MILANO_EASE }}>
                      <div className={`mt-1.5 max-w-xl text-[11.5px] leading-5 ${active ? 'text-white/55' : 'text-white/38'}`}>{step.desc}</div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <AnimatePresence initial={false}>
                  {active && isPaymentGate && step.keys.includes('awaiting_payment') ? (
                    <motion.div initial={reduced?false:{opacity:0,y:4}} animate={{opacity:1,y:0}} transition={reduced ? { duration: 0 } : { duration: 0.32, ease: MILANO_EASE }} className="mt-3 flex min-h-11 items-center rounded-lg border border-amber-500/25 bg-amber-500/[0.055] px-3 text-[11px] font-medium text-amber-200">
                      Payment required to unlock scheduling
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-1 flex items-center justify-between gap-3 border-t border-white/[0.05] pt-3">
        <span className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/20">Truth-backed · no inferred success states</span>
        <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-[#C6A65B]/15 to-transparent" />
      </div>
    </div>
  );
}
