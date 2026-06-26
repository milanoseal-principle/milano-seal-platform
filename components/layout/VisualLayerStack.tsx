import type { ReactNode } from "react";

interface LayerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Stable z-index ladder so a decorative visual (globe/map/glow) can never sit
 * above — or clip — the content card layered over it.
 *
 *   background  z-0   (decorative, may clip internally)
 *   visual      z-10  (globe / map / dots — decorative)
 *   card        z-20  (route / invoice / panel — content, must NOT clip)
 *   actions     z-30  (text / CTAs — content)
 */
export function VisualLayerStack({ children, className = "" }: LayerProps) {
  return <div className={`relative ${className}`}>{children}</div>;
}

/** Decorative background layer — clipping here is allowed. */
export function BackgroundLayer({ children, className = "" }: LayerProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`} aria-hidden="true">
      {children}
    </div>
  );
}

/** Globe / map / decorative visual — sits behind content, never clips it. */
export function VisualLayer({ children, className = "" }: LayerProps) {
  return <div className={`pointer-events-none absolute inset-0 z-10 ${className}`}>{children}</div>;
}

/** Content card layer — overflow-visible, never clipped. */
export function CardLayer({ children, className = "" }: LayerProps) {
  return <div className={`relative z-20 overflow-visible ${className}`}>{children}</div>;
}

/** Text + CTA layer — top of the stack. */
export function ActionLayer({ children, className = "" }: LayerProps) {
  return <div className={`relative z-30 ${className}`}>{children}</div>;
}
