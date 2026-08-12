"use client";

import { useReducedMotion } from "framer-motion";

/** Canonical motion preference hook. Content must never depend on animation. */
export function useMilanoReducedMotion() {
  return Boolean(useReducedMotion());
}

