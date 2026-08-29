"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.assign("/forgot-password?error=expired");
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      window.location.assign("/login?password_reset=1&next=/portal");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Password could not be updated.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070504] px-4 py-16 text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center">
        <div className="w-full rounded-xl border border-[#C6A55A]/20 bg-[#0C0904] p-7 shadow-[0_32px_96px_rgba(0,0,0,.65)] sm:p-9">
          <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#C6A55A]/70">Secure Account Recovery</div>
          <h1 className="mt-3 font-serif text-3xl">Create a new password</h1>
          <p className="mt-3 text-sm leading-6 text-white/45">Set the password you will use to enter the Secure Matter Portal.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="new-password" className="block font-mono text-[9px] uppercase tracking-[0.16em] text-white/45">New password</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="mt-2 min-h-12 w-full rounded-md border border-[#C6A55A]/20 bg-black/30 px-4 text-sm text-white outline-none focus:border-[#C6A55A]/60"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block font-mono text-[9px] uppercase tracking-[0.16em] text-white/45">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
                className="mt-2 min-h-12 w-full rounded-md border border-[#C6A55A]/20 bg-black/30 px-4 text-sm text-white outline-none focus:border-[#C6A55A]/60"
              />
            </div>

            {error && <div className="rounded-md border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-xs text-red-200">{error}</div>}

            <button
              type="submit"
              disabled={busy}
              className="min-h-12 w-full rounded-md bg-[#C6A55A] px-5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#080604] transition hover:bg-[#D7B96E] disabled:opacity-50"
            >
              {busy ? "Updating…" : "Save password & return to login"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
