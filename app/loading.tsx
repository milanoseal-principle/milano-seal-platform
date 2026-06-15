export default function Loading() {
  return (
    <div
      style={{
        minHeight: "100svh",
        background: "#050507",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/milano-seal-feather-m-orb.svg"
        alt=""
        aria-hidden="true"
        style={{
          width: 52,
          height: 52,
          opacity: 0.7,
          animation: "ms-load-pulse 2s ease-in-out infinite",
        }}
      />
      <p
        style={{
          fontFamily: "monospace",
          fontSize: 9,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "rgba(198,165,90,0.45)",
          margin: 0,
        }}
      >
        Preparing secure environment
      </p>
      <style>{`
        @keyframes ms-load-pulse {
          0%, 100% { opacity: 0.45; filter: drop-shadow(0 0 6px rgba(198,165,90,0.15)); }
          50% { opacity: 0.8; filter: drop-shadow(0 0 18px rgba(198,165,90,0.35)); }
        }
      `}</style>
    </div>
  );
}
