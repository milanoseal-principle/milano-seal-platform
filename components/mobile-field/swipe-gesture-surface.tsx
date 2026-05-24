"use client";

import { useRef, useState, type ReactNode, type PointerEvent } from "react";

interface SwipeGestureSurfaceProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  className?: string;
}

export function SwipeGestureSurface({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
  className = "",
}: SwipeGestureSurfaceProps) {
  const startX = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);
  const dragging = useRef(false);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    startX.current = e.clientX;
    dragging.current = true;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragging.current || startX.current === null) return;
    const dx = e.clientX - startX.current;
    // Dampen drag to give resistance feel
    setOffset(dx * 0.35);
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (!dragging.current || startX.current === null) return;
    dragging.current = false;
    const dx = e.clientX - startX.current;
    setOffset(0);
    startX.current = null;

    if (dx < -threshold && onSwipeLeft) onSwipeLeft();
    else if (dx > threshold && onSwipeRight) onSwipeRight();
  }

  function onPointerCancel() {
    dragging.current = false;
    startX.current = null;
    setOffset(0);
  }

  return (
    <div
      className={`select-none touch-pan-y ${className}`}
      style={{
        transform: `translateX(${offset}px)`,
        transition: dragging.current ? "none" : "transform 0.25s ease-out",
        willChange: "transform",
        cursor: dragging.current ? "grabbing" : "grab",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {children}
    </div>
  );
}
