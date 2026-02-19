import { ImageResponse } from "next/og";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const alt = "StepMeal - 움직여서 벌고, 건강하게 먹자";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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

        {/* Footprint + Bowl SVG logo */}
        <svg width="200" height="220" viewBox="0 0 200 220" style={{ marginBottom: "20px" }}>
          {/* Toes */}
          <ellipse cx="62" cy="22" rx="16" ry="20" fill="#6ABF4B" />
          <ellipse cx="95" cy="10" rx="14" ry="18" fill="#6ABF4B" />
          <ellipse cx="124" cy="14" rx="13" ry="17" fill="#6ABF4B" />
          <ellipse cx="148" cy="30" rx="12" ry="15" fill="#6ABF4B" />
          {/* Foot body */}
          <path
            d="M40 60 C40 40, 80 30, 120 40 C160 50, 165 70, 155 100 C148 125, 130 155, 115 170 C105 180, 85 180, 80 170 C70 150, 55 120, 45 90 C40 75, 38 65, 40 60Z"
            fill="#6ABF4B"
          />
          {/* Bowl */}
          <ellipse cx="128" cy="158" rx="38" ry="14" fill="#7ECBCF" />
          <path d="M90 158 C92 185, 120 195, 128 195 C136 195, 164 185, 166 158Z" fill="#7ECBCF" />
          <ellipse cx="128" cy="158" rx="32" ry="10" fill="#A8E0E3" />
          {/* Leaf on bowl */}
          <path d="M105 150 C108 138, 118 135, 115 148" stroke="#4A9E3F" strokeWidth="2.5" fill="none" />
          <path d="M108 142 C112 136, 120 136, 116 144" fill="#4A9E3F" />
          {/* Spoon */}
          <line x1="148" y1="148" x2="162" y2="128" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="164" cy="125" rx="5" ry="7" fill="#D97706" transform="rotate(-25 164 125)" />
          {/* Drop */}
          <path d="M152 138 C153 133, 157 132, 156 138 C155 142, 152 142, 152 138Z" fill="#F59E0B" />
        </svg>

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
