interface ReadinessItem {
  key: string;
  label: string;
  done: boolean;
}

interface AllianceReadinessScoreProps {
  profileComplete: boolean;
  toolbeltCompleted: boolean;
  complianceVerified: boolean;
  securityAttested: boolean;
  routingEligible: boolean;
}

export function AllianceReadinessScore({
  profileComplete,
  toolbeltCompleted,
  complianceVerified,
  securityAttested,
  routingEligible,
}: AllianceReadinessScoreProps) {
  const items: ReadinessItem[] = [
    { key: "profile", label: "Profile", done: profileComplete },
    { key: "toolbelt", label: "Tool Belt", done: toolbeltCompleted },
    { key: "compliance", label: "Compliance", done: complianceVerified },
    { key: "security", label: "Security", done: securityAttested },
    { key: "routing", label: "Routing", done: routingEligible },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const pct = Math.round((doneCount / items.length) * 100);

  // SVG ring
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return (
    <div
      style={{
        padding: "24px",
        background: "#111111",
        border: "1px solid rgba(198,166,91,0.16)",
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "#A8A29A" }}>
        Partner Readiness
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {/* Ring */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg width={96} height={96} viewBox="0 0 96 96">
            <circle cx={48} cy={48} r={radius} fill="none" stroke="rgba(198,166,91,0.1)" strokeWidth={6} />
            <circle
              cx={48}
              cy={48}
              r={radius}
              fill="none"
              stroke="#C6A55A"
              strokeWidth={6}
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 48 48)"
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 700, color: "#C6A55A", fontFamily: "monospace" }}>{pct}%</span>
          </div>
        </div>

        {/* Items */}
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {items.map((item) => (
            <li
              key={item.key}
              style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: item.done ? "#3FA47A" : "rgba(255,255,255,0.1)",
                  border: item.done ? "none" : "1px solid rgba(255,255,255,0.15)",
                }}
              />
              <span style={{ color: item.done ? "#F6F1E6" : "#A8A29A" }}>{item.label}</span>
              {item.done && (
                <span style={{ marginLeft: "auto", fontSize: 10, color: "#3FA47A", fontFamily: "monospace" }}>✓</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
