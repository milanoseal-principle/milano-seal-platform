"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AlliancePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError || !data.session) {
        router.push("/login?next=/alliance");
        return;
      }

      setUser(data.session.user);
      setIsLoading(false);
    });
  }, [router]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#0a0a0a", color: "#888" }}>
        Loading Alliance Portal…
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
          Alliance Partner Portal
        </h1>
        <p style={{ color: "#8a8a8a", marginBottom: "40px" }}>
          Manage your referrals and track international document executions
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
            This portal provides access to your referral dashboard, matter statistics, and scheduling tools.
            Your alliance partnership unlocks exclusive rates and priority scheduling for your clients.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginTop: "24px" }}>
            <div style={{
              background: "rgba(15,15,15,.5)",
              border: "1px solid rgba(198,165,90,.1)",
              borderRadius: "4px",
              padding: "16px",
            }}>
              <div style={{ fontSize: "12px", color: "#8a8a8a", marginBottom: "8px" }}>Total Referrals</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#C6A55A" }}>—</div>
            </div>
            <div style={{
              background: "rgba(15,15,15,.5)",
              border: "1px solid rgba(198,165,90,.1)",
              borderRadius: "4px",
              padding: "16px",
            }}>
              <div style={{ fontSize: "12px", color: "#8a8a8a", marginBottom: "8px" }}>Completed Matters</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#C6A55A" }}>—</div>
            </div>
            <div style={{
              background: "rgba(15,15,15,.5)",
              border: "1px solid rgba(198,165,90,.1)",
              borderRadius: "4px",
              padding: "16px",
            }}>
              <div style={{ fontSize: "12px", color: "#8a8a8a", marginBottom: "8px" }}>This Month Revenue</div>
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
            Full alliance dashboard features are coming soon. Your data will sync automatically once available.
          </p>
        </div>
      </div>
    </div>
  );
}
