import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt =
  "The Milano Seal™ — U.S. Document Execution for International Use";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const sealDataUri = (() => {
  try {
    const bytes = readFileSync(
      join(process.cwd(), "public", "milano-seal-gold-transparent-512.png"),
    );
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
})();

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 50% 32%, #15120A 0%, #08080A 55%, #050507 100%)",
          position: "relative",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 28,
            right: 28,
            bottom: 28,
            border: "1px solid rgba(198,165,90,0.35)",
            borderRadius: 18,
          }}
        />

        {sealDataUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sealDataUri}
            width={150}
            height={112}
            alt=""
            style={{ marginBottom: 28 }}
          />
        ) : null}

        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 14,
            color: "#C6A55A",
            fontFamily: "sans-serif",
            marginBottom: 18,
          }}
        >
          THE MILANO SEAL™
        </div>

        <div
          style={{
            display: "flex",
            textAlign: "center",
            fontSize: 56,
            lineHeight: 1.15,
            color: "#FFFFFF",
            maxWidth: 880,
            justifyContent: "center",
            padding: "0 40px",
          }}
        >
          U.S. Document Execution for International Use
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 22,
            letterSpacing: 5,
            color: "rgba(255,255,255,0.55)",
            fontFamily: "sans-serif",
          }}
        >
          SEALING TRUST IN EVERY SIGNATURE
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 56,
            display: "flex",
            gap: 18,
            alignItems: "center",
            fontSize: 18,
            letterSpacing: 3,
            color: "rgba(198,165,90,0.7)",
            fontFamily: "sans-serif",
          }}
        >
          REMOTE ONLINE NOTARIZATION
          <span style={{ color: "rgba(198,165,90,0.4)" }}>·</span>
          APOSTILLE COORDINATION
        </div>
      </div>
    ),
    { ...size },
  );
}
