// 상품·일정 목록을 받아 화면용으로 고르는 순수 함수들. 데이터는 data.ts 가 가져온다.
// (브라우저 컴포넌트에서도 쓰므로 여기서는 DB나 서버 전용 모듈을 불러오지 않는다.)
import { daysUntil } from "./format";
import type { EventItem, Offer, Product } from "./types";

export const jpOffer = (p: Product): Offer | undefined => p.offers.find((o) => o.country === "JP");

/** 같은 상품임을 확인한 한국 판매가만 돌려준다. 확인 안 된 가격은 비교에 쓰지 않는다 */
export const krOffer = (p: Product): Offer | undefined =>
  p.offers.find((o) => o.country === "KR" && o.sameItemVerified === true);

export const canCompare = (p: Product) => Boolean(jpOffer(p) && krOffer(p));

const byNewest = (a: Product, b: Product) => b.addedAt.localeCompare(a.addedAt);

export const editorPicks = (ps: Product[]) => ps.filter((p) => p.editorPick && p.saleStatus !== "ended");

/** 최근 30일 안에 일본에서 출시된 상품 */
export const newReleases = (ps: Product[]) =>
  ps
    .filter((p) => p.saleStatus === "on_sale" && p.releaseDate && daysUntil(p.releaseDate) >= -30)
    .sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));

export const characterAndGacha = (ps: Product[]) =>
  ps.filter((p) => (p.category === "character" || p.category === "gacha") && p.saleStatus !== "ended").sort(byNewest);

export const popupItems = (ps: Product[]) => ps.filter((p) => p.category === "popup" && p.saleStatus !== "ended");

export const upcoming = (ps: Product[]) =>
  ps.filter((p) => p.saleStatus === "upcoming").sort((a, b) => (a.releaseDate ?? "").localeCompare(b.releaseDate ?? ""));

export const comparable = (ps: Product[]) => ps.filter(canCompare);

export const related = (ps: Product[], p: Product, n = 5) =>
  ps
    .filter((q) => q.id !== p.id && q.saleStatus !== "ended")
    .map((q) => ({ q, score: (q.brand === p.brand ? 3 : 0) + (q.category === p.category ? 2 : 0) + (q.region === p.region ? 1 : 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.q);

export const brandsOf = (ps: Product[]) => {
  const map = new Map<string, { slug: string; name: string; count: number }>();
  for (const p of ps) {
    const cur = map.get(p.brandSlug) ?? { slug: p.brandSlug, name: p.brand, count: 0 };
    cur.count += 1;
    map.set(p.brandSlug, cur);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ko"));
};

/* ---------- 일정 ---------- */

export type EventPhase = "ongoing" | "upcoming" | "ended";

export const eventPhase = (e: EventItem): EventPhase => {
  if (e.endDate && daysUntil(e.endDate) < 0) return "ended";
  if (e.startDate && daysUntil(e.startDate) > 0) return "upcoming";
  // 시작일만 있는 발매 공지는 발매 후 14일까지 '진행 중'으로 본다
  if (!e.endDate && e.startDate && daysUntil(e.startDate) < -14) return "ended";
  return "ongoing";
};

/** 카드에 크게 보여 줄 '다음 날짜': 예정이면 시작일, 진행 중이면 종료·마감일 */
export const eventKeyDate = (e: EventItem): { label: string; date?: string } => {
  const phase = eventPhase(e);
  if (phase === "upcoming") return { label: e.kind === "popup" || e.kind === "campaign" ? "시작" : "발매", date: e.startDate };
  if (phase === "ongoing" && e.endDate) return { label: e.kind === "lottery" || e.kind === "preorder" ? "접수 마감" : "종료", date: e.endDate };
  if (phase === "ongoing") return { label: "발매", date: e.startDate };
  return { label: "종료", date: e.endDate ?? e.startDate };
};

export const sortEvents = (es: EventItem[]) =>
  [...es].sort((a, b) => (eventKeyDate(a).date ?? "9999").localeCompare(eventKeyDate(b).date ?? "9999"));

export const liveEvents = (es: EventItem[]) => sortEvents(es).filter((e) => eventPhase(e) !== "ended");
export const eventsForProduct = (es: EventItem[], slug: string) => es.filter((e) => e.productSlugs.includes(slug));
export const eventsForBrand = (es: EventItem[], brandSlug: string) => sortEvents(es).filter((e) => e.brandSlug === brandSlug);
