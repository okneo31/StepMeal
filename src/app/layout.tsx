import type { Metadata, Viewport } from "next";
import SessionProvider from "@/components/providers/SessionProvider";
import ThemeProvider from "@/components/providers/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "StepMeal - 움직여서 벌고, 건강하게 먹자",
  description: "걸어서 SC 코인을 모으고, QR 스캔으로 MC 코인을 획득하세요. 미니게임, NFT, AI 리포트까지!",
  manifest: "/manifest.json",
  metadataBase: new URL("https://www.stepmeal.top"),
  openGraph: {
    title: "StepMeal - 움직여서 벌고, 건강하게 먹자",
    description: "걸어서 SC 코인을 모으고, QR 스캔으로 MC 코인을 획득하세요. 미니게임, NFT, AI 리포트까지!",
    siteName: "StepMeal",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StepMeal - 움직여서 벌고, 건강하게 먹자",
    description: "걸어서 SC 코인을 모으고, QR 스캔으로 MC 코인을 획득하세요. 미니게임, NFT, AI 리포트까지!",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "StepMeal",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#22C55E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <SessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
