"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ForgotPasswordInner() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const expired = searchParams.get("error") === "expired";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/password/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070504] px-4 py-16 text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center">
        <div className="w-full rounded-xl border border-[#C6A55A]/20 bg-[#0C0904] p-7 shadow-[0_32px_96px_rgba(0,0,0,.65)] sm:p-9">
          <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#C6A55A]/70">Secure Account Recovery</div>
          <h1 className="mt-3 font-serif text-3xl">Reset your portal password</h1>
          <p className="mt-3 text-sm leading-6 text-white/45">
            Enter the email used for your Milano Seal account. If an account exists, a secure reset link will be sent to that address.
          </p>

          {expired && (
            <div className="mt-5 rounded-md border border-amber-300/20 bg-amber-300/[0.05] px-4 py-3 text-xs leading-5 text-amber-100/75">
              That password-reset link is expired or already used. Request a new one below.
            </div>
          )}

          {sent ? (
            <div className="mt-7 rounded-lg border border-emerald-400/25 bg-emerald-400/[0.05] p-5">
              <div className="text-sm font-medium text-emerald-200">Check your email.</div>
              <p className="mt-2 text-xs leading-5 text-white/45">If that address is registered, you will receive a secure password-reset link. Return to login after setting the new password.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-7">
              <label htmlFor="recovery-email" className="block font-mono text-[9px] uppercase tracking-[0.16em] text-white/45">Email address</label>
              <input
                id="recovery-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-md border border-[#C6A55A]/20 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#C6A55A]/60"
                placeholder="you@example.com"
              />
              <button
                type="submit"
                disabled={busy}
                className="mt-4 min-h-12 w-full rounded-md bg-[#C6A55A] px-5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#080604] transition hover:bg-[#D7B96E] disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send secure reset link"}
              </button>
            </form>
          )}

          <Link href="/login?next=/portal" className="mt-6 inline-flex text-xs text-[#C6A55A]/75 underline decoration-[#C6A55A]/25 underline-offset-4 hover:text-[#C6A55A]">
            Return to Secure Matter Portal login
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070504]" />}>
      <ForgotPasswordInner />
    </Suspense>
  );
}
