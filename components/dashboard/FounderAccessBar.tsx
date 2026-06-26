import Link from "next/link";

const PORTALS = [
  { label: "Operator Dashboard", href: "/dashboard", tag: "OPS" },
  { label: "Secure Matter Portal", href: "/portal", tag: "CLIENT" },
  { label: "Alliance Dashboard", href: "/alliance/dashboard", tag: "ALLIANCE" },
  { label: "Operations Desk", href: "/va/dashboard", tag: "VA" },
];

export function FounderAccessBar() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 16px",
      background: "rgba(198,165,90,0.05)",
      border: "1px solid rgba(198,165,90,0.18)",
      borderRadius: 8,
      marginBottom: 16,
      flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", marginRight: 4 }}>
        Founder Access
      </span>
      {PORTALS.map((p) => (
        <Link key={p.href} href={p.href} style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 10px",
          border: "1px solid rgba(198,165,90,0.22)",
          borderRadius: 4,
          background: "rgba(198,165,90,0.04)",
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--ms-gold)",
          textDecoration: "none",
          transition: "background 0.15s",
        }}>
          {p.label}
        </Link>
      ))}
    </div>
  );
}
