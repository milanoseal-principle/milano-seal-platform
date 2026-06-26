import type { ReactNode, ElementType, CSSProperties } from "react";

interface CriticalCardFrameProps {
  children: ReactNode;
  className?: string;
  /** Render element (article/div/section). Defaults to div. */
  as?: ElementType;
  /** Max safe width; defaults to a responsive clamp. */
  maxWidth?: string;
  style?: CSSProperties;
  "aria-label"?: string;
}

/**
 * Wrapper for any card that must never be clipped, hidden, or overflow its
 * parent — route cards, invoice cards, payment panels, portal panels,
 * dashboard action cards.
 *
 * Guarantees:
 * - data-critical-card (consumed by the responsive smoke regression guard)
 * - overflow-visible on its own wrapper (decorative parents may still clip,
 *   but this card's content cannot be cut)
 * - mobile-safe width: min(maxWidth, 100% - gutter)
 * - long strings wrap (break-words) instead of forcing overflow
 */
export function CriticalCardFrame({
  children,
  className = "",
  as,
  maxWidth = "min(100%, 480px)",
  style,
  ...rest
}: CriticalCardFrameProps) {
  const Component = as ?? "div";
  return (
    <Component
      data-critical-card=""
      className={`relative overflow-visible [overflow-wrap:anywhere] ${className}`}
      style={{ maxWidth, width: "100%", ...style }}
      {...rest}
    >
      {children}
    </Component>
  );
}
