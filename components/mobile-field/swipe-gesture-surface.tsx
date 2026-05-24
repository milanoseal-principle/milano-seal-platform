"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type PointerEvent,
  type KeyboardEvent,
} from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

// ─── Action registry ───────────────────────────────────────────────────────────

export const ALLOWED_SWIPE_ACTIONS = new Set([
  "confirm_document_review",
  "release_to_delivery",
  "mark_packet_ready",
  "acknowledge_assignment",
  "complete_field_step",
  "escalate_issue",
] as const);

export const BLOCKED_SWIPE_ACTIONS = new Set([
  "force_payment_paid",
  "bypass_compliance",
  "approve_partner_credentials",
  "delete_matter",
  "override_margin",
  "close_matter_without_admin",
] as const);

export type AllowedSwipeAction = typeof ALLOWED_SWIPE_ACTIONS extends Set<
  infer T
>
  ? T
  : never;

// ─── Audit events ──────────────────────────────────────────────────────────────

export type SwipeAuditEventName =
  | "MOBILE_SWIPE_STARTED"
  | "MOBILE_SWIPE_THRESHOLD_REACHED"
  | "MOBILE_SWIPE_CONFIRMED"
  | "MOBILE_SWIPE_REJECTED"
  | "MOBILE_SWIPE_ROLLED_BACK"
  | "MOBILE_SWIPE_AUDITED";

export interface SwipeAuditEvent {
  event: SwipeAuditEventName;
  actionKey: string;
  idempotencyKey: string;
  timestamp: string;
}

// ─── State ────────────────────────────────────────────────────────────────────

type SwipeState = "idle" | "dragging" | "pending" | "success" | "failed";

// ─── Props ────────────────────────────────────────────────────────────────────

interface SwipeGestureSurfaceProps {
  children: ReactNode;
  /** Which registered action this swipe triggers. Must be in ALLOWED_SWIPE_ACTIONS. */
  actionKey: AllowedSwipeAction;
  /** Minimum drag distance (px) before the threshold is considered reached. */
  threshold?: number;
  /** Drag travel (px) required to trigger confirmation. Default 160. */
  confirmDistance?: number;
  /** Direction of swipe that confirms the action. */
  direction?: "left" | "right";
  className?: string;
  /** Disabled when payment or compliance locks are not cleared. */
  disabled?: boolean;
  /**
   * Backend mutation. Must return true on success, false on rejection.
   * UI state is NOT set to success until this resolves true.
   * Swipe never mutates local state as final truth.
   */
  onAction: (idempotencyKey: string) => Promise<boolean>;
  /** Receives structured audit event for logging. */
  onAuditEvent?: (event: SwipeAuditEvent) => void;
  /** Accessible label describing the confirm action. */
  label?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateIdempotencyKey(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `swipe_${ts}_${rand}`;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function haptic(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // vibrate not available — silent fail
    }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SwipeGestureSurface({
  children,
  actionKey,
  threshold = 60,
  confirmDistance = 160,
  direction = "right",
  className = "",
  disabled = false,
  onAction,
  onAuditEvent,
  label = "Swipe to confirm action",
}: SwipeGestureSurfaceProps) {
  const [swipeState, setSwipeState] = useState<SwipeState>("idle");
  const [offset, setOffset] = useState(0);
  const [thresholdReached, setThresholdReached] = useState(false);

  const startX = useRef<number | null>(null);
  const dragging = useRef(false);
  const idempotencyKey = useRef<string>("");
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = prefersReducedMotion();
  }, []);

  const emit = useCallback(
    (eventName: SwipeAuditEventName) => {
      const ev: SwipeAuditEvent = {
        event: eventName,
        actionKey,
        idempotencyKey: idempotencyKey.current,
        timestamp: new Date().toISOString(),
      };
      onAuditEvent?.(ev);
    },
    [actionKey, onAuditEvent],
  );

  const commit = useCallback(async () => {
    if (swipeState !== "idle" && swipeState !== "dragging") return;
    setOffset(0);
    setThresholdReached(false);
    setSwipeState("pending");
    emit("MOBILE_SWIPE_CONFIRMED");
    haptic([50, 30, 50]);

    let success = false;
    try {
      success = await onAction(idempotencyKey.current);
    } catch {
      success = false;
    }

    if (success) {
      setSwipeState("success");
      emit("MOBILE_SWIPE_AUDITED");
      haptic(80);
    } else {
      setSwipeState("failed");
      emit("MOBILE_SWIPE_REJECTED");
      haptic([100, 50, 100, 50, 100]);
      // Roll back to idle after showing failure
      setTimeout(() => {
        setSwipeState("idle");
        emit("MOBILE_SWIPE_ROLLED_BACK");
      }, 1800);
    }
  }, [swipeState, emit, onAction]);

