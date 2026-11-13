import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoNotice, EVENT_KIND } from "@/components/Bits";
import { ProductCard } from "@/components/ProductCard";
import { ScopeSticker } from "@/components/Stickers";
import { allEvents, eventKeyDate, eventPhase, getEvent, getProduct } from "@/lib/catalog";
import { checkedLabel, dday, longDate } from "@/lib/format";
import { REGIONS } from "@/lib/taxonomy";
import type { Product } from "@/lib/types";

// 등록되지 않은 주소는 서버에서 다 그린 뒤 보낸다(검색엔진이 완성된 HTML을 받도록).
export const instant = false;

export function generateStaticParams() {
  return allEvents().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<"/schedule/[slug]">): Promise<Metadata> {
  const e = getEvent((await params).slug);
  if (!e) return {};
  return { title: e.titleKo, description: e.summary, alternates: { canonical: `/schedule/${e.slug}` }, robots: e.isDemo ? { index: false, follow: true } : undefined };
}

const PHASE = { ongoing: "진행 중", upcoming: "예정", ended: "종료" } as const;

export default async function EventPage({ params }: PageProps<"/schedule/[slug]">) {
  const e = getEvent((await params).slug);
  if (!e) notFound();
  const phase = eventPhase(e);
  const key = eventKeyDate(e);
  const products = e.productSlugs.map((s) => getProduct(s)).filter((p): p is Product => Boolean(p));

  return (
    <article className="mx-auto max-w-3xl px-4 pb-6 pt-4">
      <nav aria-label="현재 위치" className="mb-3 text-[12px] text-mute">
        <Link href="/schedule" className="hover:text-coral-deep">
          일정 · 소식
        </Link>
        <span className="mx-1.5">›</span>
        <Link href={`/brand/${e.brandSlug}`} className="hover:text-coral-deep">
          {e.brand}
        </Link>
      </nav>

      <div className="card gingham overflow-hidden">
        <div className="bg-white/80 p-5">
          <div className="flex flex-wrap gap-1.5">
            <span className={`sticker ${EVENT_KIND[e.kind].cls}`}>{EVENT_KIND[e.kind].label}</span>
            <span className={`sticker ${phase === "ended" ? "bg-ink/70 text-white" : "bg-white text-coral-deep ring-1 ring-coral/50"}`}>{PHASE[phase]}</span>
            <ScopeSticker scope={e.krScope} />
          </div>
          <h1 className="mt-3 font-display text-[26px] leading-[1.25] text-ink">{e.titleKo}</h1>
          <p className="mt-1.5 font-maru text-[12px] font-medium text-ink-soft" lang="ja">
            원제: {e.titleJa}
          </p>
          {key.date && (
            <p className="mt-4 flex items-baseline gap-2">
              <span className="text-[12px] font-bold text-mute">{key.label}</span>
              <span className="font-display text-[24px] text-ink">{longDate(key.date)}</span>
              {phase !== "ended" && <span className="font-bold text-coral-deep">{dday(key.date)}</span>}
            </p>
          )}
        </div>
      </div>

      <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">{e.summary}</p>

      <dl className="mt-5 divide-y divide-line rounded-2xl bg-white px-4 text-[14px] shadow-[var(--shadow-soft)]">
        {[
          ["기간", e.startDate || e.endDate ? `${e.startDate ? longDate(e.startDate) : ""}${e.endDate ? ` ~ ${longDate(e.endDate)}` : " ~"}` : "미정"],
          ["장소", e.place ?? REGIONS[e.region]],
          ["한국에서 이용", e.scopeQuoted ? "공식 원문에서 확인한 내용이에요" : "공식 원문에 명시가 없어 판매 방식으로 판단했어요"],
          ["캐릭터", e.characters.join(", ") || "—"],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-4 py-3">
            <dt className="w-24 shrink-0 text-[12px] font-bold text-mute">{k}</dt>
            <dd className="font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      {e.changes.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display text-[19px] text-ink">바뀐 내용</h2>
          <ul className="mt-2 space-y-2">
            {e.changes.map((c) => (
              <li key={c.at} className="rounded-2xl bg-butter/50 p-4 text-[13px] leading-relaxed">
                <p className="text-[11px] font-bold text-mute">{checkedLabel(c.at)}</p>
                <p className="mt-1 text-ink-soft line-through decoration-mute/60">{c.before}</p>
                <p className="font-bold text-ink">{c.after}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 rounded-2xl bg-white p-4 text-[13px] shadow-[var(--shadow-soft)]">
        <h2 className="font-display text-[17px] text-ink">공식 출처 · 확인 기록</h2>
        <p className="mt-2">
          <a href={e.source.url} target="_blank" rel="noopener noreferrer nofollow" className="font-bold text-coral-deep underline decoration-coral/40 underline-offset-4">
            {e.source.label} ↗
          </a>
        </p>
        <p className="mt-1.5 text-[12px] text-mute">
          공지 {checkedLabel(e.noticeCheckedAt)} · 링크 {checkedLabel(e.linkCheckedAt)}
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">재고, 입장 가능 여부, 실제 신청 조건은 공식 페이지에서 다시 확인해 주세요.</p>
      </section>

      {products.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-[19px] text-ink">이 일정의 상품</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {products.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <DemoNotice className="mt-6" />
    </article>
  );
}
