import { LIMITED } from "@/lib/taxonomy";
import type { KrScope, LimitedType, Product } from "@/lib/types";

// 스티커 배지. 한정 유형은 일본 매장에서 실제로 보게 되는 표기(日本限定 등)를 작게 함께 적는다.

const LIMITED_STYLE: Record<LimitedType, string> = {
  japan: "bg-coral text-white",
  region: "bg-mint text-mint-deep",
  store: "bg-sky text-[#2f5f93]",
  period: "bg-butter text-[#7a5c0a]",
  quantity: "bg-lilac text-[#6a4a9c]",
};

export function LimitedSticker({ type, withJa = true }: { type: LimitedType; withJa?: boolean }) {
  return (
    <span className={`sticker ${LIMITED_STYLE[type]}`}>
      {LIMITED[type].ko}
      {withJa && (
        <span className="ja" lang="ja">
          {LIMITED[type].ja}
        </span>
      )}
    </span>
  );
}

export function CheckingSticker({ short = false }: { short?: boolean }) {
  return (
    <span className="sticker border border-dashed border-latte bg-white text-ink-soft">
      <span aria-hidden>…</span>
      {short ? "한정 확인 중" : "한정 여부 확인 중"}
    </span>
  );
}

/** 카드·상세 공통: 상품의 한정 상태를 스티커로 */
export function LimitedStickers({ product, max, withJa }: { product: Product; max?: number; withJa?: boolean }) {
  const { status, types } = product.limited;
  // 확인되지 않은 것은 라벨을 붙이지 않는다
  if (status === "checking") return null;
  if (status === "none") return <span className="sticker bg-cream-deep text-ink-soft">상시 판매</span>;
  const shown = max ? types.slice(0, max) : types;
  return (
    <>
      {shown.map((t) => (
        <LimitedSticker key={t} type={t} withJa={withJa} />
      ))}
      {max && types.length > max && <span className="sticker bg-cream-deep text-ink-soft">+{types.length - max}</span>}
    </>
  );
}

export function StatusSticker({ product }: { product: Product }) {
  if (product.saleStatus === "upcoming") return <span className="sticker bg-white text-coral-deep ring-1 ring-coral/50">곧 출시</span>;
  if (product.saleStatus === "ended") return <span className="sticker bg-ink/70 text-white">판매 종료</span>;
  return null;
}

export function KrSticker({ product }: { product: Product }) {
  if (product.krOfficial === "no") return <span className="sticker bg-pink text-[#a8475a]">한국 미출시</span>;
  if (product.krOfficial === "yes") return <span className="sticker bg-cream-deep text-ink-soft">한국 판매 있음</span>;
  return null;
}

const SCOPE: Record<KrScope, { label: string; cls: string }> = {
  jp_only: { label: "일본 현지 전용", cls: "bg-pink text-[#a8475a]" },
  no_kr_shipping: { label: "한국 직배송 불가", cls: "bg-peach text-[#9a5a2e]" },
  mixed: { label: "조건별로 다름", cls: "bg-butter text-[#7a5c0a]" },
  kr_available: { label: "한국에서도 가능", cls: "bg-mint text-mint-deep" },
  checking: { label: "한국 이용 범위 확인 중", cls: "border border-dashed border-latte bg-white text-ink-soft" },
};

export function ScopeSticker({ scope }: { scope: KrScope }) {
  return <span className={`sticker ${SCOPE[scope].cls}`}>{SCOPE[scope].label}</span>;
}

export function DemoSticker({ className = "" }: { className?: string }) {
  return <span className={`sticker bg-ink text-white ${className}`}>데모 데이터</span>;
}
