"use client";

// Lightweight atmospheric gradient + grid background. CSS only, no animation loop.

export function AtmosphericLayers() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] bg-amber-500/[0.03] rounded-full blur-[140px]" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-yellow-700/[0.03] rounded-full blur-[120px]" />
      <div className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-amber-600/[0.025] rounded-full blur-[100px]" />
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(212,175,55,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
