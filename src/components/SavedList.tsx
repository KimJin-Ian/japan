"use client";
import Link from "next/link";
import { useSaved } from "@/lib/client-store";
import { won, yen } from "@/lib/format";
import { REGIONS } from "@/lib/taxonomy";
import type { Product, RegionSlug } from "@/lib/types";
import { ProductGrid } from "./ProductCard";
import { RateNote, toKrw, useRate } from "./Rate";

/** 나만의 쇼핑리스트: 담은 상품을 지역별로 묶고 일본 가격 합계를 보여 준다 */
export function SavedList({ products }: { products: Product[] }) {
  const saved = useSaved();
  const rate = useRate();
  const list = saved.map((s) => products.find((p) => p.id === s.id)).filter((p): p is Product => Boolean(p));

  if (list.length === 0) {
    return (
      <div className="card dots px-6 py-14 text-center">
        <p className="font-display text-[23px] text-ink">아직 담은 상품이 없어요</p>
        <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-ink-soft">마음에 드는 상품의 하트를 누르면 여기에 모여요. 로그인 없이 이 기기에 저장돼요.</p>
        <Link href="/products" className="btn btn-primary mt-5 h-12 px-6 text-[15px]">
          구경하러 가기
        </Link>
      </div>
    );
  }

  const priced = list.filter((p) => p.saleStatus !== "ended").map((p) => p.offers.find((o) => o.country === "JP")?.price).filter((n): n is number => n !== undefined);
  const total = priced.reduce((a, b) => a + b, 0);
  const regions = [...new Set(list.map((p) => p.region))] as RegionSlug[];

  return (
    <>
      <div className="card relative mb-6 p-5">
        <span className="absolute -top-2 left-8 h-4 w-16 -rotate-2 rounded-[2px] bg-pink-deep/70" aria-hidden />
        <p className="text-[12px] font-bold text-mute">담은 상품 {list.length}개 · 가격이 확인된 {priced.length}개 합계</p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="font-display text-[32px] leading-none text-ink">{yen(total)}</span>
          <span className="text-[14px] font-bold text-ink-soft">약 {won(toKrw(total, rate))}</span>
        </p>
        <p className="mt-2 text-[11px] text-mute">일본 현지 가격 기준 · <RateNote /> · 배송비와 세금은 빠져 있어요</p>
      </div>

      {regions.map((r) => {
        const group = list.filter((p) => p.region === r);
        return (
          <section key={r} className="mb-8">
            <h2 className="mb-3 font-display text-[20px] text-ink">
              <span className="tape" style={{ ["--tape" as string]: "var(--color-mint)" }}>
                {REGIONS[r]}
              </span>
              <span className="ml-2 font-sans text-[13px] font-bold text-mute">{group.length}</span>
            </h2>
            <ProductGrid products={group} />
          </section>
        );
      })}
    </>
  );
}