  // ─── Pointer handlers ───────────────────────────────────────────────────────

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (disabled || swipeState !== "idle" || reducedMotion.current) return;
    idempotencyKey.current = generateIdempotencyKey();
    startX.current = e.clientX;
    dragging.current = true;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    emit("MOBILE_SWIPE_STARTED");
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragging.current || startX.current === null) return;
    const raw = e.clientX - startX.current;
    const dx = direction === "right" ? raw : -raw;
    if (dx < 0) return; // ignore wrong direction

    const clamped = Math.min(dx, confirmDistance * 1.08);
    setOffset(direction === "right" ? clamped * 0.6 : -clamped * 0.6);

    if (dx >= threshold && !thresholdReached) {
      setThresholdReached(true);
      haptic(30);
      emit("MOBILE_SWIPE_THRESHOLD_REACHED");
    }
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (!dragging.current || startX.current === null) return;
    dragging.current = false;

    const raw = e.clientX - startX.current;
    const dx = direction === "right" ? raw : -raw;
    startX.current = null;
    setOffset(0);
    setThresholdReached(false);

    if (dx >= confirmDistance) {
      commit();
    }
  }

  function onPointerCancel() {
    dragging.current = false;
    startX.current = null;
    setOffset(0);
    setThresholdReached(false);
  }

  // ─── Keyboard fallback ──────────────────────────────────────────────────────

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (disabled || swipeState !== "idle") return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      idempotencyKey.current = generateIdempotencyKey();
      commit();
    }
  }

  // ─── Reduced-motion fallback ────────────────────────────────────────────────

  if (reducedMotion.current) {
    return (
      <div className={className}>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={label}
          aria-disabled={disabled}
          aria-busy={swipeState === "pending"}
          onClick={() => {
            if (disabled || swipeState !== "idle") return;
            idempotencyKey.current = generateIdempotencyKey();
            commit();
          }}
          onKeyDown={onKeyDown}
          className={`rounded-lg border p-4 text-sm font-medium text-center cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
            disabled
              ? "opacity-40 pointer-events-none"
              : swipeState === "success"
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : swipeState === "failed"
                  ? "border-red-400 bg-red-50 text-red-700"
                  : swipeState === "pending"
                    ? "border-amber-400 bg-amber-50 text-amber-700"
                    : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
          }`}
        >
          {swipeState === "pending" ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Processing…
            </span>
          ) : swipeState === "success" ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 size={14} /> Confirmed
            </span>
          ) : swipeState === "failed" ? (
            <span className="flex items-center justify-center gap-2">
              <AlertCircle size={14} /> Failed — try again
            </span>
          ) : (
            label
          )}
        </div>
        {children}
      </div>
    );
  }

  // ─── Swipe render ───────────────────────────────────────────────────────────

  const isActive = swipeState === "idle" || swipeState === "dragging";
  const progress = Math.min(Math.abs(offset) / (confirmDistance * 0.6), 1);

  return (
    <div className={`relative ${className}`}>
      {/* Gesture surface */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-disabled={disabled || !isActive}
        aria-busy={swipeState === "pending"}
        aria-live="polite"
        aria-atomic
        className={`relative select-none overflow-hidden rounded-lg border transition-colors ${
          disabled
            ? "opacity-40 pointer-events-none border-gray-200"
            : swipeState === "success"
              ? "border-emerald-400"
              : swipeState === "failed"
                ? "border-red-400"
                : swipeState === "pending"
                  ? "border-amber-400"
                  : thresholdReached
                    ? "border-emerald-400"
                    : "border-gray-200 cursor-grab active:cursor-grabbing"
        }`}
        style={{
          transform: isActive ? `translateX(${offset}px)` : undefined,
          transition:
            dragging.current ? "none" : "transform 0.22s ease-out, border-color 0.15s",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onKeyDown={onKeyDown}
      >
        {/* Progress fill */}
        {isActive && (
          <div
            className="pointer-events-none absolute inset-0 rounded-lg transition-opacity"
            style={{
              background: thresholdReached
                ? `rgba(16,185,129,${0.06 + progress * 0.1})`
                : `rgba(212,175,55,${progress * 0.08})`,
              opacity: progress > 0 ? 1 : 0,
            }}
          />
        )}

        {/* Status overlays */}
        {swipeState === "pending" && (
          <div className="absolute inset-0 flex items-center justify-center bg-amber-50/80 rounded-lg z-10">
            <Loader2 size={18} className="animate-spin text-amber-600" />
            <span className="ml-2 text-sm text-amber-700 font-medium">
              Processing…
            </span>
          </div>
        )}
        {swipeState === "success" && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-50/90 rounded-lg z-10">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span className="ml-2 text-sm text-emerald-700 font-medium">
              Confirmed
            </span>
          </div>
        )}
        {swipeState === "failed" && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50/90 rounded-lg z-10">
            <AlertCircle size={18} className="text-red-500" />
            <span className="ml-2 text-sm text-red-600 font-medium">
              Action failed — rolling back
            </span>
          </div>
        )}

        {/* Content */}
        <div className={swipeState !== "idle" && swipeState !== "dragging" ? "invisible" : ""}>
          {children}
        </div>
      </div>

      {/* Swipe hint */}
      {swipeState === "idle" && !disabled && (
        <p className="mt-1 text-center text-[10px] text-gray-400 font-mono select-none">
          Swipe {direction} or press Enter to confirm
        </p>
      )}
    </div>
  );
}
