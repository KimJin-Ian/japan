import Link from "next/link";
import { SectionTitle } from "@/components/Bits";
import { SearchBox } from "@/components/Chrome";
import { DateRow } from "@/components/DateRow";
import { CompareTeaser } from "@/components/PriceCompare";
import { ProductCard, ProductRow } from "@/components/ProductCard";
import { MotifIcon, ProductVisual } from "@/components/ProductVisual";
import { characterAndGacha, comparable, popupItems, upcoming } from "@/lib/catalog";
import { getProducts } from "@/lib/data";
import { gyeomsaReady, GYEOMSA_REQUEST_URL } from "@/lib/gyeomsa";
import { SITE_URL } from "@/lib/site";
import type { Product, VisualMotif } from "@/lib/types";

// 홈: 도쿄의 귀여운 잡화점 × 일본 잡지. 일본어는 장식, 정보는 한국어.

type Tone = Product["visual"]["tone"];
const CATS: { href: string; label: string; ja: string; motif: VisualMotif; tone: Tone }[] = [
  { href: "/category/character", label: "캐릭터", ja: "キャラ", motif: "plush", tone: "pink" },
  { href: "/category/gacha", label: "가챠·피규어", ja: "ガチャ", motif: "capsule", tone: "butter" },
  { href: "/category/stationery", label: "문구·잡화", ja: "文具", motif: "notebook", tone: "mint" },
  { href: "/category/fashion", label: "패션", ja: "ファッション", motif: "tote", tone: "sky" },
  { href: "/category/beauty", label: "뷰티", ja: "コスメ", motif: "tube", tone: "peach" },
  { href: "/category/regional", label: "지역 한정", ja: "ご当地", motif: "sweets", tone: "peach" },
  { href: "/popup", label: "팝업스토어", ja: "ポップアップ", motif: "stand", tone: "lilac" },
  { href: "/schedule", label: "신상품", ja: "新商品", motif: "keyring", tone: "pink" },
];

const Sparkle = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" fill="currentColor" />
  </svg>
);

