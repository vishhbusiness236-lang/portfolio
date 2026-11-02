import { ImageResponse } from "next/og";

export const alt = "Vishesh Meena • Portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#14110e",
          padding: 80,
          color: "#f4efe6",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "#b4442c" }}>
          Portfolio
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 110, fontWeight: 700 }}>
            Vishesh Meena
          </div>
          <div style={{ display: "flex", fontSize: 40, color: "#cdbf9f", marginTop: 16 }}>
            Self-taught solo founder. Building Krato.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#8b8576" }}>
          8 products shipped · 2 hackathons won · Rajasthan, India
        </div>
      </div>
    ),
    { ...size }
  );
}