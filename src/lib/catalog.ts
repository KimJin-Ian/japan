// 상품·일정 조회 함수. 지금은 데모 데이터를 읽고, Phase 2에서 Supabase 쿼리로 바꾼다.
// 화면은 이 파일의 함수만 쓰므로 데이터 원본을 바꿔도 화면 코드는 그대로다.
import { EVENTS, PRODUCTS } from "./demo-data";
import { daysUntil } from "./format";
import type { EventItem, Offer, Product } from "./types";

export const allProducts = () => PRODUCTS;
export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const getProductById = (id: string) => PRODUCTS.find((p) => p.id === id);

export const jpOffer = (p: Product): Offer | undefined => p.offers.find((o) => o.country === "JP");

/** 같은 상품임을 확인한 한국 판매가만 돌려준다. 확인 안 된 가격은 비교에 쓰지 않는다 */
export const krOffer = (p: Product): Offer | undefined =>
  p.offers.find((o) => o.country === "KR" && o.sameItemVerified === true);

export const canCompare = (p: Product) => Boolean(jpOffer(p) && krOffer(p));

const byNewest = (a: Product, b: Product) => b.addedAt.localeCompare(a.addedAt);

export const editorPicks = () => PRODUCTS.filter((p) => p.editorPick && p.saleStatus !== "ended");

/** 최근 30일 안에 일본에서 출시된 상품 */
export const newReleases = () =>
  PRODUCTS.filter((p) => p.saleStatus === "on_sale" && p.releaseDate && daysUntil(p.releaseDate) >= -30).sort((a, b) =>
    (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""),
  );

export const characterAndGacha = () =>
  PRODUCTS.filter((p) => (p.category === "character" || p.category === "gacha") && p.saleStatus !== "ended").sort(byNewest);

export const popupItems = () => PRODUCTS.filter((p) => p.category === "popup" && p.saleStatus !== "ended");

export const upcoming = () =>
  PRODUCTS.filter((p) => p.saleStatus === "upcoming").sort((a, b) => (a.releaseDate ?? "").localeCompare(b.releaseDate ?? ""));

export const comparable = () => PRODUCTS.filter(canCompare);

export const related = (p: Product, n = 5) =>
  PRODUCTS.filter((q) => q.id !== p.id && q.saleStatus !== "ended")
    .map((q) => ({ q, score: (q.brand === p.brand ? 3 : 0) + (q.category === p.category ? 2 : 0) + (q.region === p.region ? 1 : 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.q);

export const brands = () => {
  const map = new Map<string, { slug: string; name: string; count: number }>();
  for (const p of PRODUCTS) {
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

export const allEvents = () =>
  [...EVENTS].sort((a, b) => (eventKeyDate(a).date ?? "9999").localeCompare(eventKeyDate(b).date ?? "9999"));

export const liveEvents = () => allEvents().filter((e) => eventPhase(e) !== "ended");
export const getEvent = (slug: string) => EVENTS.find((e) => e.slug === slug);
export const eventsForProduct = (slug: string) => EVENTS.filter((e) => e.productSlugs.includes(slug));
export const eventsForBrand = (brandSlug: string) => allEvents().filter((e) => e.brandSlug === brandSlug);
