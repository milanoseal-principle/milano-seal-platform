// Canonical dashboard design tokens — premium black / gold / ivory.
// Mirrors the existing CSS variables (--ms-gold) and Tailwind theme used by
// MilanoShell so the new system layer matches the shell exactly. Import these for
// inline styles where a Tailwind token isn't convenient; prefer the Tailwind
// classes (text-gold, bg-background, border-border) inside JSX.

export const dashboardTheme = {
  bgRoot: "#050505",
  bgPanel: "#0B0B0B",
  bgPanelSoft: "#11100D",
  borderGoldSoft: "rgba(198,166,91,0.22)",
  borderSoft: "rgba(255,255,255,0.07)",
  gold: "#C6A65B",
  goldBright: "#E0C477",
  ivory: "#F5F1E8",
  muted: "#A8A29A",
  danger: "#C2554E",
  success: "#5B9D77",
  warning: "#C89A4A",
  navy: "#5B7299",
} as const;

export type DashboardTone =
  | "gold"
  | "green"
  | "red"
  | "blue"
  | "amber"
  | "neutral";

// Tone → restrained color set for cards/pills/badges. Calm, never neon.
export const toneStyles: Record<
  DashboardTone,
  { fg: string; bg: string; border: string }
> = {
  gold: { fg: "#E0C477", bg: "rgba(198,166,91,0.08)", border: "rgba(198,166,91,0.30)" },
  green: { fg: "#7FBF9B", bg: "rgba(91,157,119,0.08)", border: "rgba(91,157,119,0.28)" },
  red: { fg: "#E08A82", bg: "rgba(194,85,78,0.08)", border: "rgba(194,85,78,0.30)" },
  blue: { fg: "#90A6C7", bg: "rgba(91,114,153,0.08)", border: "rgba(91,114,153,0.28)" },
  amber: { fg: "#D8B05E", bg: "rgba(200,154,74,0.08)", border: "rgba(200,154,74,0.30)" },
  neutral: { fg: "#C9C4BA", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.10)" },
};
