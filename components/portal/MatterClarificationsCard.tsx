"use client";

import { useEffect, useReducer } from "react";
import { usePortal } from "@/components/portal/portal-context";
import {
  clarificationComplete,
  clarificationReducer,
  initialClarificationState,
  type ClarificationView,
} from "@/lib/portal/clarificationCardState";

// Asks only the facts Milano still needs for this Matter. Answers are the client's
// own statements; Milano confirms them before any quote is issued.
export function MatterClarificationsCard() {
  const { deal } = usePortal();
  const matterId = deal?.id ?? null;
  const [state, dispatch] = useReducer(clarificationReducer, matterId, initialClarificationState);
  const { view, answers, busy, message } = state;

  useEffect(() => {
    // Resets all per-Matter state, including a submission still in flight for the previous Matter.
    dispatch({ type: "matter_changed", matterId });
    if (!matterId) return;
    fetch(`/api/portal/me/clarifications?deal_id=${encodeURIComponent(matterId)}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: ClarificationView | null) => {
        if (body) dispatch({ type: "view_loaded", matterId, view: body });
      })
      .catch(() => undefined);
  }, [matterId]);

  if (!matterId || state.matterId !== matterId || !view || view.status === "closed" || view.status === "review_confirmed") return null;

  if (view.status === "awaiting_milano_review") {
    return (
      <section aria-label="Matter details" className="rounded-xl border border-[#C6A55A]/15 bg-white/[0.015] p-5">
        <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-[#C6A55A]/70">Matter details</div>
        <p className="mt-2 text-sm leading-6 text-white/60">
          {message ?? "Thank you. Milano has the details it needs and is reviewing your Matter. Your quote appears here once it is issued."}
        </p>
      </section>
    );
  }

  const complete = clarificationComplete(state);
  const setAnswer = (fact: string, value: string) => dispatch({ type: "answer_changed", matterId, fact, value });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!complete || busy || !matterId) return;
    const requested = matterId;
    dispatch({ type: "submit_started", matterId: requested });
    try {
      const response = await fetch("/api/portal/me/clarifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: requested, answers }),
      });
      const body = (await response.json().catch(() => null)) as (ClarificationView & { ok?: boolean }) | null;
      // Results are scoped to `requested`; the reducer ignores them if the client has switched Matters.
      if (!response.ok || !body?.ok) {
        dispatch({ type: "submit_failed", matterId: requested, message: "Your answers could not be saved. Please try again, or message your Matter coordinator." });
        return;
      }
      dispatch({ type: "submit_succeeded", matterId: requested, view: body });
    } catch {
      dispatch({ type: "submit_failed", matterId: requested, message: "We could not reach the server. Check your connection and try again." });
    }
  }

  return (
    <section aria-label="Information needed for your quote" className="rounded-xl border border-[#C6A55A]/25 bg-[#C6A55A]/[0.035] p-5">
      <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-[#C6A55A]/80">Information needed for your quote</div>
      <p className="mt-2 text-sm leading-6 text-white/55">
        Milano needs a few details to prepare your quote. Answer what you know; Milano confirms everything with you before any payment.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-4">
        {view.questions.map((q) => (
          <fieldset key={q.fact} className="space-y-2">
            <legend className="text-sm text-[#F6F1E6]">{q.prompt}</legend>
            {q.help && <p className="text-xs leading-5 text-white/40">{q.help}</p>}
            {q.kind === "choice" ? (
              <div className="grid gap-2">
                {q.options?.map((option) => (
                  <label key={option.value} className="flex min-h-11 items-center gap-3 rounded-md border border-white/10 bg-black/20 px-3 text-sm text-white/75">
                    <input
                      type="radio"
                      name={q.fact}
                      value={option.value}
                      checked={answers[q.fact] === option.value}
                      onChange={() => setAnswer(q.fact, option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            ) : (
              <input
                aria-label={q.prompt}
                maxLength={300}
                value={answers[q.fact] ?? ""}
                onChange={(event) => setAnswer(q.fact, event.target.value)}
                className="min-h-11 w-full rounded-md border border-[#C6A55A]/20 bg-black/30 px-3 text-sm text-white outline-none focus:border-[#C6A55A]/60"
              />
            )}
          </fieldset>
        ))}
        {message && <p role="status" className="text-xs leading-5 text-amber-100/80">{message}</p>}
        <button
          type="submit"
          disabled={!complete || busy}
          className="min-h-11 w-full rounded-md bg-[#C6A55A] px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#090909] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Sending…" : "Send answers"}
        </button>
      </form>
    </section>
  );
}
