import Link from "next/link";
import { jpOffer } from "@/lib/catalog";
import { dday, shortDate, yen } from "@/lib/format";
import { REGIONS, categoryShort } from "@/lib/taxonomy";
import type { Product } from "@/lib/types";
import { ProductVisual } from "./ProductVisual";
import { Krw } from "./Rate";
import { SaveHeart } from "./SaveButton";
import { LimitedStickers } from "./Stickers";

/** 지금 이 소식에서 가장 쓸모 있는 날짜 정보 한 줄 */
const dateLine = (p: Product) => {
  if (p.saleStatus === "ended") return "판매 종료";
  if (p.saleStatus === "upcoming" && p.releaseDate) return `${shortDate(p.releaseDate)} 출시 · ${dday(p.releaseDate)}`;
  if (p.endDate) return `${shortDate(p.endDate)}까지 · ${dday(p.endDate)}`;
  if (p.releaseDate) return `${shortDate(p.releaseDate)} 출시`;
  return "";
};

/** 사진이 있는 소식: 썸네일 카드 */
export function ProductCard({ product: p }: { product: Product }) {
  const offer = jpOffer(p);
  const ended = p.saleStatus === "ended";
  return (
    <article className="card card-hover relative flex h-full flex-col overflow-hidden">
      <SaveHeart id={p.id} name={p.nameKo} />
      <Link href={`/products/${p.slug}`} className="flex h-full flex-col rounded-[20px]">
        <div className="relative m-1.5 mb-0">
          <ProductVisual product={p} className={`aspect-square rounded-2xl ${ended ? "opacity-60 grayscale-[35%]" : ""}`} />
          {p.saleStatus === "upcoming" && <span className="sticker absolute left-2 top-2 -rotate-3 bg-white text-coral-deep">곧 출시</span>}
          {ended && <span className="sticker absolute left-2 top-2 bg-ink/75 text-white">판매 종료</span>}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3 pt-2.5">
          <div className="flex flex-wrap gap-1">
            <LimitedStickers product={p} max={2} withJa={false} />
          </div>
          <p className="truncate text-[11px] font-medium text-mute">
            {p.brand} · {REGIONS[p.region]}
          </p>
          <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-ink">{p.nameKo}</h3>
          <div className="mt-auto pt-1">
            {offer && (
              <p className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="font-display text-[19px] leading-none text-ink">{yen(offer.price)}</span>
                <Krw jpy={offer.price} className="text-[11px] text-mute" />
              </p>
            )}
            <p className={`mt-1 text-[11px] font-medium ${p.saleStatus === "upcoming" ? "text-coral-deep" : "text-mute"}`}>{dateLine(p)}</p>
          </div>
        </div>
      </Link>
    </article>
  );
}

/** 사진이 없는 소식: 글만 있는 목록 한 줄 */
export function ProductRow({ product: p }: { product: Product }) {
  const offer = jpOffer(p);
  const date = dateLine(p);
  return (
    <article className={`relative border-b border-line last:border-b-0 ${p.saleStatus === "ended" ? "opacity-60" : ""}`}>
      <Link href={`/products/${p.slug}`} className="block py-3.5 pl-1 pr-12 hover:bg-cream/70">
        <div className="mb-1 flex flex-wrap items-center gap-1">
          <span className="sticker bg-cream-deep text-ink-soft">{categoryShort(p.category)}</span>
          {p.limited.status === "verified" && <LimitedStickers product={p} max={2} withJa={false} />}
          {p.saleStatus === "upcoming" && <span className="sticker bg-white text-coral-deep ring-1 ring-coral/50">곧 출시</span>}
        </div>
        <h3 className="text-[15px] font-bold leading-snug text-ink">{p.nameKo}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-soft">{p.summary}</p>
        <p className="mt-1.5 text-[11px] text-mute">
          {p.brand} · {REGIONS[p.region]}
          {offer && <b className="ml-2 text-ink">{yen(offer.price)}</b>}
          {date && <span className={`ml-2 font-bold ${p.saleStatus === "upcoming" ? "text-coral-deep" : ""}`}>{date}</span>}
        </p>
      </Link>
      <div className="absolute right-0 top-3 [&>button]:static">
        <SaveHeart id={p.id} name={p.nameKo} />
      </div>
    </article>
  );
}

/** 목록: 사진이 있는 소식은 카드 격자로, 없는 소식은 그 아래 글 목록으로 */
export function ProductGrid({ products }: { products: Product[] }) {
  const withPhoto = products.filter((p) => p.imageUrl);
  const textOnly = products.filter((p) => !p.imageUrl);
  return (
    <>
      {withPhoto.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5">
          {withPhoto.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
      {textOnly.length > 0 && (
        <ul className={`card px-4 ${withPhoto.length > 0 ? "mt-6" : ""}`}>
          {textOnly.map((p) => (
            <li key={p.id}>
              <ProductRow product={p} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
