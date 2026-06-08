'use client';

import { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QUICK_ACTION_REGISTRY } from '@/lib/dashboard/quickActionRegistry';
import { resolveActions } from '@/lib/dashboard/quickActionRoutes';
import { QuickActionGroup } from './QuickActionGroup';
import type { QuickActionRole, QuickActionGroup as QAGroup } from '@/lib/dashboard/quickActionTypes';
import type { GuardContext } from '@/lib/dashboard/quickActionGuards';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  role: QuickActionRole;
  activeMatterId?: string;
  matterRef?: string;
  matterState?: string;
  paymentStatus?: string;
  releaseStatus?: string;
  destinationCountry?: string;
  documentType?: string;
}

export function QuickActionCenter({
  isOpen, onClose, role,
  activeMatterId, matterRef, matterState, paymentStatus, releaseStatus,
  destinationCountry, documentType,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  const ctx: GuardContext & { role: string } = {
    role, activeMatterId, matterState, paymentStatus, releaseStatus,
  };

  const resolved = useMemo(() => {
    // Filter by role, exclude mark_paid_and_released from main panel (destructive gate)
    const filtered = QUICK_ACTION_REGISTRY.filter(a =>
      a.roles.includes(role) && a.id !== 'mark_paid_and_released'
    );
    return resolveActions(filtered, ctx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, activeMatterId, matterState, paymentStatus, releaseStatus]);

  // Group actions
  const grouped = useMemo(() => {
    const map = new Map<QAGroup, typeof resolved>();
    for (const action of resolved) {
      if (!map.has(action.group)) map.set(action.group, []);
      map.get(action.group)!.push(action);
    }
    return map;
  }, [resolved]);

  const GROUP_ORDER: QAGroup[] = [
    'Matter', 'Financial', 'Execution', 'Communications',
    'Documents', 'Intelligence', 'Courier Custody', 'Release',
    'Alliance', 'VA', 'Admin',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label="Quick Action Center"
            aria-modal="true"
            initial={{ opacity: 0, x: 24, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 16, scale: 0.98 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-4 top-16 z-50 w-[min(520px,calc(100vw-2rem))] max-h-[calc(100vh-5rem)] overflow-y-auto bg-[#050507]/95 border border-zinc-800 rounded-sm shadow-[0_32px_80px_-10px_rgba(0,0,0,0.97)]"
            style={{ WebkitBackdropFilter: 'blur(40px)', backdropFilter: 'blur(40px)' } as React.CSSProperties}
          >
            {/* Top accent */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#050507]/95 border-b border-zinc-900/80 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[10px] font-bold tracking-[0.2em] text-zinc-100 uppercase">
                    Quick Action Center
                  </h2>
                  <p className="text-[7px] text-zinc-600 tracking-wide mt-0.5">
                    Controlled operator routing for review, payment, execution, custody, and release.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors touch-manipulation"
                  aria-label="Close Quick Action Center"
                >
                  ✕
                </button>
              </div>

              {/* Matter context strip */}
              <div className={`mt-3 rounded-sm border px-3 py-2 ${activeMatterId ? 'border-amber-500/20 bg-amber-500/[0.03]' : 'border-zinc-800 bg-zinc-950/40'}`}>
                {activeMatterId ? (
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-[8px] font-bold text-amber-400 tracking-wide uppercase">
                      Matter Active: {matterRef ?? activeMatterId}
                    </span>
                    {destinationCountry && <span className="text-[7px] text-zinc-500">{destinationCountry}</span>}
                    {documentType && <span className="text-[7px] text-zinc-500">{documentType}</span>}
                    {matterState && <span className="text-[7px] text-zinc-500 capitalize">{matterState.replace(/_/g,' ')}</span>}
                    {paymentStatus && <span className={`text-[7px] capitalize ${paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>{paymentStatus.replace(/_/g,' ')}</span>}
                  </div>
                ) : (
                  <div>
                    <p className="text-[8px] text-zinc-500 font-semibold">No Matter Selected</p>
                    <p className="text-[7px] text-zinc-600 mt-0.5">Select a matter to unlock matter-specific actions.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action groups */}
            <div className="p-4">
              {GROUP_ORDER.map(group => {
                const actions = grouped.get(group);
                if (!actions || actions.length === 0) return null;
                return <QuickActionGroup key={group} group={group} actions={actions} />;
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-900/60 px-4 py-2 flex justify-between text-[6px] text-zinc-700 tracking-[0.2em] uppercase font-mono">
              <span>FLORIDA LICENSED</span><span>•</span>
              <span>PAYMENT-GATED</span><span>•</span>
              <span>FOUNDER-LED</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
