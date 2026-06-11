import Image from "next/image";

interface RitualMedallionProps {
  reduced?: boolean;
}

export function RitualMedallion({ reduced: _reduced }: RitualMedallionProps) {
  return (
    <div
      style={{
        width: "clamp(180px, 28vw, 320px)",
        height: "clamp(180px, 28vw, 320px)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Outer orbital ring */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "1px solid rgba(212,175,55,0.3)",
          boxShadow: "0 0 32px rgba(212,175,55,0.08)",
        }}
      />
      {/* Inner dashed ring */}
      <div
        style={{
          position: "absolute",
          inset: "12%",
          borderRadius: "50%",
          border: "1px dashed rgba(212,175,55,0.18)",
        }}
      />
      {/* Real logo — no SVG floral ornaments */}
      <Image
        src="/milano-seal-gold-transparent-512.png"
        alt="The Milano Seal"
        width={280}
        height={280}
        priority
        style={{
          width: "clamp(140px, 22vw, 260px)",
          height: "clamp(140px, 22vw, 260px)",
          objectFit: "contain",
          position: "relative",
          zIndex: 1,
          filter: "drop-shadow(0 0 18px rgba(212,175,55,0.35))",
        }}
      />
      {/* Bottom mini seal badge */}
      <div
        style={{
          position: "absolute",
          bottom: "-8px",
          left: "50%",
          transform: "translateX(-50%)",
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "#050507",
          border: "1.5px solid rgba(212,175,55,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          boxShadow: "0 0 10px rgba(212,175,55,0.2)",
        }}
      >
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 14,
            color: "#C6A55A",
            lineHeight: 1,
          }}
        >
          M
        </span>
      </div>
    </div>
  );
}
