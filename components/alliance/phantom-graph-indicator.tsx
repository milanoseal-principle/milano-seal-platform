"use client";

import { motion } from "framer-motion";

interface PhantomGraphIndicatorProps {
  weeks?: number[];
  label?: string;
}

const DEFAULT_WEEKS = [0, 0, 0, 0, 0, 0, 0, 0];

export function PhantomGraphIndicator({
  weeks = DEFAULT_WEEKS,
  label = "Referral Volume",
}: PhantomGraphIndicatorProps) {
  const max = Math.max(...weeks, 1);

  return (
    <div className="ap-card ap-card-body">
      <div className="ap-eyebrow mb-3">{label}</div>
      <div className="flex items-end gap-1.5 h-14">
        {weeks.map((v, i) => {
          const pct = v / max;
          const hasActivity = v > 0;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end relative"
              style={{ minWidth: 0 }}
            >
              {hasActivity && (
                <motion.div
                  className="absolute inset-x-0 bottom-full mb-0.5 pointer-events-none"
                  style={{
                    height: 6,
                    background: "rgba(212,175,55,0.35)",
                    filter: "blur(4px)",
                    borderRadius: 4,
                  }}
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.12,
                  }}
                />
              )}
              <motion.div
                className="rounded-sm w-full"
                style={{
                  background: hasActivity
                    ? "rgba(212,175,55,0.75)"
                    : "rgba(229,231,235,0.8)",
                  minHeight: 3,
                }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(pct * 100, 4)}%` }}
                transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-gray-400 font-mono">8 wks ago</span>
        <span className="text-[10px] text-gray-400 font-mono">This week</span>
      </div>
      {weeks.every((v) => v === 0) && (
        <div className="text-xs text-gray-400 text-center mt-2">
          Activity will appear here after first referral
        </div>
      )}
    </div>
  );
}
