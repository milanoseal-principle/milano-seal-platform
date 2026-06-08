import { QuickActionStatus } from '@/lib/dashboard/quickActionTypes';

const CONFIG: Record<QuickActionStatus, { label: string; cls: string }> = {
  READY:             { label: 'Ready',    cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  LOCKED:            { label: 'Locked',   cls: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
  REVIEW_REQUIRED:   { label: 'Review',   cls: 'bg-amber-500/8 border-amber-500/25 text-amber-300' },
  DISABLED:          { label: 'Disabled', cls: 'bg-zinc-800/40 border-zinc-700/30 text-zinc-500' },
  NOT_MOUNTED:       { label: 'Missing',  cls: 'bg-zinc-800/40 border-zinc-700/30 text-zinc-600' },
  NO_MATTER_SELECTED:{ label: 'No Matter',cls: 'bg-amber-500/5 border-amber-500/20 text-amber-500/60' },
};

export function QuickActionStatusBadge({ status }: { status: QuickActionStatus }) {
  const { label, cls } = CONFIG[status] ?? CONFIG.DISABLED;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm border text-[6px] font-bold tracking-widest uppercase shrink-0 ${cls}`}>
      {label}
    </span>
  );
}
