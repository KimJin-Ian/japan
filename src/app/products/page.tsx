import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchBox } from "@/components/Chrome";
import { Explorer } from "@/components/Explorer";
import { brandsOf } from "@/lib/catalog";
import { getProducts } from "@/lib/data";

export const metadata: Metadata = {
  title: "일본 한정상품 전체 보기",
  description: "카테고리, 한정 유형, 일본 지역, 가격대로 일본 한정상품과 신상품을 찾아보세요.",
  keywords: ["일본 한정판", "일본 신상품", "일본 굿즈", "일본 쇼핑 추천", "일본 여행 쇼핑리스트"],
  alternates: { canonical: "/products" },
};

export default async function ProductsPage() {
  const products = await getProducts();
  return (
    <div className="pb-6 pt-6">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="font-display text-[28px] text-ink lg:text-[34px]">
          <span className="tape">일본 소식 전체</span>
        </h1>
        <p className="mt-1.5 text-[13px] text-ink-soft">
          한국어나 일본어 상품명, 브랜드, 캐릭터, 지역 이름으로 찾을 수 있어요.{" "}
          <Link href="/news" className="font-bold text-coral-deep underline underline-offset-4">
            일반 뉴스 보기
          </Link>
        </p>
        <div className="mt-4 md:hidden">
          <SearchBox />
        </div>
      </div>
      <Suspense fallback={<p className="px-4 py-10 text-center text-[13px] text-mute">상품을 불러오는 중…</p>}>
        <Explorer products={products} brands={brandsOf(products)} />
      </Suspense>
    </div>
  );
}
