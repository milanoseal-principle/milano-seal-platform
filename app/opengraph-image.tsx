import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt =
  "The Milano Seal™ — U.S. Document Execution for International Use";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Inline the Gold M Orb once at module load as a data URI so the OG renderer
// never fetches over the network. High-contrast mark reads well at thumbnail size.
const orbDataUri = (() => {
  try {
    const bytes = readFileSync(
      join(process.cwd(), "public", "milano-seal-orb-v2.png"),
    );
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
})();

export default function OpengraphImage() {
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
            "radial-gradient(circle at 50% 30%, #16130B 0%, #0A0A0C 58%, #050506 100%)",
          position: "relative",
          fontFamily: "serif",
        }}
      >
        {/* Hairline gold frame */}
        <div
          style={{
            position: "absolute",
            top: 26,
            left: 26,
            right: 26,
            bottom: 26,
            border: "1px solid rgba(198,165,90,0.30)",
            borderRadius: 20,
          }}
        />

        {orbDataUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={orbDataUri}
            width={312}
            height={312}
            alt=""
            style={{ marginBottom: 14 }}
          />
        ) : null}

        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 14,
            color: "#C6A55A",
            fontFamily: "sans-serif",
            marginBottom: 16,
          }}
        >
          THE MILANO SEAL™
        </div>

        <div
          style={{
            display: "flex",
            textAlign: "center",
            fontSize: 46,
            lineHeight: 1.15,
            color: "#FFFFFF",
            maxWidth: 900,
            justifyContent: "center",
            padding: "0 60px",
          }}
        >
          U.S. Document Execution for International Use
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 50,
            display: "flex",
            fontSize: 22,
            letterSpacing: 4,
            color: "rgba(198,165,90,0.75)",
            fontFamily: "sans-serif",
          }}
        >
          themilanoseal.com
        </div>
      </div>
    ),
    { ...size },
  );
}
