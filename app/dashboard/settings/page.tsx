import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";

export const metadata = {
  title: "Platform Settings — The Milano Seal™",
  robots: { index: false, follow: false },
};

const SETTINGS_DESTINATIONS = [
  {
    label: "System Control Plane",
    description: "Review the system registry, execution ownership, and deployment identity.",
    href: "/dashboard/control-plane",
  },
  {
    label: "Integration Health",
    description: "Review read-only provider and infrastructure health indicators.",
    href: "/dashboard/monitoring",
  },
  {
    label: "Security",
    description: "Review operator access controls and security audit posture.",
    href: "/dashboard/security",
  },
] as const;

export default function PlatformSettingsPage() {
  return (
    <div className="mx-auto max-w-5xl pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <DashboardPageHeader
        eyebrow="System · Governed Configuration"
        title="Platform Settings"
        description="Read-only entry points for platform governance. Provider credentials and environment configuration remain in their controlled server-side systems."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {SETTINGS_DESTINATIONS.map((destination) => (
          <a
            key={destination.href}
            href={destination.href}
            className="rounded-2xl border border-gold/20 bg-black/30 p-5 transition-colors hover:border-gold/45 hover:bg-gold/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold/65">
              Governed destination
            </p>
            <h2 className="mt-3 font-serif text-xl text-foreground">{destination.label}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {destination.description}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
