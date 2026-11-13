import type { Metadata } from "next";
import { SavedList } from "@/components/SavedList";
import { getProducts } from "@/lib/data";

export const metadata: Metadata = { title: "관심 상품", robots: { index: false } };

export default async function SavedPage() {
  const products = await getProducts();
  return (
    <div className="mx-auto max-w-6xl px-4 pb-6 pt-6">
      <p className="font-maru text-[11px] font-bold tracking-[0.18em] text-coral-deep">MY WISHLIST</p>
      <h1 className="mt-1 font-display text-[28px] text-ink lg:text-[34px]">
        <span className="tape" style={{ ["--tape" as string]: "var(--color-pink)" }}>
          나의 일본 쇼핑리스트
        </span>
      </h1>
      <p className="mb-5 mt-1.5 text-[13px] text-ink-soft">담아 둔 상품을 살 수 있는 지역별로 모았어요.</p>
      <SavedList products={products} />
    </div>
  );
}
