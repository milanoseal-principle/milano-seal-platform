"use client";

import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  minWidth?: number;
  className?: string;
}

export function DataScrollShield({ children, minWidth = 720, className = "" }: Props) {
  return (
    <div className={`w-full overflow-x-auto rounded-sm border border-zinc-900 ${className}`}>
      <div style={{ minWidth }}>
        {children}
      </div>
    </div>
  );
}
