// Premium loading skeletons — shimmer, not spinner. Pure CSS (animate-pulse), so
// no JS/motion dependency and reduced-motion users simply see a static placeholder.

export function DashboardSkeleton({
  rows = 4,
  className = "",
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2.5 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 w-full animate-pulse rounded-lg border border-white/[0.05] bg-white/[0.03]"
        />
      ))}
    </div>
  );
}

export function SkeletonLine({ width = "100%" }: { width?: string }) {
  return (
    <span
      className="inline-block h-3 animate-pulse rounded bg-white/10"
      style={{ width }}
      aria-hidden="true"
    />
  );
}
