"use client";

import { useEffect, useState } from "react";

export function AlertBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch("/api/admin/sla")
      .then((r) => r.json())
      .then((d) => setCount(d.critical || 0))
      .catch(() => {});
  }, []);

  if (count === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-[10px] font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
      {count} critical
    </span>
  );
}
