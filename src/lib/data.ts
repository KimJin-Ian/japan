// 서버 전용 데이터 접근. Supabase에서 게시된 상품·일정을 읽는다.
// - 사용자 화면: 공개(publishable) 키 + RLS(published 만 읽기) → 승인 안 된 행은 애초에 내려오지 않는다.
// - 관리자 화면: 비밀(secret) 키. 이 파일은 서버에서만 불러온다.
// 환경변수가 없으면(로컬에서 DB 없이 볼 때) 예시 데이터로 대신한다.
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { CANDIDATES, COLLECTION_LOGS, EVENTS, PRODUCTS } from "./demo-data";
import { DEMO_RATE, setToday } from "./format";
import type { Candidate, CollectionLog, EventItem, Offer, Product, Source } from "./types";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET = process.env.SUPABASE_SECRET_KEY;

export const dbReady = Boolean(URL_ && PUBLISHABLE);

const client = (key: string): SupabaseClient => createClient(URL_!, key, { auth: { persistSession: false, autoRefreshToken: false } });
const publicDb = () => client(PUBLISHABLE!);
export const adminDb = () => {
  if (!URL_ || !SECRET) throw new Error("SUPABASE_SECRET_KEY 가 설정되지 않았습니다");
  return client(SECRET);
};

/** DB의 timestamptz(UTC) → 한국·일본 시각 'YYYY-MM-DDTHH:mm' */
const kst = (iso: string | null | undefined) => (iso ? new Date(Date.parse(iso) + 9 * 3_600_000).toISOString().slice(0, 16) : "");

/* eslint-disable @typescript-eslint/no-explicit-any */
const toOffer = (o: any): Offer => ({
  country: o.country,
  seller: o.seller,
  price: Number(o.price),
  currency: o.currency,
  url: o.url,
  checkedAt: kst(o.checked_at),
  taxIncluded: o.tax_included,
  sameItemVerified: o.same_item_verified ?? undefined,
  productCode: o.product_code ?? undefined,
  note: o.note ?? undefined,
});

const toSource = (s: any): Source => ({ label: s.label, url: s.url, type: s.type, checkedAt: kst(s.checked_at), verified: s.verified });

const toProduct = (r: any): Product => ({
  id: r.id,
  slug: r.slug,
  nameKo: r.name_ko,
  nameJa: r.name_ja,
  brand: r.brand,
  brandSlug: r.brand_slug,
  category: r.category,
  character: r.character ?? undefined,
  tags: r.tags ?? [],
  summary: r.summary,
  limited: { status: r.limited_status, types: r.limited_types ?? [], evidence: r.limited_evidence },
  region: r.region,
  places: r.places ?? [],
  releaseDate: r.release_date ?? undefined,
  endDate: r.end_date ?? undefined,
  saleStatus: r.sale_status,
  krOfficial: r.kr_official,
  conditions: r.conditions ?? [],
  offers: (r.product_offers ?? []).map(toOffer),
  sources: (r.product_sources ?? []).map(toSource),
  editorPick: r.editor_pick,
  addedAt: r.added_at,
  // 이미지가 없는 상품은 기본 그림으로
  visual: r.visual ?? { tone: "peach", motif: "sweets" },
  imageUrl: r.image_url ?? undefined,
  isDemo: r.is_demo,
});

const toEvent = (r: any): EventItem => ({
  id: r.id,
  slug: r.slug,
  titleKo: r.title_ko,
  titleJa: r.title_ja,
  brand: r.brand,
  brandSlug: r.brand_slug,
  characters: r.characters ?? [],
  kind: r.kind,
  summary: r.summary,
  region: r.region,
  place: r.place ?? undefined,
  startDate: r.start_date ?? undefined,
  endDate: r.end_date ?? undefined,
  krScope: r.kr_scope,
  scopeQuoted: r.scope_quoted,
  source: { label: r.source_label, url: r.source_url, type: r.source_type, checkedAt: kst(r.notice_checked_at), verified: r.source_verified },
  noticeCheckedAt: kst(r.notice_checked_at),
  linkCheckedAt: kst(r.link_checked_at ?? r.notice_checked_at),
  changes: (r.event_changes ?? []).map((c: any) => ({ at: kst(c.changed_at), before: c.before_text, after: c.after_text })),
  productSlugs: (r.event_products ?? []).map((x: any) => x.products?.slug).filter(Boolean),
  isDemo: r.is_demo,
});

const AI_FIELDS = ["nameKo", "summaryKo", "brand", "category", "limitedTypes", "releaseDate", "endDate", "places", "priceJpy", "usefulForKr"] as const;

/** 아직 AI 분석을 거치지 않은 후보는 모든 항목을 '확인 필요'(값 없음)로 채운다 */
const normalizeAi = (ai: any): Candidate["ai"] =>
  Object.fromEntries(AI_FIELDS.map((k) => [k, ai?.[k] && typeof ai[k] === "object" ? ai[k] : { value: null, confidence: 0 }])) as Candidate["ai"];

