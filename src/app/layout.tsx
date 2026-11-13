import type { Metadata, Viewport } from "next";
import { Jua, Noto_Sans_KR, Zen_Maru_Gothic } from "next/font/google";
import { Suspense } from "react";
import { Header, TabBar } from "@/components/Chrome";
import { Footer } from "@/components/Bits";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const kr = Noto_Sans_KR({ variable: "--font-kr", subsets: ["latin"], weight: ["400", "500", "700"], display: "swap" });
const display = Jua({ variable: "--font-display", subsets: ["latin"], weight: "400", display: "swap" });
const maru = Zen_Maru_Gothic({ variable: "--font-maru", subsets: ["latin"], weight: ["500", "700", "900"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "JAPAN FINDS — 일본에서만 만날 수 있는 특별한 상품", template: "%s | JAPAN FINDS" },
  description:
    "일본 한정판, 지역·매장 한정 상품, 팝업 굿즈와 신상품을 공식 출처와 함께 정리해요. 일본 현지 가격과 살 수 있는 곳을 확인하고 마음에 드는 상품을 담아 보세요.",
  openGraph: { type: "website", locale: "ko_KR", siteName: "JAPAN FINDS" },
};

export const viewport: Viewport = { themeColor: "#fffaf2", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${kr.variable} ${display.variable} ${maru.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Suspense>
          <Header />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Footer />
        <Suspense>
          <TabBar />
        </Suspense>
      </body>
    </html>
  );
}
