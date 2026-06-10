"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Copy, CheckCheck, ExternalLink, Lock } from "lucide-react";
import {
  GOOGLE_BUSINESS_REVIEW_URL,
  buildReviewCopy,
} from "@/lib/reviews/googleBusinessProfile";

export type SealImpressionReviewProps = {
  token?: string;
  matterId?: string;
  clientName?: string | null;
  executionLane?: string | null;
  destinationCountry?: string | null;
  documentType?: string | null;
  isUnlocked?: boolean;
};

export function SealImpressionReview({
  token,
  matterId,
  clientName,
  executionLane,
  destinationCountry,
  documentType,
  isUnlocked = false,
}: SealImpressionReviewProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [ripple, setRipple] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const hasPosted = useRef(false);

  const suggestedCopy = buildReviewCopy({
    lane: executionLane ?? undefined,
    country: destinationCountry ?? undefined,
    documentType: documentType ?? undefined,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mq.matches);
    }
  }, []);

  const postReviewEvent = async () => {
    if (hasPosted.current) return;
    hasPosted.current = true;
    try {
      await fetch("/api/reviews/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          matterId,
          rating,
          feedback,
          executionLane,
          destinationCountry,
          documentType,
          source: "portal_review_prompt",
        }),
      });
    } catch {
      // Do not block the client if API fails
    }
  };

  const handleSealClick = async () => {
    if (stamped) return;
    setStamped(true);
    if (!reducedMotion) setRipple(true);
    setTimeout(() => setRipple(false), 700);
    await postReviewEvent();
    setTimeout(() => {
      window.open(GOOGLE_BUSINESS_REVIEW_URL, "_blank", "noopener,noreferrer");
    }, 400);
  };

  const handleGoogleCTA = async () => {
    await postReviewEvent();
    window.open(GOOGLE_BUSINESS_REVIEW_URL, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(suggestedCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // ── LOCKED STATE ──────────────────────────────────────────────
  if (!isUnlocked) {
    return (
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#4A4A4A]" />
          </div>
        </div>
        <p className="text-[#8A8A8A] text-sm font-medium mb-1">
          Review unlocks after final release
        </p>
        <p className="text-[#4A4A4A] text-xs">
          We request reviews only after the matter is complete.
        </p>
      </div>
    );
  }

  // ── UNLOCKED STATE ─────────────────────────────────────────────
  return (
    <div className="bg-[#111111] border border-[#C6A55A]/20 rounded-2xl p-8 space-y-6">
      {/* Header */}
      <div>
        <p className="text-[#C6A55A] text-xs tracking-[0.3em] uppercase font-semibold mb-2">
          Share Your Experience
        </p>
        <h2 className="font-serif text-2xl text-white mb-2">
          Seal the Experience
        </h2>
        <p className="text-[#8A8A8A] text-sm leading-relaxed">
          If The Milano Seal handled your matter with clarity and care, your
          Google review helps future clients choose a secure path.
        </p>
      </div>

      {/* Star selector */}
      <div>
        <p className="text-[#8A8A8A] text-xs uppercase tracking-[0.15em] mb-3">
          Your Rating
        </p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none transition-transform hover:scale-110"
              aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
            >
              <Star
                className={`w-7 h-7 transition-colors ${
                  star <= (hoverRating || rating)
                    ? "fill-[#C6A55A] text-[#C6A55A]"
                    : "text-[#2A2A2A]"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="text-[#C6A55A] text-xs ml-2">
              {rating === 5
                ? "Excellent"
                : rating === 4
                  ? "Very Good"
                  : rating === 3
                    ? "Good"
                    : rating === 2
                      ? "Fair"
                      : "Poor"}
            </span>
          )}
        </div>
      </div>

      {/* Feedback textarea */}
      <div>
        <p className="text-[#8A8A8A] text-xs uppercase tracking-[0.15em] mb-2">
          Additional Feedback{" "}
          <span className="normal-case tracking-normal">(optional)</span>
        </p>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Any additional thoughts about your experience..."
          rows={3}
          className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-white text-sm placeholder:text-[#4A4A4A] focus:outline-none focus:border-[#C6A55A]/40 transition-colors resize-none"
        />
      </div>

      {/* Suggested copy */}
      <div>
        <p className="text-[#8A8A8A] text-xs uppercase tracking-[0.15em] mb-2">
          Suggested Review
        </p>
        <div className="relative bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4 pr-12">
          <p className="text-[#B0B0B0] text-sm leading-relaxed italic">
            &ldquo;{suggestedCopy}&rdquo;
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors text-[#8A8A8A] hover:text-[#C6A55A]"
            aria-label="Copy suggested review"
          >
            {copied ? (
              <CheckCheck className="w-4 h-4 text-[#C6A55A]" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
        {copied && (
          <p className="text-[#C6A55A] text-xs mt-1">Copied to clipboard</p>
        )}
      </div>

      {/* Seal Impression button */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <motion.button
            type="button"
            onClick={handleSealClick}
            disabled={stamped}
            whileHover={reducedMotion ? {} : { scale: 1.04 }}
            whileTap={reducedMotion ? {} : { scale: 0.92, rotate: -4 }}
            className={`relative w-28 h-28 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all cursor-pointer ${
              stamped
                ? "border-[#C6A55A] bg-[#C6A55A]/15"
                : "border-[#C6A55A]/50 bg-[#0A0A0A] hover:border-[#C6A55A] hover:bg-[#C6A55A]/8"
            } disabled:cursor-default`}
            aria-label={stamped ? "Review Path Opened" : "Seal Review"}
          >
            {/* Gold medallion face */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl select-none">
                {stamped ? "✓" : "⬡"}
              </span>
              <span
                className={`text-[10px] font-semibold tracking-[0.15em] uppercase ${
                  stamped ? "text-[#C6A55A]" : "text-[#8A8A8A]"
                }`}
              >
                {stamped ? "Opened" : "Seal"}
              </span>
            </div>

            {/* Ripple effect */}
            <AnimatePresence>
              {ripple && !reducedMotion && (
                <motion.span
                  key="ripple"
                  className="absolute inset-0 rounded-full bg-[#C6A55A]/30"
                  initial={{ opacity: 0.8, scale: 0.5 }}
                  animate={{ opacity: 0, scale: 2.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={stamped ? "opened" : "prompt"}
            initial={reducedMotion ? {} : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? {} : { opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="text-sm font-medium text-center"
          >
            {stamped ? (
              <span className="text-[#C6A55A]">Review Path Opened</span>
            ) : (
              <span className="text-[#8A8A8A]">Seal Review</span>
            )}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Separate Google CTA */}
      <button
        type="button"
        onClick={handleGoogleCTA}
        className="w-full flex items-center justify-center gap-2 py-3 border border-[#C6A55A]/30 text-[#C6A55A] rounded-xl text-sm font-medium hover:bg-[#C6A55A]/8 hover:border-[#C6A55A]/60 transition-all"
      >
        <ExternalLink className="w-4 h-4" />
        Leave a Google Review
      </button>
    </div>
  );
}
