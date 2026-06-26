import type { ReactNode, CSSProperties } from "react";

type Variant = "public" | "dashboard" | "portal" | "plain";

interface ViewportSafeSectionProps {
  children: ReactNode;
  className?: string;
  /** "public" applies the header+ticker stack offset; others assume their own shell. */
  variant?: Variant;
  /** Override the default header-offset behavior for the chosen variant. */
  withHeaderOffset?: boolean;
  /** Use min-height: 100dvh (never a fixed height — content always grows to fit). */
  fullViewport?: boolean;
  style?: CSSProperties;
  id?: string;
}

/**
 * A section that can never clip its own content.
 *
 * - Uses min-height (never fixed height) so content always grows to fit.
 * - Public variant respects the header + ticker stack via --header-total-height.
 * - overflow-x is clipped (no horizontal scrollbar) while vertical content
 *   stays fully visible — decorative layers clip, content does not.
 */
export function ViewportSafeSection({
  children,
  className = "",
  variant = "public",
  withHeaderOffset,
  fullViewport = false,
  style,
  id,
}: ViewportSafeSectionProps) {
  const offset = withHeaderOffset ?? variant === "public";

  const paddingTop = offset
    ? "calc(var(--header-total-height) + clamp(16px, 3vw, 40px) + var(--sa-top, 0px))"
    : undefined;

  return (
    <section
      id={id}
      className={`relative w-full overflow-x-clip ${fullViewport ? "min-h-[100dvh]" : ""} ${className}`}
      style={{ paddingTop, ...style }}
    >
      {children}
    </section>
  );
}
