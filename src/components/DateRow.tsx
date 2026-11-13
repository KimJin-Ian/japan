import Link from "next/link";
import { dday, shortDate } from "@/lib/format";
import { REGIONS, categoryShort } from "@/lib/taxonomy";
import type { Product } from "@/lib/types";
import { LimitedStickers } from "./Stickers";

/** 캘린더 한 줄: 왼쪽에 날짜 스티커(시작·종료와 D-day), 오른쪽에 상품 */
export function DateRow({ product: p, kind }: { product: Product; kind: "start" | "end" }) {
  const date = kind === "start" ? p.releaseDate : p.endDate;
  if (!date) return null;
  const d = dday(date);
  const soon = Math.abs(Number(d.replace(/\D/g, "") || 0)) <= 3;
  return (
    <Link href={`/products/${p.slug}`} className="card flex items-stretch gap-3 p-3">
      <div className="flex w-[68px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl bg-cream text-center">
        <span className={`w-full py-1 text-[10px] font-bold text-white ${kind === "start" ? "bg-mint-deep" : "bg-coral"}`}>{kind === "start" ? "시작" : "종료"}</span>
        <span className="pt-1.5 font-display text-[19px] leading-none text-ink">{shortDate(date)}</span>
        <span className={`pb-1.5 pt-1 text-[11px] font-bold ${soon ? "text-coral-deep" : "text-mute"}`}>{d}</span>
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="mb-1 flex flex-wrap gap-1">
          <span className="sticker bg-cream-deep text-ink-soft">{categoryShort(p.category)}</span>
          <LimitedStickers product={p} max={1} withJa={false} />
        </div>
        <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-ink">{p.nameKo}</h3>
        <p className="mt-1 truncate text-[11px] text-mute">
          {p.brand} · {REGIONS[p.region]}
        </p>
      </div>
    </Link>
  );
}
