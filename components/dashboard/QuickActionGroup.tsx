'use client';
import { motion } from 'framer-motion';
import { ResolvedAction } from '@/lib/dashboard/quickActionRoutes';
import { QuickActionButton } from './QuickActionButton';

interface Props {
  group: string;
  actions: ResolvedAction[];
}

export function QuickActionGroup({ group, actions }: Props) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[7px] font-bold tracking-[0.25em] uppercase text-zinc-600">{group}</span>
        <div className="flex-1 h-px bg-zinc-800/60" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {actions.map((action, i) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
          >
            <QuickActionButton action={action} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
