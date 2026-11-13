import Link from "next/link";
import { DemoNotice, EventRow, SectionTitle } from "@/components/Bits";
import { SearchBox } from "@/components/Chrome";
import { CompareTeaser } from "@/components/PriceCompare";
import { ProductCard } from "@/components/ProductCard";
import { MotifIcon, ProductVisual } from "@/components/ProductVisual";
import { characterAndGacha, comparable, editorPicks, liveEvents, popupItems, upcoming } from "@/lib/catalog";
import { getEvents, getProducts } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import { CATEGORIES } from "@/lib/taxonomy";
import type { CategorySlug, Product, VisualMotif } from "@/lib/types";

const CAT_ICON: Record<CategorySlug, { motif: VisualMotif; tone: Product["visual"]["tone"] }> = {
  character: { motif: "plush", tone: "pink" },
  gacha: { motif: "capsule", tone: "butter" },
  fashion: { motif: "tote", tone: "sky" },
  beauty: { motif: "tube", tone: "peach" },
  stationery: { motif: "notebook", tone: "mint" },
  living: { motif: "glass", tone: "sky" },
  regional: { motif: "sweets", tone: "peach" },
  popup: { motif: "stand", tone: "lilac" },
};

function Rail({ products }: { products: Product[] }) {
  return (
    <ul className="rail">
      {products.slice(0, 5).map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}

function Hero({ products }: { products: Product[] }) {
  // 에디터 추천 3개를 스티커처럼 붙인다. 추천이 모자라면 최근 등록 상품으로 채운다
  const picks = editorPicks(products);
  const pile = [...picks, ...products.filter((p) => !picks.includes(p) && p.saleStatus !== "ended")].slice(0, 3);
  const tilt = ["-rotate-6", "rotate-3 translate-y-5", "-rotate-2"];
  const tapes = ["bg-butter", "bg-pink-deep/70", "bg-mint"];
  return (
    <section className="dots relative overflow-hidden border-b border-line/70">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-10 pt-8 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10 lg:pb-16 lg:pt-14">
        <div>
          <p className="mb-3 inline-flex -rotate-2 items-center gap-1.5 rounded-full bg-white px-3 py-1 font-maru text-[12px] font-bold text-coral-deep shadow-[var(--shadow-soft)]" lang="ja">
            <span aria-hidden>✦</span> 日本でしか出会えないもの
          </p>
          <h1 className="font-display text-[34px] leading-[1.18] text-ink sm:text-[44px] lg:text-[54px]">
            일본에서만 만날 수 있는
            <br />
            <span className="tape" style={{ ["--tape" as string]: "var(--color-pink)" }}>
              특별한 상품들
            </span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
            역에서만 파는 인형, 겨울에만 나오는 잉크, 팝업에서만 뽑는 캡슐. 어디서 얼마에 살 수 있는지 공식 출처와 함께 정리했어요.
          </p>
          <div className="mt-6 max-w-lg">
            <SearchBox big />
          </div>
          <ul className="chips mt-3 text-[12px] font-bold text-ink-soft">
            {["도쿄역", "가챠", "팝업", "겨울 한정", "문구"].map((k) => (
              <li key={k}>
                <Link href={`/products?q=${encodeURIComponent(k)}`} className="block whitespace-nowrap rounded-full bg-white/80 px-3 py-1.5 hover:text-coral-deep">
                  #{k}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mx-auto grid w-full max-w-md grid-cols-3 gap-3 px-2 pb-6 lg:max-w-none lg:gap-5">
          {pile.map((p, i) => (
            <Link key={p.id} href={`/products/${p.slug}`} className={`card relative block p-1.5 pb-2 ${tilt[i]}`}>
              <span className={`absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 -rotate-3 rounded-[2px] opacity-90 ${tapes[i]}`} aria-hidden />
              <ProductVisual product={p} className="aspect-[4/5] rounded-[14px]" />
              <p className="mt-1.5 truncate px-1 text-center text-[11px] font-bold text-ink-soft">{p.nameKo.split(" ").slice(0, 2).join(" ")}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  const [products, allEvents] = await Promise.all([getProducts(), getEvents()]);
  const events = liveEvents(allEvents).slice(0, 4);
  const live = products.filter((p) => p.saleStatus !== "ended");
  const hasTag = (p: Product, t: string) => p.tags.some((x) => x.includes(t));
  // 수집되는 데이터로 채울 수 있는 코너만 둔다. 비어 있는 코너는 보이지 않는다.
  const corners: { ja: string; title: string; note?: string; href: string; tape: string; items: Product[] }[] = [
    { ja: "JUST IN", title: "방금 올라온 일본 소식", note: "일본 발표 최신순", href: "/products", tape: "var(--color-pink)", items: live },
    { ja: "POP UP", title: "지금 열리는 팝업스토어", note: "기간이 끝나면 살 수 없어요", href: "/category/popup", tape: "var(--color-mint)", items: popupItems(products) },
    { ja: "COLLABORATION", title: "콜라보 한정 아이템", note: "브랜드 × 캐릭터 · 브랜드 × 브랜드", href: "/products?q=%E3%82%B3%E3%83%A9%E3%83%9C", tape: "var(--color-lilac)", items: live.filter((p) => hasTag(p, "コラボ")) },
    { ja: "COMING SOON", title: "곧 나오는 것", note: "출시일이 가까운 순", href: "/products?status=upcoming", tape: "var(--color-peach)", items: upcoming(products) },
    {
      ja: "LAST CHANCE",
      title: "곧 끝나는 것",
      note: "판매·행사 종료가 가까운 순",
      href: "/products?status=on_sale",
      tape: "var(--color-butter)",
      items: live.filter((p) => p.saleStatus === "on_sale" && p.endDate).sort((x, y) => (x.endDate ?? "").localeCompare(y.endDate ?? "")),
    },
    { ja: "CHARACTER & GACHA", title: "캐릭터 · 가챠", href: "/category/character", tape: "var(--color-pink)", items: characterAndGacha(products) },
    { ja: "FASHION", title: "패션 · 액세서리", href: "/category/fashion", tape: "var(--color-sky)", items: live.filter((p) => p.category === "fashion") },
    { ja: "BEAUTY", title: "뷰티 · 화장품", href: "/category/beauty", tape: "var(--color-peach)", items: live.filter((p) => p.category === "beauty") },
    { ja: "LOCAL", title: "지역 한정 · 먹거리", href: "/category/regional", tape: "var(--color-mint)", items: live.filter((p) => p.category === "regional" || p.category === "living") },
  ];
  const picks = editorPicks(products);
  const compare = comparable(products);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              { "@type": "Organization", "@id": `${SITE_URL}/#org`, name: "JAPAN FINDS", url: SITE_URL },
              {
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                name: "JAPAN FINDS",
                url: SITE_URL,
                inLanguage: "ko-KR",
                publisher: { "@id": `${SITE_URL}/#org` },
                potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/products?q={search_term_string}`, "query-input": "required name=search_term_string" },
              },
            ],
          }),
        }}
      />
      <Hero products={products} />

      <div className="mx-auto max-w-6xl space-y-12 pt-8 lg:space-y-16 lg:px-4 lg:pt-12">
        <nav aria-label="카테고리">
          <ul className="grid grid-cols-4 gap-x-2 gap-y-4 px-4 sm:grid-cols-8 lg:px-0">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="group flex flex-col items-center gap-1.5 text-center">
                  <MotifIcon {...CAT_ICON[c.slug]} className="h-16 w-16 rounded-[22px] transition-transform duration-200 group-hover:-translate-y-1 group-hover:rotate-[-4deg] lg:h-20 lg:w-20" />
                  <span className="text-[12px] font-bold text-ink-soft group-hover:text-coral-deep">{c.short}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <DemoNotice className="mx-4 lg:mx-0" />

        {picks.length > 0 && (
          <section>
            <SectionTitle ja="PICK UP" title="지금 주목할 일본 한정템" note="에디터가 고른 상품이에요. 판매량 순위가 아니에요." href="/products" tape="var(--color-pink)" />
            <Rail products={picks} />
          </section>
        )}

        {events.length > 0 && (
          <section className="gingham border-y border-line/70 py-8 lg:rounded-[28px] lg:border lg:px-6">
            <SectionTitle ja="SCHEDULE" title="놓치면 아쉬운 일정" note="팝업 · 발매 · 응모 마감을 날짜순으로" href="/schedule" tape="var(--color-mint)" />
            <ul className="grid gap-3 px-4 md:grid-cols-2 lg:px-0">
              {events.map((e) => (
                <li key={e.id}>
                  <EventRow event={e} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {corners
          .filter((c) => c.items.length > 0)
          .map((c) => (
            <section key={c.ja}>
              <SectionTitle ja={c.ja} title={c.title} note={c.note} href={c.href} tape={c.tape} />
              <Rail products={c.items} />
            </section>
          ))}

        {compare.length > 0 && (
          <section>
            <SectionTitle ja="PRICE CHECK" title="일본 현지 가격으로 보기" note="같은 상품·같은 용량임을 확인한 것만 비교해요" href="/compare" tape="var(--color-sky)" />
            <ul className="grid gap-3 px-4 md:grid-cols-3 lg:px-0">
              {compare.map((p) => (
                <li key={p.id}>
                  <CompareTeaser product={p} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {products.length === 0 && <p className="card dots mx-4 px-6 py-14 text-center text-[14px] text-ink-soft lg:mx-0">아직 올라온 소식이 없어요. 매일 아침 새 소식을 모아 올려요.</p>}
      </div>
    </>
  );
}