const METHOD_LABEL ={ rss: "RSS", api: "API", manual: "수동 등록" } as const;

/* ---------- 사용자 화면 (캐시) ---------- */

/** 오늘 날짜(한국 시간, YYYY-MM-DD). 한 시간 단위로 다시 계산한다 */
export async function getToday(): Promise<string> {
  "use cache";
  cacheLife("hours");
  return new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);
}

/** 일반 뉴스 성격의 글에 붙는 태그. 수집기(analyze.py)가 '소비자 상품 아님'으로 본 글에 붙인다 */
export const NEWS_TAG = "뉴스";
const isNews = (p: Product) => p.tags.includes(NEWS_TAG);

/** 게시된 글 전체 (상품 소식 + 일반 뉴스). 상세 페이지 조회·사이트맵용 */
export async function getAllProducts(): Promise<Product[]> {
  setToday(await getToday());
  return cachedProducts();
}

/** 상품·굿즈·팝업 소식 (최근 등록순). 홈과 목록은 이것만 쓴다 */
export const getProducts = async () => (await getAllProducts()).filter((p) => !isNews(p));

/** 일반 뉴스 */
export const getNews = async () => (await getAllProducts()).filter(isNews);

export async function getEvents(): Promise<EventItem[]> {
  setToday(await getToday());
  return cachedEvents();
}

async function cachedProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  if (!dbReady) return PRODUCTS;
  const { data, error } = await publicDb().from("products").select("*, product_offers(*), product_sources(*)")
    .order("published_at", { ascending: false })
    .limit(3000);
  if (error) throw new Error(`상품을 불러오지 못했습니다: ${error.message}`);
  return data.map(toProduct);
}

async function cachedEvents(): Promise<EventItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("events");
  if (!dbReady) return EVENTS;
  const { data, error } = await publicDb().from("events").select("*, event_changes(*), event_products(products(slug))");
  if (error) throw new Error(`일정을 불러오지 못했습니다: ${error.message}`);
  return data.map(toEvent);
}

/** 최신 JPY→KRW 환율. 수집기가 하루 한 번 exchange_rates 에 넣는다. 없으면 가정값 */
export async function getRate(): Promise<{ krwPer100Jpy: number; label: string; isDemo: boolean }> {
  "use cache";
  cacheLife("hours");
  cacheTag("rate");
  const fallback = { krwPer100Jpy: DEMO_RATE.krwPer100Jpy, label: DEMO_RATE.label, isDemo: true };
  if (!dbReady) return fallback;
  const { data, error } = await publicDb()
    .from("exchange_rates")
    .select("rate, source")
    .eq("base", "JPY")
    .eq("quote", "KRW")
    .order("fetched_at", { ascending: false })
    .limit(1);
  if (error || !data?.length) return fallback;
  return { krwPer100Jpy: Math.round(Number(data[0].rate) * 1000) / 10, label: data[0].source, isDemo: false };
}

export const getProduct = async (slug: string) => (await getAllProducts()).find((p) => p.slug === slug);
export const getEvent = async (slug: string) => (await getEvents()).find((e) => e.slug === slug);

/* ---------- 관리자 화면 (캐시하지 않음) ---------- */

export async function getAdminData(): Promise<{ candidates: Candidate[]; logs: CollectionLog[]; products: Product[]; live: boolean }> {
  if (!URL_ || !SECRET) return { candidates: CANDIDATES, logs: COLLECTION_LOGS, products: PRODUCTS, live: false };
  const db = adminDb();
  const [c, l, p] = await Promise.all([
    db.from("product_candidates").select("*").order("collected_at", { ascending: false }).limit(200),
    db.from("collection_logs").select("*").order("started_at", { ascending: false }).limit(50),
    db.from("products").select("*, product_offers(*), product_sources(*)").order("added_at", { ascending: false }),
  ]);
  const err = c.error ?? l.error ?? p.error;
  if (err) throw new Error(`관리자 데이터를 불러오지 못했습니다: ${err.message}`);
  return {
    live: true,
    candidates: c.data!.map(
      (r: any): Candidate => ({
        id: r.id,
        rawTitleJa: r.raw_title_ja,
        sourceName: r.source_name,
        sourceUrl: r.source_url,
        collectedAt: kst(r.collected_at),
        reviewStatus: r.review_status,
        duplicateOf: r.duplicate_of ?? undefined,
        imageRights: r.image_rights,
        ai: normalizeAi(r.ai),
      }),
    ),
    logs: l.data!.map(
      (r: any): CollectionLog => ({
        id: r.id,
        target: r.target,
        method: METHOD_LABEL[r.method as keyof typeof METHOD_LABEL],
        startedAt: kst(r.started_at),
        ok: r.ok,
        found: r.found,
        added: r.added,
        retries: r.retries,
        error: r.error ?? undefined,
      }),
    ),
    products: p.data!.map(toProduct),
  };
}