/** 코너 하나: 사진 있는 소식은 카드로, 이어서 글만 있는 소식을 목록으로 */
function Rail({ products }: { products: Product[] }) {
  const photos = products.filter((p) => p.imageUrl).slice(0, 5);
  const texts = products.filter((p) => !p.imageUrl).slice(0, photos.length ? 3 : 5);
  return (
    <>
      {photos.length > 0 && (
        <ul className="rail">
          {photos.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
      {texts.length > 0 && (
        <ul className="card mx-4 px-4 lg:mx-0">
          {texts.map((p) => (
            <li key={p.id}>
              <ProductRow product={p} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Hero({ products }: { products: Product[] }) {
  // 사진이 있는 최근 소식 4개를 잡지 콜라주처럼 붙인다
  const pile = products.filter((p) => p.imageUrl && p.saleStatus !== "ended").slice(0, 4);
  const pos = ["col-span-3 row-span-2 -rotate-3", "col-span-2 rotate-2 translate-y-3", "col-span-2 -rotate-1", "col-span-3 rotate-3 -translate-y-2"];
  const tapes = ["bg-butter", "bg-pink-deep", "bg-mint", "bg-lilac"];
  return (
    <section className="paper relative overflow-hidden border-b border-line/70">
      <Sparkle className="sway absolute left-[6%] top-8 h-5 w-5 text-butter" />
      <Sparkle className="sway absolute right-[8%] top-16 h-4 w-4 text-pink-deep [animation-delay:1.2s]" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-10 pt-9 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12 lg:pb-16 lg:pt-14">
        <div>
          <p className="label-tag mb-4" lang="ja">
            日本で見つけた、とっておきのアイテム
          </p>
          <h1 className="font-display text-[36px] leading-[1.2] text-ink sm:text-[46px] lg:text-[56px]">
            일본에서 발견한,
            <br />
            <span className="tape" style={{ ["--tape" as string]: "var(--color-pink-deep)" }}>
              작고 특별한 것들.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
            한정 굿즈, 콜라보, 팝업스토어. 일본에서 오늘 새로 나온 소식을 발매일·가격·파는 곳과 함께 한국어로 모았어요.
          </p>
          <div className="mt-6 max-w-lg">
            <SearchBox big />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <Link href="/products" className="btn btn-primary h-12 px-6 text-[15px]">
              새로 올라온 소식 구경하기
            </Link>
            <Link href="/popup" className="btn btn-secondary h-12 px-5 text-[14px]">
              팝업스토어 일정
            </Link>
          </div>
        </div>

        {pile.length >= 3 && (
          <div className="relative mx-auto grid w-full max-w-md grid-cols-5 gap-3 px-2 pb-4 lg:max-w-none lg:gap-4">
            {pile.map((p, i) => (
              <Link key={p.id} href={`/products/${p.slug}`} className={`card relative block p-1.5 pb-2 ${pos[i]}`}>
                <span className={`absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 -rotate-3 rounded-[2px] opacity-90 ${tapes[i]}`} aria-hidden />
                <ProductVisual product={p} className={`${i === 0 ? "aspect-[4/5]" : "aspect-square"} rounded-[14px]`} />
                <p className="mt-1.5 truncate px-1 text-center text-[11px] font-bold text-ink-soft">{p.nameKo}</p>
              </Link>
            ))}
            <span className="sway absolute -bottom-1 right-2 grid h-16 w-16 place-items-center rounded-full bg-coral text-center font-maru text-[11px] font-black leading-tight text-white shadow-[0_3px_0_#c4444c]" lang="ja" aria-hidden>
              毎日
              <br />
              NEW
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

export default async function Home() {
  const products = await getProducts();
  const live = products.filter((p) => p.saleStatus !== "ended");
  const hasTag = (p: Product, t: string) => p.tags.some((x) => x.includes(t));
  const soon = upcoming(products).slice(0, 6);
  const compare = comparable(products);

  // 日本限定 COLLECTION: 실제로 글이 있는 묶음만 보여 준다
  const collections = [
    { title: "도쿄에서만", ja: "東京", href: "/products?region=tokyo", bg: "bg-pink", items: live.filter((p) => p.region === "tokyo") },
    { title: "오사카에서만", ja: "大阪", href: "/products?region=osaka", bg: "bg-butter", items: live.filter((p) => p.region === "osaka") },
    { title: "팝업스토어 한정", ja: "ポップアップ", href: "/popup", bg: "bg-mint", items: popupItems(products) },
    { title: "콜라보 한정", ja: "コラボ", href: "/collab", bg: "bg-lilac", items: live.filter((p) => hasTag(p, "コラボ")) },
    { title: "기간·수량 한정", ja: "期間限定", href: "/products?limited=period", bg: "bg-peach", items: live.filter((p) => p.limited.status === "verified") },
  ].filter((c) => c.items.length > 0);

  const corners: { ja: string; title: string; note?: string; href: string; tape: string; items: Product[] }[] = [
    { ja: "ポップアップ", title: "지금 열리는 팝업스토어", note: "기간이 끝나면 살 수 없어요", href: "/popup", tape: "var(--color-mint)", items: popupItems(products) },
    { ja: "コラボ", title: "콜라보 한정 아이템", note: "브랜드 × 캐릭터 · 브랜드 × 브랜드", href: "/collab", tape: "var(--color-lilac)", items: live.filter((p) => hasTag(p, "コラボ")) },
    { ja: "キャラクター & ガチャ", title: "캐릭터 · 가챠", href: "/category/character", tape: "var(--color-pink-deep)", items: characterAndGacha(products) },
    { ja: "ファッション", title: "패션 · 액세서리", href: "/category/fashion", tape: "var(--color-sky)", items: live.filter((p) => p.category === "fashion") },
    { ja: "コスメ", title: "뷰티 · 화장품", href: "/category/beauty", tape: "var(--color-peach)", items: live.filter((p) => p.category === "beauty") },
    { ja: "ご当地 & グルメ", title: "지역 한정 · 먹거리", href: "/category/regional", tape: "var(--color-butter)", items: live.filter((p) => p.category === "regional" || p.category === "living") },
  ];

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

      <div className="mx-auto max-w-6xl space-y-14 pt-9 lg:space-y-20 lg:px-4 lg:pt-12">
        {/* 카테고리: 파스텔 아이콘 카드 */}
        <nav aria-label="카테고리">
          <ul className="grid grid-cols-4 gap-2.5 px-4 lg:grid-cols-8 lg:gap-3 lg:px-0">
            {CATS.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="card card-hover group flex h-full flex-col items-center gap-1 p-2 pb-2.5 text-center">
                  <MotifIcon motif={c.motif} tone={c.tone} className="aspect-square w-full rounded-2xl" />
                  <span className="mt-1 font-maru text-[9px] font-bold tracking-wide text-coral-deep" lang="ja">
                    {c.ja}
                  </span>
                  <span className="text-[12px] font-bold leading-tight text-ink">{c.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* 今週のかわいい */}
        {live.length > 0 && (
          <section>
            <SectionTitle ja="今週のかわいい" title="이번 주 발견한 귀여운 아이템" note="일본 발표 최신순" href="/products" tape="var(--color-pink-deep)" />
            <Rail products={live} />
          </section>
        )}

        {/* 日本限定 COLLECTION */}
        {collections.length > 0 && (
          <section className="gingham border-y border-line/70 py-9 lg:rounded-[32px] lg:border lg:px-7">
            <SectionTitle ja="日本限定 COLLECTION" title="일본에서만 만나는 컬렉션" note="지역과 방식별로 골라 보세요" tape="var(--color-butter)" />
            <ul className="chips px-4 pb-1 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0">
              {collections.map((c) => (
                <li key={c.title} className="w-[150px] shrink-0 lg:w-auto">
                  <Link href={c.href} className="card card-hover block overflow-hidden p-1.5">
                    <div className={`relative grid grid-cols-2 gap-1 rounded-2xl p-1.5 ${c.bg}`}>
                      {c.items
                        .filter((p) => p.imageUrl)
                        .slice(0, 2)
                        .map((p) => (
                          <ProductVisual key={p.id} product={p} className="aspect-square rounded-xl" />
                        ))}
                      {c.items.filter((p) => p.imageUrl).length < 2 && (
                        <span className="col-span-2 grid aspect-[2/1] place-items-center font-maru text-[22px] font-black text-ink/70" lang="ja">
                          {c.ja}
                        </span>
                      )}
                      <span className="label-tag absolute -top-1 left-2 !text-[10px]" lang="ja">
                        {c.ja}
                      </span>
                    </div>
                    <p className="px-1.5 pb-1 pt-2 text-[13px] font-bold text-ink">{c.title}</p>
                    <p className="px-1.5 pb-1.5 text-[11px] text-mute">소식 {c.items.length}건</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* もうすぐ発売！ */}
        {soon.length > 0 && (
          <section>
            <SectionTitle ja="もうすぐ発売！" title="곧 출시되는 일본 신상품" note="발매일이 가까운 순 · 날짜가 지나면 자동으로 빠져요" href="/schedule" tape="var(--color-lilac)" />
            <ul className="grid gap-3 px-4 md:grid-cols-2 lg:grid-cols-3 lg:px-0">
              {soon.map((p) => (
                <li key={p.id}>
                  <DateRow product={p} kind="start" />
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

        {/* どっちがお得？ — 같은 상품임을 확인한 가격이 있을 때만 */}
        {compare.length > 0 && (
          <section>
            <SectionTitle ja="どっちがお得？" title="일본에서 사면 얼마나 저렴할까?" note="같은 상품·같은 용량임을 확인한 것만 비교해요" href="/compare" tape="var(--color-sky)" />
            <ul className="grid gap-3 px-4 md:grid-cols-3 lg:px-0">
              {compare.map((p) => (
                <li key={p.id}>
                  <CompareTeaser product={p} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {products.length === 0 && <p className="card dots mx-4 px-6 py-14 text-center text-[14px] text-ink-soft lg:mx-0">아직 올라온 소식이 없어요. 매일 새 소식을 모아 올려요.</p>}

        {/* 겸사겸사: 광고가 아니라 자연스러운 다음 단계 */}
        <section className="px-4 lg:px-0">
          <div className="paper relative overflow-hidden rounded-[32px] border border-line px-6 py-10 text-center lg:py-14">
            <span className="absolute left-1/2 top-0 h-5 w-24 -translate-x-1/2 -translate-y-1/2 -rotate-2 rounded-[3px] bg-butter" aria-hidden />
            <Sparkle className="sway absolute left-[12%] top-10 h-4 w-4 text-pink-deep" />
            <Sparkle className="sway absolute bottom-10 right-[14%] h-5 w-5 text-butter [animation-delay:0.8s]" />
            <p className="font-maru text-[12px] font-black tracking-wide text-coral-deep" lang="ja">
              行けなくても、だいじょうぶ
            </p>
            <h2 className="mx-auto mt-2 max-w-md font-display text-[26px] leading-snug text-ink lg:text-[32px]">일본에 직접 가지 못해도 괜찮아요.</h2>
            <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-ink-soft">일본 여행 가는 사람에게 갖고 싶은 상품을 부탁해 보세요. 상품 이름과 파는 곳은 미리 채워 드려요.</p>
            {gyeomsaReady ? (
              <a href={GYEOMSA_REQUEST_URL} className="btn btn-primary mt-6 h-12 px-7 text-[15px]">
                겸사겸사에서 구매 부탁하기
              </a>
            ) : (
              <>
                <Link href="/products" className="btn btn-primary mt-6 h-12 px-7 text-[15px]">
                  부탁하고 싶은 상품 찾으러 가기
                </Link>
                <p className="mt-3 text-[11px] text-mute">겸사겸사 구매 부탁은 곧 열려요. 상품 페이지에서 알림을 신청할 수 있어요.</p>
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
