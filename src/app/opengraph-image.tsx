import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              borderRadius: "999px",
              background: "rgba(34,197,94,0.08)",
              border: "1.5px solid rgba(34,197,94,0.25)",
            }}
          >
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22C55E", display: "flex" }} />
            <span style={{ fontSize: "20px", color: "#22C55E", fontWeight: 600 }}>걸어서 SC 코인 획득</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              borderRadius: "999px",
              background: "rgba(245,158,11,0.08)",
              border: "1.5px solid rgba(245,158,11,0.25)",
            }}
          >
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#F59E0B", display: "flex" }} />
            <span style={{ fontSize: "20px", color: "#F59E0B", fontWeight: 600 }}>QR 스캔으로 MC 코인</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              borderRadius: "999px",
              background: "rgba(168,85,247,0.08)",
              border: "1.5px solid rgba(168,85,247,0.25)",
            }}
          >
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#A855F7", display: "flex" }} />
            <span style={{ fontSize: "20px", color: "#A855F7", fontWeight: 600 }}>미니게임 & NFT</span>
          </div>
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
