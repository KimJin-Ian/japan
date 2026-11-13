import type { Metadata } from "next";
import { ProductGrid } from "@/components/ProductCard";
import { getNews } from "@/lib/data";

export const metadata: Metadata = {
  title: "일본 뉴스",
  description: "일본 기업 발표, 서비스·행사 소식 등 상품 소식이 아닌 일반 뉴스를 한국어로 정리했어요.",
  alternates: { canonical: "/news" },
};

/** 일반 뉴스: 상품·굿즈·팝업 소식이 아닌 글(기업 발표, 서비스, 행사 등)을 따로 모은다 */
export default async function NewsPage() {
  const news = (await getNews()).slice(0, 300);
  return (
    <div className="mx-auto max-w-6xl px-4 pb-6 pt-6">
      <p className="font-maru text-[11px] font-bold tracking-[0.18em] text-coral-deep">NEWS</p>
      <h1 className="mt-1 font-display text-[28px] text-ink lg:text-[34px]">
        <span className="tape" style={{ ["--tape" as string]: "var(--color-sky)" }}>
          일본 뉴스
        </span>
      </h1>
      <p className="mb-5 mt-1.5 text-[13px] text-ink-soft">상품·굿즈 소식이 아닌 기업 발표, 서비스, 행사 소식이에요. 최근 발표순으로 {news.length}건.</p>
      {news.length > 0 ? <ProductGrid products={news} /> : <p className="card dots px-6 py-12 text-center text-[14px] text-ink-soft">아직 올라온 뉴스가 없어요.</p>}
    </div>
  );
}
