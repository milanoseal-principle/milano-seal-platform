"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class PortalClientErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Never log client Matter data or credentials from this boundary.
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-[#070707] px-5 py-16 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-[rgba(198,165,90,0.28)] bg-[#0D0D0F] p-7 shadow-[0_30px_80px_rgba(0,0,0,.55)] sm:p-10">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ms-gold)]">
            Secure Matter Portal
          </div>
          <h1 className="mt-3 font-serif text-2xl text-[#E8DCC0]">
            Your portal did not finish loading.
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/55">
            Your account and Matter remain secure. Reload the portal to continue. If the issue repeats, return to the login gateway and sign in again.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-11 rounded-sm bg-[var(--ms-gold)] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#070504]"
            >
              Reload Portal
            </button>
            <button
              type="button"
              onClick={() => window.location.assign("/login?next=/portal")}
              className="min-h-11 rounded-sm border border-[rgba(198,165,90,0.28)] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ms-gold)]"
            >
              Return to Login
            </button>
          </div>
        </div>
      </main>
    );
  }
}
