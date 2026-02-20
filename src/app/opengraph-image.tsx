import { ImageResponse } from "next/og";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const alt = "StepMeal - 움직여서 벌고, 건강하게 먹자";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const logoUrl = "https://www.stepmeal.top/logo.svg";

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
          background: "linear-gradient(135deg, #0B0E14 0%, #131820 50%, #0B0E14 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Glow effects */}
        <div
          style={{
            position: "absolute",
            top: "60px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 60%)",
            display: "flex",
          }}
        />

        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt="StepMeal"
          width="200"
          height="200"
          style={{ marginBottom: "20px", borderRadius: "32px" }}
        />

        {/* Title */}
        <div style={{ display: "flex", alignItems: "baseline", marginBottom: "8px" }}>
          <span style={{ fontSize: "72px", fontWeight: 800, color: "#E2E8F0", letterSpacing: "-2px" }}>
            Step
          </span>
          <span style={{ fontSize: "72px", fontWeight: 800, color: "#F59E0B", letterSpacing: "-2px" }}>
            Meal
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "26px",
            fontWeight: 500,
            color: "rgba(255,255,255,0.5)",
            marginBottom: "36px",
            display: "flex",
          }}
        >
          움직임이 선물하는 건강한 한 끼
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 22px",
              borderRadius: "999px",
              background: "rgba(34,197,94,0.1)",
              border: "1.5px solid rgba(34,197,94,0.3)",
            }}
          >
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22C55E", display: "flex" }} />
            <span style={{ fontSize: "18px", color: "#22C55E", fontWeight: 600 }}>SC 코인</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 22px",
              borderRadius: "999px",
              background: "rgba(245,158,11,0.1)",
              border: "1.5px solid rgba(245,158,11,0.3)",
            }}
          >
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F59E0B", display: "flex" }} />
            <span style={{ fontSize: "18px", color: "#F59E0B", fontWeight: 600 }}>MC 코인</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 22px",
              borderRadius: "999px",
              background: "rgba(168,85,247,0.1)",
              border: "1.5px solid rgba(168,85,247,0.3)",
            }}
          >
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#A855F7", display: "flex" }} />
            <span style={{ fontSize: "18px", color: "#A855F7", fontWeight: 600 }}>미니게임 & NFT</span>
          </div>
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            fontSize: "16px",
            color: "rgba(255,255,255,0.25)",
            display: "flex",
          }}
        >
          stepmeal.top
        </div>
      </div>
    ),
    { ...size }
  );
}
