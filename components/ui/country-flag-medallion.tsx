interface CountryFlagMedallionProps {
  flag: string;
  name: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { outer: "w-8 h-8", inner: "text-base" },
  md: { outer: "w-10 h-10", inner: "text-xl" },
  lg: { outer: "w-14 h-14", inner: "text-3xl" },
};

export function CountryFlagMedallion({ flag, name, size = "md" }: CountryFlagMedallionProps) {
  const { outer, inner } = SIZE_MAP[size];
  return (
    <div
      className={`${outer} shrink-0 rounded-full flex items-center justify-center relative`}
      style={{
        background: "radial-gradient(circle at 38% 35%, #18160f 0%, #0b0a06 100%)",
        border: "1px solid rgba(198,165,90,0.32)",
        boxShadow: "inset 0 2px 8px rgba(0,0,0,0.6), 0 0 12px rgba(198,165,90,0.08)",
      }}
      aria-label={`${name} flag`}
    >
      <span className={`${inner} leading-none select-none`} aria-hidden="true" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}>
        {flag}
      </span>
    </div>
  );
}
