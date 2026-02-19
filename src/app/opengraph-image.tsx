import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "StepMeal - 움직여서 벌고, 건강하게 먹자";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const logoBuffer = await readFile(join(process.cwd(), "public", "logo.webp"));
  const logoBase64 = `data:image/webp;base64,${logoBuffer.toString("base64")}`;

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
        {/* Decorative glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Logo */}
        <img
          src={logoBase64}
          width={360}
          height={360}
          style={{
            objectFit: "contain",
            marginBottom: "16px",
            borderRadius: "24px",
          }}
        />

        {/* Feature pills */}
        <div style={{ display: "flex", gap: "16px" }}>
          {[
            { label: "걸어서 SC 코인 획득", color: "#22C55E" },
            { label: "QR 스캔으로 MC 코인", color: "#F59E0B" },
            { label: "미니게임 & NFT", color: "#A855F7" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "999px",
                background: `${item.color}15`,
                border: `1.5px solid ${item.color}40`,
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: item.color,
                  display: "flex",
                }}
              />
              <span style={{ fontSize: "20px", color: item.color, fontWeight: 600 }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: "28px",
            fontSize: "18px",
            color: "rgba(255,255,255,0.3)",
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
