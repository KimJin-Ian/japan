"use client";
import Link from "next/link";
import { jpOffer, krOffer } from "@/lib/catalog";
import { checkedLabel, won, yen } from "@/lib/format";
import { ProductVisual } from "./ProductVisual";
import { RateNote, toKrw, useRate } from "./Rate";
import type { Product } from "@/lib/types";

const Ext = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="font-bold text-coral-deep underline decoration-coral/40 underline-offset-4">
    {children} ↗
  </a>
);

/** 일본 가격 · 한국 가격 비교. 같은 상품임을 확인한 한국 가격이 없으면 '한국 가격 미확인'으로 둔다. */
export function PriceCompare({ product: p }: { product: Product }) {
  const rate = useRate();
  const j = jpOffer(p);
  const k = krOffer(p);
  const unverifiedKr = p.offers.find((o) => o.country === "KR" && !o.sameItemVerified);

  if (!j) {
    return (
      <div className="card p-5">
        <p className="font-display text-[20px] text-ink">일본 가격 확인 필요</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">공식 가격이 아직 발표되지 않았어요. 가격이 나오면 확인 시각과 함께 올릴게요.</p>
      </div>
    );
  }

  const jKrw = toKrw(j.price, rate);
  const max = Math.max(jKrw, k?.price ?? 0);
  const diff = k ? k.price - jKrw : 0;
  const pct = k ? Math.round((Math.abs(diff) / k.price) * 100) : 0;

  return (
    <div className="card overflow-hidden">
      <div className="p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[12px] font-bold text-mute">일본 현지 가격{j.taxIncluded ? " (세금 포함)" : ""}</p>
          <p className="text-[11px] text-mute">{checkedLabel(j.checkedAt)}</p>
        </div>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="font-display text-[36px] leading-none text-ink">{yen(j.price)}</span>
          <span className="text-[15px] font-bold text-ink-soft">약 {won(jKrw)}</span>
        </p>
        {j.note && <p className="mt-1 text-[12px] text-ink-soft">{j.note}</p>}
        <p className="mt-2 text-[12px] text-ink-soft">
          {j.seller} · <Ext href={j.url}>일본 판매처</Ext>
        </p>

        <div className="mt-5 space-y-3" aria-hidden={!k}>
          <Bar label="일본" value={won(jKrw)} ratio={jKrw / max} cls="bg-coral" />
          {k ? (
            <Bar label="한국" value={won(k.price)} ratio={k.price / max} cls="bg-latte" />
          ) : (
            <div className="flex items-center gap-3">
              <span className="w-8 text-[12px] font-bold text-ink-soft">한국</span>
              <div className="flex h-8 flex-1 items-center rounded-full border border-dashed border-latte px-3 text-[12px] font-bold text-ink-soft">한국 가격 미확인</div>
            </div>
          )}
        </div>

        {k ? (
          <div className="mt-4 rounded-2xl bg-mint/60 p-4">
            <p className="font-display text-[20px] leading-snug text-mint-deep">
              일본이 약 {won(Math.abs(diff))} {diff >= 0 ? "저렴해요" : "비싸요"} <span className="text-[14px]">({pct}%)</span>
            </p>
            <p className="mt-1 text-[12px] text-ink-soft">
              {k.seller} {won(k.price)} · {checkedLabel(k.checkedAt)} · <Ext href={k.url}>한국 판매처</Ext>
            </p>
            {k.note && <p className="mt-1 text-[12px] font-medium text-mint-deep">✓ {k.note}</p>}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl bg-cream p-4 text-[12px] leading-relaxed text-ink-soft">
            {unverifiedKr
              ? `한국에 비슷한 상품(${unverifiedKr.seller})이 있지만 ${unverifiedKr.note ?? "같은 상품인지 확인하지 못해"} 가격을 비교하지 않았어요.`
              : p.krOfficial === "no"
                ? "한국 공식 판매처가 없어 비교할 한국 가격이 없어요."
                : "같은 상품·같은 옵션의 한국 판매가를 아직 확인하지 못했어요."}
          </p>
        )}
      </div>
      <p className="border-t border-line bg-cream/70 px-5 py-3 text-[11px] leading-relaxed text-mute">
        원화 환산은 <RateNote /> 기준 참고 값이에요. 배송비, 관·부가세, 구매대행 수수료, 면세 혜택은 포함하지 않았어요.
      </p>
    </div>
  );
}

/** 홈의 가격 비교 한 줄 */
export function CompareTeaser({ product: p }: { product: Product }) {
  const rate = useRate();
  const j = jpOffer(p);
  const k = krOffer(p);
  if (!j || !k) return null;
  const jKrw = toKrw(j.price, rate);
  const diff = k.price - jKrw;
  return (
    <Link href={`/products/${p.slug}#price`} className="card flex items-center gap-3 p-3">
      <ProductVisual product={p} className="h-20 w-20 shrink-0 rounded-2xl" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[14px] font-bold text-ink">{p.nameKo}</h3>
        <p className="mt-1 text-[12px] text-mute">
          일본 {yen(j.price)} <span className="text-ink-soft">(약 {won(jKrw)})</span> · 한국 {won(k.price)}
        </p>
        <p className="mt-1.5 inline-block rounded-full bg-mint px-2.5 py-0.5 text-[12px] font-bold text-mint-deep">
          일본이 약 {won(Math.abs(diff))} {diff >= 0 ? "저렴" : "비쌈"}
        </p>
      </div>
    </Link>
  );
}

function Bar({ label, value, ratio, cls }: { label: string; value: string; ratio: number; cls: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 text-[12px] font-bold text-ink-soft">{label}</span>
      <div className="h-8 flex-1 rounded-full bg-cream-deep">
        <div className={`flex h-8 min-w-[88px] items-center justify-end rounded-full px-3 text-[12px] font-bold text-white ${cls}`} style={{ width: `${Math.max(ratio * 100, 30)}%` }}>
          {value}
        </div>
      </div>
    </div>
  );
}
