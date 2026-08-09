"use client";

import { useState } from "react";
import { ShieldCheck, MailCheck, Loader2 } from "lucide-react";

// Post-intake secure account creation. Creates a Supabase auth account via
// /api/auth/signup (email confirmation required); the confirmed email binds the
// client to their Matter through email-based RLS. This card never sees payment
// or discount state — account creation is not payment.
export function CreateAccountCard({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setStatus("submitting");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Sign-up failed. Please try again.");
      setStatus("sent");
    } catch (cause) {
      setStatus("idle");
      setError(cause instanceof Error ? cause.message : "Sign-up failed. Please try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-[rgba(198,165,90,0.28)] bg-[#0A0A0A] px-6 py-7">
        <div className="flex items-center gap-2 text-[var(--ms-gold,#C6A55A)]">
          <MailCheck className="h-5 w-5" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Confirm your email</span>
        </div>
        <p className="mt-3 text-sm font-light text-[#C9C3B8]">
          We&rsquo;ve sent a confirmation link to <span className="text-[#E8DCC0]">{email}</span>. Confirm it,
          then sign in to view your matter, invoice, and status in your private portal.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[rgba(198,165,90,0.28)] bg-[#0A0A0A] px-6 py-7">
      <div className="flex items-center gap-2 text-[var(--ms-gold,#C6A55A)]">
        <ShieldCheck className="h-5 w-5" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Create your secure account</span>
      </div>
      <p className="mt-2 text-[12px] font-light text-[#9A9488]">
        Use the same email you entered for this matter so your portal shows your matter and nobody else&rsquo;s.
      </p>
      <div className="mt-5 grid grid-cols-1 gap-3">
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ms-gold,#C6A55A)]/70">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full min-h-12 rounded-sm border border-[rgba(198,165,90,0.18)] bg-[#0A0A0A] px-4 py-3 text-base text-white placeholder:text-[#9A9488]/50 focus:border-[var(--ms-gold,#C6A55A)] focus:outline-none sm:text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ms-gold,#C6A55A)]/70">Password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full min-h-12 rounded-sm border border-[rgba(198,165,90,0.18)] bg-[#0A0A0A] px-4 py-3 text-base text-white placeholder:text-[#9A9488]/50 focus:border-[var(--ms-gold,#C6A55A)] focus:outline-none sm:text-sm"
          />
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={status === "submitting"}
        className="mt-5 min-h-12 w-full rounded-sm bg-[var(--ms-gold,#C6A55A)] px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0A0A0A] transition hover:bg-[#D4BB7A] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {status === "submitting" ? (
          <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Creating account…</>
        ) : (
          "Create Account"
        )}
      </button>
      <p className="mt-3 text-[11px] font-light text-[#9A9488]">
        Creating an account does not confirm payment. Scheduling unlocks only after your Wise payment is verified.
      </p>
    </div>
  );
}
