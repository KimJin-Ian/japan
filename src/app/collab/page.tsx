import type { Metadata } from "next";
import { ProductGrid } from "@/components/ProductCard";
import { getProducts } from "@/lib/data";

export const metadata: Metadata = {
  title: "일본 콜라보 한정 아이템",
  description: "브랜드와 캐릭터, 브랜드와 브랜드가 함께 낸 일본 콜라보 상품을 모았어요. 발매일과 판매처를 확인하세요.",
  keywords: ["일본 콜라보", "일본 콜라보 굿즈", "일본 한정 콜라보", "브랜드 콜라보 일본", "캐릭터 콜라보 일본"],
  alternates: { canonical: "/collab" },
};

export default async function CollabPage() {
  const all = await getProducts();
  const isCollab = (tags: string[], name: string) => tags.some((t) => t.includes("コラボ")) || name.includes("×") || name.includes("콜라보");
  const products = all.filter((p) => isCollab(p.tags, p.nameKo));
  const live = products.filter((p) => p.saleStatus !== "ended");
  const ended = products.filter((p) => p.saleStatus === "ended");
  return (
    <div className="mx-auto max-w-6xl px-4 pb-6 pt-6">
      <p className="font-maru text-[11px] font-bold tracking-[0.18em] text-coral-deep">COLLABORATION</p>
      <h1 className="mt-1 font-display text-[28px] text-ink lg:text-[34px]">
        <span className="tape" style={{ ["--tape" as string]: "var(--color-lilac)" }}>
          콜라보 한정 아이템
        </span>
      </h1>
      <p className="mt-1.5 text-[13px] text-ink-soft">브랜드 × 캐릭터, 브랜드 × 브랜드. 최근 발표순이에요.</p>
      {live.length > 0 ? <ProductGrid products={live} /> : <p className="card dots px-6 py-12 text-center text-[14px] text-ink-soft">지금 진행 중인 콜라보 소식이 없어요.</p>}
      {ended.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 font-display text-[20px] text-ink">끝난 콜라보</h2>
          <ProductGrid products={ended} />
        </section>
      )}
    </div>
  );
}
