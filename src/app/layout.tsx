import type { Metadata, Viewport } from "next";
import { Jua, Zen_Maru_Gothic } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { Header, TabBar } from "@/components/Chrome";
import { Footer } from "@/components/Bits";
import { RateProvider } from "@/components/Rate";
import { getRate, getToday } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
// 한글 본문: Pretendard (SIL OFL). 쓰는 글자 묶음만 내려받는 동적 서브셋
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

const display = Jua({ variable: "--font-display", subsets: ["latin"], weight: "400", display: "swap" });
const maru = Zen_Maru_Gothic({ variable: "--font-maru", subsets: ["latin"], weight: ["500", "700", "900"], display: "swap" });

/** 환경변수에 따옴표나 공백이 같이 들어와도 값만 쓴다 */
const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "") || undefined;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "일본 한정판·팝업스토어·콜라보 굿즈 소식 | JAPAN FINDS", template: "%s | JAPAN FINDS" },
  description:
    "일본 한정판, 팝업스토어 일정, 콜라보 굿즈, 편의점·브랜드 신상품 소식을 매일 한국어로 정리해요. 발매일, 일본 현지 가격, 판매 매장을 확인하고 일본 여행 쇼핑리스트를 만들어 보세요.",
  // 사람들이 실제로 검색할 만한 말. (구글은 keywords 를 순위에 쓰지 않으므로 같은 말을 제목·설명·본문에도 담는다)
  keywords: [
    "일본 한정판", "일본 한정 굿즈", "일본 팝업스토어", "도쿄 팝업스토어", "오사카 팝업스토어", "일본 콜라보", "일본 콜라보 굿즈",
    "일본 신상품", "일본 굿즈", "일본 캐릭터 굿즈", "일본 가챠", "일본 편의점 신상", "일본 여행 쇼핑리스트", "일본 쇼핑 추천",
    "일본 발매일", "일본 한정 상품", "일본 현지 가격", "스누피 일본 굿즈", "미피 일본 굿즈", "점프숍",
  ],
  openGraph: { type: "website", locale: "ko_KR", siteName: "JAPAN FINDS" },
  alternates: { canonical: "/" },
  // 구글 서치 콘솔 · 네이버 서치어드바이저 소유 확인 값 (Vercel 환경변수로 넣는다)
  verification: {
    google: clean(process.env.GOOGLE_SITE_VERIFICATION),
    other: clean(process.env.NAVER_SITE_VERIFICATION) ? { "naver-site-verification": clean(process.env.NAVER_SITE_VERIFICATION)! } : undefined,
  },
};

export const viewport: Viewport = { themeColor: "#fff9f0", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [rate, today] = await Promise.all([getRate(), getToday()]);
  return (
    <html lang="ko" className={`${display.variable} ${maru.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Suspense>
          <Header />
        </Suspense>
        <RateProvider rate={rate} today={today}>
          <main className="flex-1">{children}</main>
        </RateProvider>
        <Footer />
        <Suspense>
          <TabBar />
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
