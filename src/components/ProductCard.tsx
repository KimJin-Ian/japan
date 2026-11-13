import Link from "next/link";
import { jpOffer } from "@/lib/catalog";
import { dday, jpyToKrw, shortDate, won, yen } from "@/lib/format";
import { REGIONS } from "@/lib/taxonomy";
import type { Product } from "@/lib/types";
import { ProductVisual } from "./ProductVisual";
import { SaveHeart } from "./SaveButton";
import { LimitedStickers } from "./Stickers";

/** 카드 아래 한 줄: 지금 이 상품에서 가장 쓸모 있는 날짜 정보 */
const dateLine = (p: Product) => {
  if (p.saleStatus === "ended") return "판매 종료";
  if (p.saleStatus === "upcoming" && p.releaseDate) return `${shortDate(p.releaseDate)} 출시 · ${dday(p.releaseDate)}`;
  if (p.endDate) return `${shortDate(p.endDate)}까지 · ${dday(p.endDate)}`;
  if (p.releaseDate) return `${shortDate(p.releaseDate)} 출시`;
  return "";
};

export function ProductCard({ product: p }: { product: Product }) {
  const offer = jpOffer(p);
  const ended = p.saleStatus === "ended";
  return (
    <article className="card card-hover relative flex h-full flex-col overflow-hidden">
      <SaveHeart id={p.id} name={p.nameKo} />
      <Link href={`/products/${p.slug}`} className="flex h-full flex-col rounded-[20px]">
        <div className="relative m-1.5 mb-0">
          <ProductVisual product={p} className={`aspect-square rounded-2xl ${ended ? "opacity-60 grayscale-[35%]" : ""}`} />
          {p.saleStatus === "upcoming" && (
            <span className="sticker absolute left-2 top-2 -rotate-3 bg-white text-coral-deep">곧 출시</span>
          )}
          {ended && <span className="sticker absolute left-2 top-2 bg-ink/75 text-white">판매 종료</span>}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3 pt-2.5">
          <div className="flex flex-wrap gap-1">
            <LimitedStickers product={p} max={2} withJa={false} />
          </div>
          <p className="text-[11px] font-medium text-mute">
            {p.brand} · {REGIONS[p.region]}
          </p>
          <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-ink">{p.nameKo}</h3>
          <div className="mt-auto pt-1">
            {offer ? (
              <p className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="font-display text-[19px] leading-none text-ink">{yen(offer.price)}</span>
                <span className="text-[11px] text-mute">약 {won(jpyToKrw(offer.price))}</span>
              </p>
            ) : (
              <p className="text-[13px] font-bold text-ink-soft">가격 확인 필요</p>
            )}
            <p className={`mt-1 text-[11px] font-medium ${p.saleStatus === "upcoming" ? "text-coral-deep" : "text-mute"}`}>{dateLine(p)}</p>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5">
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
