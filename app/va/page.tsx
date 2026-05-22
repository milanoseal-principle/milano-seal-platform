"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function VAPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError || !data.session) {
        router.push("/login?next=/va");
        return;
      }

      setUser(data.session.user);
      setIsLoading(false);
    });
  }, [router]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#0a0a0a", color: "#888" }}>
        Loading Virtual Assistant Portal…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px 20px", backgroundColor: "#0a0a0a", color: "#f87171" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" }}>Access Denied</h1>
          <p>{error}</p>
          <button
            onClick={() => router.push("/login")}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              background: "#C6A55A",
              color: "#0a0a0a",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#0a0a0a", minHeight: "100vh", color: "#b0b0b0" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#fff", marginBottom: "8px" }}>
          Virtual Assistant Portal
        </h1>
        <p style={{ color: "#8a8a8a", marginBottom: "40px" }}>
          Administrative tools for managing scheduling, documents, and client communications
        </p>

        <div style={{
          background: "rgba(198,165,90,.06)",
          border: "1px solid rgba(198,165,90,.2)",
          borderRadius: "8px",
          padding: "32px",
          marginBottom: "32px",
        }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#C6A55A", marginBottom: "16px" }}>
            Welcome, {user?.email}
          </h2>
          <p style={{ lineHeight: "1.6", marginBottom: "16px" }}>
            Your VA account provides access to the administrative backend, including scheduling coordination,
            document management, and communication templates. All activities are logged and attributed to your account.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginTop: "24px" }}>
            <div style={{
              background: "rgba(15,15,15,.5)",
              border: "1px solid rgba(198,165,90,.1)",
              borderRadius: "4px",
              padding: "16px",
            }}>
              <div style={{ fontSize: "12px", color: "#8a8a8a", marginBottom: "8px" }}>Active Matters</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#C6A55A" }}>—</div>
            </div>
            <div style={{
              background: "rgba(15,15,15,.5)",
              border: "1px solid rgba(198,165,90,.1)",
              borderRadius: "4px",
              padding: "16px",
            }}>
              <div style={{ fontSize: "12px", color: "#8a8a8a", marginBottom: "8px" }}>Today's Schedule</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#C6A55A" }}>—</div>
            </div>
            <div style={{
              background: "rgba(15,15,15,.5)",
              border: "1px solid rgba(198,165,90,.1)",
              borderRadius: "4px",
              padding: "16px",
            }}>
              <div style={{ fontSize: "12px", color: "#8a8a8a", marginBottom: "8px" }}>Pending Reviews</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#C6A55A" }}>—</div>
            </div>
          </div>
        </div>

        <div style={{
          background: "rgba(15,15,15,.3)",
          border: "1px dashed rgba(198,165,90,.2)",
          borderRadius: "8px",
          padding: "32px",
          textAlign: "center",
        }}>
          <p style={{ color: "#8a8a8a" }}>
            Full VA dashboard features are coming soon. Your data will sync automatically once available.
          </p>
        </div>
      </div>
    </div>
  );
}
