import type { Metadata } from "next";
import Link from "next/link";
import { DemoNotice } from "@/components/Bits";
import { PriceCompare } from "@/components/PriceCompare";
import { ProductVisual } from "@/components/ProductVisual";
import { LimitedStickers } from "@/components/Stickers";
import { comparable } from "@/lib/catalog";
import { getProducts } from "@/lib/data";

export const metadata: Metadata = {
  title: "일본 가격 · 한국 가격 비교",
  description: "같은 상품·같은 용량임을 확인한 상품만 일본 현지 가격과 한국 판매가를 비교해요.",
  alternates: { canonical: "/compare" },
};

export default async function ComparePage() {
  const list = comparable(await getProducts());
  return (
    <div className="mx-auto max-w-6xl px-4 pb-6 pt-6">
      <p className="font-maru text-[11px] font-bold tracking-[0.18em] text-coral-deep">PRICE CHECK</p>
      <h1 className="mt-1 font-display text-[28px] text-ink lg:text-[34px]">
        <span className="tape" style={{ ["--tape" as string]: "var(--color-sky)" }}>
          일본 현지 가격으로 보기
        </span>
      </h1>
      <ul className="mt-3 space-y-1 text-[13px] leading-relaxed text-ink-soft">
        <li>· 모델, 용량, 옵션이 같다고 확인한 상품만 비교해요.</li>
        <li>· 한국 가격을 확인하지 못한 상품은 이 목록에 넣지 않아요.</li>
        <li>· 배송비, 관·부가세, 대행 수수료는 포함하지 않은 값이에요.</li>
      </ul>
      <DemoNotice className="my-4" />

      {list.length === 0 ? (
        <p className="card dots px-6 py-12 text-center text-[14px] text-ink-soft">비교할 수 있는 상품이 아직 없어요.</p>
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          {list.map((p) => (
            <li key={p.id}>
              <Link href={`/products/${p.slug}`} className="mb-2.5 flex items-center gap-3">
                <ProductVisual product={p} className="h-16 w-16 shrink-0 rounded-2xl" />
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap gap-1">
                    <LimitedStickers product={p} max={1} withJa={false} />
                  </div>
                  <h2 className="truncate text-[15px] font-bold text-ink">{p.nameKo}</h2>
                  <p className="text-[12px] text-mute">{p.brand}</p>
                </div>
              </Link>
              <PriceCompare product={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
