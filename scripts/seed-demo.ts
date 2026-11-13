// 예시(데모) 데이터를 Supabase에 넣는다. 여러 번 실행해도 같은 결과가 되도록 데모 행을 지우고 다시 넣는다.
// 실행: npm run seed:demo   (node --env-file=.env.local scripts/seed-demo.ts)
// is_demo = true 인 행과 example.com/demo 출처의 후보·로그만 건드린다. 실제 데이터는 지우지 않는다.
import { createClient } from "@supabase/supabase-js";
import { CANDIDATES, COLLECTION_LOGS, EVENTS, PRODUCTS } from "../src/lib/demo-data.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error(".env.local 에 NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SECRET_KEY 가 필요합니다");

const db = createClient(url, key, { auth: { persistSession: false } });

/** 데모 데이터의 시각은 한국·일본 시간(UTC+9)으로 적혀 있다 */
const kst = (iso: string) => (iso.length <= 16 ? `${iso}:00+09:00` : iso);
const must = <T,>(res: { data: T; error: { message: string } | null }, what: string): T => {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
};

// 1) 이전 데모 행 삭제 (자식 테이블은 on delete cascade)
must(await db.from("events").delete().eq("is_demo", true), "events 삭제");
must(await db.from("product_candidates").delete().like("source_url", "https://example.com/demo/%"), "candidates 삭제");
must(await db.from("products").delete().eq("is_demo", true), "products 삭제");
must(await db.from("collection_logs").delete().like("target", "%(데모)"), "logs 삭제");

// 2) 상품
const productRows = must(
  await db
    .from("products")
    .insert(
      PRODUCTS.map((p) => ({
        slug: p.slug,
        name_ko: p.nameKo,
        name_ja: p.nameJa,
        brand: p.brand,
        brand_slug: p.brandSlug,
        category: p.category,
        character: p.character ?? null,
        tags: p.tags,
        summary: p.summary,
        limited_status: p.limited.status,
        limited_types: p.limited.types,
        limited_evidence: p.limited.evidence,
        region: p.region,
        places: p.places,
        release_date: p.releaseDate ?? null,
        end_date: p.endDate ?? null,
        sale_status: p.saleStatus,
        kr_official: p.krOfficial,
        conditions: p.conditions,
        editor_pick: Boolean(p.editorPick),
        visual: p.visual,
        is_demo: true,
        publish_status: "published",
        published_at: new Date().toISOString(),
        added_at: p.addedAt,
      })),
    )
    .select("id, slug"),
  "products 입력",
) as { id: string; slug: string }[];
const idBySlug = new Map(productRows.map((r) => [r.slug, r.id]));
const idByDemoId = new Map(PRODUCTS.map((p) => [p.id, idBySlug.get(p.slug)!]));

must(
  await db.from("product_offers").insert(
    PRODUCTS.flatMap((p) =>
      p.offers.map((o) => ({
        product_id: idBySlug.get(p.slug),
        country: o.country,
        seller: o.seller,
        price: o.price,
        currency: o.currency,
        url: o.url,
        product_code: o.productCode ?? null,
        tax_included: o.taxIncluded,
        same_item_verified: o.sameItemVerified ?? null,
        note: o.note ?? null,
        checked_at: kst(o.checkedAt),
      })),
    ),
  ),
  "offers 입력",
);

must(
  await db.from("product_sources").insert(
    PRODUCTS.flatMap((p) =>
      p.sources.map((s) => ({ product_id: idBySlug.get(p.slug), label: s.label, url: s.url, type: s.type, checked_at: kst(s.checkedAt), verified: s.verified })),
    ),
  ),
  "sources 입력",
);

// 3) 일정
const eventRows = must(
  await db
    .from("events")
    .insert(
      EVENTS.map((e) => ({
        slug: e.slug,
        title_ko: e.titleKo,
        title_ja: e.titleJa,
        brand: e.brand,
        brand_slug: e.brandSlug,
        characters: e.characters,
        kind: e.kind,
        summary: e.summary,
        region: e.region,
        place: e.place ?? null,
        start_date: e.startDate ?? null,
        end_date: e.endDate ?? null,
        kr_scope: e.krScope,
        scope_quoted: e.scopeQuoted,
        source_label: e.source.label,
        // 같은 공지에서 나온 일정이 여럿일 수 있어 주소에 slug를 붙여 구분한다(데모 한정)
        source_url: `${e.source.url}#${e.slug}`,
        source_type: e.source.type,
        source_verified: e.source.verified,
        notice_checked_at: kst(e.noticeCheckedAt),
        link_checked_at: kst(e.linkCheckedAt),
        link_ok: true,
        collect_method: "manual",
        is_demo: true,
        publish_status: "published",
        published_at: new Date().toISOString(),
      })),
    )
    .select("id, slug"),
  "events 입력",
) as { id: string; slug: string }[];
const eventId = new Map(eventRows.map((r) => [r.slug, r.id]));

const changes = EVENTS.flatMap((e) => e.changes.map((c) => ({ event_id: eventId.get(e.slug), changed_at: kst(c.at), before_text: c.before, after_text: c.after })));
if (changes.length) must(await db.from("event_changes").insert(changes), "event_changes 입력");

const links = EVENTS.flatMap((e) => e.productSlugs.map((s) => ({ event_id: eventId.get(e.slug), product_id: idBySlug.get(s) })));
must(await db.from("event_products").insert(links), "event_products 입력");

// 4) 관리자: 수집 로그 · 후보
const METHOD = { RSS: "rss", API: "api", "수동 등록": "manual" } as const;
must(
  await db.from("collection_logs").insert(
    COLLECTION_LOGS.map((l) => ({
      target: `${l.target} (데모)`,
      method: METHOD[l.method],
      started_at: kst(l.startedAt),
      finished_at: kst(l.startedAt),
      ok: l.ok,
      found: l.found,
      added: l.added,
      retries: l.retries,
      error: l.error ?? null,
    })),
  ),
  "logs 입력",
);

must(
  await db.from("product_candidates").insert(
    CANDIDATES.map((c) => ({
      raw_title_ja: c.rawTitleJa,
      source_name: c.sourceName,
      source_url: c.sourceUrl,
      collected_at: kst(c.collectedAt),
      ai: c.ai,
      ai_model: "demo",
      review_status: c.reviewStatus,
      duplicate_of: c.duplicateOf ? idByDemoId.get(c.duplicateOf) : null,
      image_rights: c.imageRights,
    })),
  ),
  "candidates 입력",
);

console.log(`완료: 상품 ${productRows.length} · 일정 ${eventRows.length} · 후보 ${CANDIDATES.length} · 로그 ${COLLECTION_LOGS.length}`);
