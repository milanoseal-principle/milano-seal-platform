'use client';

import Link from 'next/link';

interface Props {
  onOpenCenter: () => void;
  activeMatterId?: string;
  role: string;
}

const STRIP_ACTIONS = [
  { label: '+ New Matter', href: '/intake', always: true },
  { label: 'Open Intake', href: '/dashboard/intake', always: true },
  { label: 'View Payments', href: '/dashboard/admin/payments', always: true },
  { label: 'Compliance', href: '/dashboard/compliance', always: true },
];

export function QuickActionStrip({ onOpenCenter, activeMatterId }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STRIP_ACTIONS.map(a => (
        <Link
          key={a.label}
          href={a.href}
          prefetch={false}
          className="inline-flex items-center px-3 py-1.5 border border-zinc-800 bg-zinc-950/60 rounded-sm text-[8px] font-semibold tracking-[0.1em] uppercase text-zinc-400 hover:border-amber-500/30 hover:text-amber-300 transition-all duration-160 touch-manipulation min-h-[32px]"
        >
          {a.label}
        </Link>
      ))}
      {activeMatterId && (
        <Link
          href={`/dashboard/invoices?matter_id=${encodeURIComponent(activeMatterId)}`}
          prefetch={false}
          className="inline-flex items-center px-3 py-1.5 border border-zinc-800 bg-zinc-950/60 rounded-sm text-[8px] font-semibold tracking-[0.1em] uppercase text-zinc-400 hover:border-amber-500/30 hover:text-amber-300 transition-all duration-160 touch-manipulation min-h-[32px]"
        >
          Generate Invoice
        </Link>
      )}
      <button
        onClick={onOpenCenter}
        className="inline-flex items-center px-3 py-1.5 border border-amber-500/25 bg-amber-500/[0.04] rounded-sm text-[8px] font-bold tracking-[0.12em] uppercase text-amber-400/80 hover:border-amber-500/50 hover:text-amber-300 transition-all duration-160 touch-manipulation min-h-[32px]"
      >
        ⊞ All Actions
      </button>
    </div>
  );
}
