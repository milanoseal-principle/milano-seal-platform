"use client";

import { useState } from "react";
import { scoreBidNoBid } from "@/lib/government/bidNoBidScoring";

export function BidNoBidScoringPanel() {
  const [fit, setFit] = useState(70);
  const [capabilityMatch, setCapabilityMatch] = useState(75);
  const [relationshipScore, setRelationshipScore] = useState(40);
  const [deadlineFeasibilityDays, setDeadlineFeasibilityDays] = useState(14);
  const [incumbentPresent, setIncumbentPresent] = useState(false);

  const result = scoreBidNoBid({
    fit,
    capabilityMatch,
    relationshipScore,
    deadlineFeasibilityDays,
    incumbentPresent,
  });

  const recColor =
    result.recommendation === "bid"
      ? "text-emerald-300"
      : result.recommendation === "no_bid"
      ? "text-red-300"
      : "text-amber-200";

  const field = "flex items-center justify-between gap-3 text-xs text-stone-300";

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Bid / No-Bid Scoring
      </h2>

      <div className="grid gap-3 md:grid-cols-2">
        <label className={field}>
          Fit
          <input type="range" min={0} max={100} value={fit}
            onChange={(e) => setFit(Number(e.target.value))} />
        </label>
        <label className={field}>
          Capability match
          <input type="range" min={0} max={100} value={capabilityMatch}
            onChange={(e) => setCapabilityMatch(Number(e.target.value))} />
        </label>
        <label className={field}>
          Relationship
          <input type="range" min={0} max={100} value={relationshipScore}
            onChange={(e) => setRelationshipScore(Number(e.target.value))} />
        </label>
        <label className={field}>
          Deadline (days)
          <input type="number" min={0} value={deadlineFeasibilityDays}
            className="w-16 rounded bg-black/60 px-2 py-1 text-amber-100"
            onChange={(e) => setDeadlineFeasibilityDays(Number(e.target.value))} />
        </label>
        <label className={field}>
          Incumbent present
          <input type="checkbox" checked={incumbentPresent}
            onChange={(e) => setIncumbentPresent(e.target.checked)} />
        </label>
      </div>

      <div className="mt-4 rounded-xl border border-amber-300/10 bg-black/40 p-3">
        <p className="text-xs text-stone-400">
          Score: <span className="text-amber-100">{result.score}</span> ·
          Recommendation:{" "}
          <span className={`font-semibold uppercase ${recColor}`}>
            {result.recommendation.replace("_", " ")}
          </span>
        </p>
        <ul className="mt-2 space-y-1 text-[11px] text-stone-400">
          {result.reasons.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
