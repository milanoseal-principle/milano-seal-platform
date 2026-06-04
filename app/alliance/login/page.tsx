"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shield } from "lucide-react";

export default function AllianceLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    router.push("/alliance/dashboard");
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/alliance/dashboard` },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setMagicSent(true);
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(198,166,91,0.2)",
    borderRadius: 4,
    color: "#F6F1E6",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(198,166,91,0.08)",
              border: "1px solid rgba(198,166,91,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Shield size={20} color="#C6A55A" />
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "#C6A55A",
              marginBottom: 8,
            }}
          >
            The Milano Seal™
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 300,
              fontFamily: "var(--font-playfair, Georgia, serif)",
              color: "#F6F1E6",
              margin: 0,
            }}
          >
            Alliance Partner Portal
          </h1>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(198,166,91,0.16)",
            borderRadius: 8,
            padding: "32px",
          }}
        >
          {magicSent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "#3FA47A", marginBottom: 12 }}>Check your email</div>
              <p style={{ fontSize: 13, color: "#A8A29A", lineHeight: 1.6 }}>
                A sign-in link has been sent to <strong style={{ color: "#F6F1E6" }}>{email}</strong>. Click the link to access the Alliance Portal.
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#F6F1E6", marginBottom: 4 }}>Partner Sign In</div>
                <div style={{ fontSize: 12, color: "#A8A29A" }}>Access requires an approved Alliance Partner account.</div>
              </div>

              {/* Mode toggle */}
              <div
                style={{
                  display: "flex",
                  gap: 0,
                  marginBottom: 24,
                  border: "1px solid rgba(198,166,91,0.15)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                {(["password", "magic"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      flex: 1,
                      padding: "8px",
                      background: mode === m ? "rgba(198,166,91,0.1)" : "transparent",
                      border: "none",
                      color: mode === m ? "#C6A55A" : "#A8A29A",
                      fontSize: 12,
                      fontFamily: "monospace",
                      letterSpacing: "0.08em",
                      cursor: "pointer",
                    }}
                  >
                    {m === "password" ? "Password" : "Magic Link"}
                  </button>
                ))}
              </div>

              <form onSubmit={mode === "password" ? handlePasswordLogin : handleMagicLink}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 6 }}>
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      style={inputStyle}
                    />
                  </div>

                  {mode === "password" && (
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 6 }}>
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        style={inputStyle}
                      />
                    </div>
                  )}

                  {error && (
                    <div style={{ fontSize: 12, color: "#B85C5C", padding: "8px 12px", background: "rgba(184,92,92,0.06)", border: "1px solid rgba(184,92,92,0.2)", borderRadius: 4 }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: "11px",
                      background: "rgba(198,166,91,0.12)",
                      border: "1px solid rgba(198,166,91,0.35)",
                      borderRadius: 4,
                      color: "#C6A55A",
                      fontSize: 13,
                      fontFamily: "monospace",
                      letterSpacing: "0.1em",
                      cursor: "pointer",
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {loading ? "Signing in..." : mode === "password" ? "Sign In" : "Send Magic Link"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <a
            href="/alliance"
            style={{ fontSize: 12, color: "#A8A29A", textDecoration: "none" }}
          >
            Request Alliance Access →
          </a>
        </div>
      </div>
    </div>
  );
}
