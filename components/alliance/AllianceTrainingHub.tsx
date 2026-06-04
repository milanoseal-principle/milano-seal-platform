"use client";

import { BookOpen, CheckCircle, Lock, Clock } from "lucide-react";

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  status: "not_started" | "in_progress" | "completed" | "locked";
  duration_min?: number;
}

interface AllianceTrainingHubProps {
  modules?: TrainingModule[];
  partnerType?: string;
}

const statusConfig = {
  completed: { label: "Completed", color: "#3FA47A", bg: "rgba(63,164,122,0.08)", border: "rgba(63,164,122,0.24)" },
  in_progress: { label: "In Progress", color: "#C99A3D", bg: "rgba(201,154,61,0.08)", border: "rgba(201,154,61,0.24)" },
  not_started: { label: "Not Started", color: "#A8A29A", bg: "rgba(168,162,154,0.06)", border: "rgba(198,165,90,0.14)" },
  locked: { label: "Locked", color: "rgba(168,162,154,0.4)", bg: "rgba(0,0,0,0.2)", border: "rgba(168,162,154,0.1)" },
};

export function AllianceTrainingHub({ modules = [], partnerType }: AllianceTrainingHubProps) {
  if (modules.length === 0) {
    return (
      <div style={{
        padding: 32,
        textAlign: "center",
        border: "1px solid rgba(198,165,90,0.16)",
        borderRadius: 16,
        background: "#0B0B0B",
      }}>
        <BookOpen size={32} color="rgba(198,165,90,0.3)" style={{ marginBottom: 12 }} />
        <p style={{ color: "#A8A29A", fontSize: 13, margin: 0 }}>
          No training modules available yet.
        </p>
      </div>
    );
  }

  const completed = modules.filter((m) => m.status === "completed").length;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C6A55A" }}>
            / TRAINING HUB /
          </p>
          <h2 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 500, color: "#F6F1E6" }}>
            Partner Training
          </h2>
          {partnerType && (
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#A8A29A" }}>
              {partnerType.replace(/_/g, " ")}
            </p>
          )}
        </div>
        <div style={{
          padding: "6px 14px",
          background: "rgba(198,165,90,0.08)",
          border: "1px solid rgba(198,165,90,0.24)",
          borderRadius: 999,
          fontSize: 11,
          color: "#C6A55A",
          fontFamily: "var(--font-mono, monospace)",
        }}>
          {completed} / {modules.length} complete
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {modules.map((mod) => {
          const cfg = statusConfig[mod.status];
          const isLocked = mod.status === "locked";
          return (
            <div
              key={mod.id}
              style={{
                padding: 18,
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                borderRadius: 12,
                opacity: isLocked ? 0.5 : 1,
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {mod.status === "completed"
                    ? <CheckCircle size={16} color="#3FA47A" />
                    : isLocked
                      ? <Lock size={14} color="rgba(168,162,154,0.4)" />
                      : <BookOpen size={16} color={cfg.color} />
                  }
                  <span style={{
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: cfg.color,
                    fontWeight: 600,
                  }}>
                    {cfg.label}
                  </span>
                </div>
                {mod.duration_min && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={11} color="rgba(168,162,154,0.5)" />
                    <span style={{ fontSize: 10, color: "#A8A29A" }}>{mod.duration_min}m</span>
                  </div>
                )}
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: isLocked ? "#A8A29A" : "#F6F1E6" }}>
                {mod.title}
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "#A8A29A", lineHeight: 1.55 }}>
                {mod.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
