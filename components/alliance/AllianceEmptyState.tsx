import { LucideIcon } from "lucide-react";

interface AllianceEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function AllianceEmptyState({ icon: Icon, title, description }: AllianceEmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        textAlign: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "rgba(198,166,91,0.06)",
          border: "1px solid rgba(198,166,91,0.16)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={22} color="#C6A55A" strokeWidth={1.5} />
      </div>
      <div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: "#F6F1E6",
            marginBottom: 6,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#A8A29A",
            maxWidth: 320,
            lineHeight: 1.6,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
}
