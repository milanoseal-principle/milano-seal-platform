'use client';

import Link from 'next/link';
import { ResolvedAction } from '@/lib/dashboard/quickActionRoutes';
import { QuickActionStatusBadge } from './QuickActionStatusBadge';

const KIND_ICONS: Record<string, string> = {
  REVIEW: '◎', PREPARE: '◈', ROUTE: '→', FLAG: '⚑', LOCKED: '⊠',
};

interface Props {
  action: ResolvedAction;
}

export function QuickActionButton({ action }: Props) {
  const isDisabled = action.resolvedStatus !== 'READY';
  const icon = KIND_ICONS[action.kind] ?? '·';

  const inner = (
    <div className={`
      group relative flex flex-col gap-1.5 p-3 rounded-sm border transition-all duration-160
      min-h-[64px] touch-manipulation
      ${isDisabled
        ? 'border-zinc-800/50 bg-zinc-950/30 opacity-50 cursor-not-allowed'
        : 'border-zinc-800 bg-zinc-950/60 hover:border-amber-500/30 hover:bg-zinc-900/40 hover:-translate-y-0.5 cursor-pointer'}
    `}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-amber-500/60 font-mono">{icon}</span>
          <span className="text-[10px] font-semibold tracking-[0.1em] text-zinc-200 uppercase leading-tight">
            {action.label}
          </span>
        </div>
        <QuickActionStatusBadge status={action.resolvedStatus} />
      </div>
      <p className="text-[8px] text-zinc-500 leading-relaxed tracking-wide">
        {isDisabled && action.resolvedReason ? action.resolvedReason : action.description}
      </p>
      {!isDisabled && (
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );

  if (isDisabled) {
    return (
      <div role="button" aria-disabled="true" tabIndex={-1} title={action.resolvedReason}>
        {inner}
      </div>
    );
  }

  return (
    <Link href={action.resolvedHref} prefetch={false}>
      {inner}
    </Link>
  );
}
