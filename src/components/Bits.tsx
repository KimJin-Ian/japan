import Link from "next/link";
import { eventKeyDate, eventPhase } from "@/lib/catalog";
import { dday, shortDate } from "@/lib/format";
import { REGIONS } from "@/lib/taxonomy";
import type { EventItem, EventKind } from "@/lib/types";
import { ScopeSticker } from "./Stickers";

/** 잡지 코너 제목처럼: 작은 일본어 라벨 + 마스킹테이프가 붙은 제목 */
export function SectionTitle({
  ja,
  title,
  note,
  href,
  tape = "var(--color-butter)",
}: {
  ja: string;
  title: string;
  note?: string;
  href?: string;
  tape?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-4 lg:mb-5 lg:px-0">
      <div>
        <p className="mb-1.5 font-maru text-[13px] font-black tracking-[0.08em] text-coral-deep" lang="ja">
          {ja}
        </p>
        <h2 className="font-display text-[23px] leading-tight text-ink lg:text-[28px]">
          <span className="tape" style={{ ["--tape" as string]: tape }}>
            {title}
          </span>
        </h2>
        {note && <p className="mt-1.5 text-[12px] text-mute">{note}</p>}
      </div>
      {href && (
        <Link href={href} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-ink-soft shadow-[var(--shadow-soft)] hover:text-coral-deep">
          더 보기
        </Link>
      )}
    </div>
  );
}

export const EVENT_KIND: Record<EventKind, { label: string; cls: string }> = {
  release: { label: "발매", cls: "bg-butter text-[#7a5c0a]" },
  popup: { label: "팝업", cls: "bg-mint text-mint-deep" },
  campaign: { label: "캠페인", cls: "bg-sky text-[#2f5f93]" },
  preorder: { label: "예약", cls: "bg-lilac text-[#6a4a9c]" },
  lottery: { label: "추첨·응모", cls: "bg-pink text-[#a8475a]" },
  restock: { label: "재입고", cls: "bg-peach text-[#9a5a2e]" },
};

/** 일정 한 줄: 왼쪽에 달력 스티커(날짜·D-day), 오른쪽에 내용 */
export function EventRow({ event: e }: { event: EventItem }) {
  const key = eventKeyDate(e);
  const phase = eventPhase(e);
  const d = key.date ? dday(key.date) : null;
  const soon = phase !== "ended" && key.date && Math.abs(Number(d?.replace(/\D/g, "") || 0)) <= 3;
  return (
    <Link href={`/schedule/${e.slug}`} className={`card flex items-stretch gap-3 p-3 ${phase === "ended" ? "opacity-60" : ""}`}>
      <div className="flex w-[68px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl bg-cream text-center">
        <span className={`w-full py-1 text-[10px] font-bold text-white ${phase === "ended" ? "bg-mute" : "bg-coral"}`}>{key.label}</span>
        <span className="pt-1.5 font-display text-[19px] leading-none text-ink">{key.date ? shortDate(key.date) : "미정"}</span>
        <span className={`pb-1.5 pt-1 text-[11px] font-bold ${soon ? "text-coral-deep" : "text-mute"}`}>{phase === "ended" ? "종료" : (d ?? "")}</span>
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="mb-1 flex flex-wrap gap-1">
          <span className={`sticker ${EVENT_KIND[e.kind].cls}`}>{EVENT_KIND[e.kind].label}</span>
          <ScopeSticker scope={e.krScope} />
        </div>
        <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-ink">{e.titleKo}</h3>
        <p className="mt-1 truncate text-[11px] text-mute">
          {e.brand} · {e.place ?? REGIONS[e.region]}
          {e.scopeQuoted && " · 근거: 공식 원문"}
        </p>
      </div>
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-white pb-24 lg:pb-10">
      <div className="mx-auto max-w-6xl px-4 py-8 text-[12px] leading-relaxed text-mute">
        <p className="font-maru text-[14px] font-black text-ink">JAPAN FINDS</p>
        <p className="mt-2 max-w-xl">
          JAPAN FINDS는 일본 상품 정보를 공식 출처와 함께 정리하는 독립 서비스예요. 상품을 직접 팔거나 대신 사 드리지 않아요. 가격과 판매 조건은 바뀔 수
          있으니 구매 전에 공식 판매처에서 다시 확인해 주세요.
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-bold text-ink-soft">
          <li>
            <Link href="/products">전체 소식</Link>
          </li>
          <li>
            <Link href="/popup">팝업스토어</Link>
          </li>
          <li>
            <Link href="/collab">콜라보</Link>
          </li>
          <li>
            <Link href="/schedule">캘린더</Link>
          </li>
          <li>
            <Link href="/brands">브랜드</Link>
          </li>
          <li>
            <Link href="/news">일반 뉴스</Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
