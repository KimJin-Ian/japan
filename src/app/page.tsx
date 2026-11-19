import Link from "next/link";
import { SectionTitle } from "@/components/Bits";
import { DateRow } from "@/components/DateRow";
import { CompareTeaser } from "@/components/PriceCompare";
import { ProductCard, ProductRow, dateLine } from "@/components/ProductCard";
import { MotifIcon, ProductVisual } from "@/components/ProductVisual";
import { characterAndGacha, comparable, jpOffer, popupItems, upcoming } from "@/lib/catalog";
import { getProducts } from "@/lib/data";
import { PIN_TAG, isFavorite } from "@/lib/favorites";
import { daysUntil, dday, yen } from "@/lib/format";
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

/** 매거진형 상단: 대표 글 1장을 크게, 이어서 4장을 작게. 문구·검색창 없이 바로 글이 보인다 */
function Hero({ products }: { products: Product[] }) {
  const top = products.filter((p) => p.imageUrl && p.saleStatus !== "ended").slice(0, 5);
  if (top.length < 5) return null;
  const [big, ...small] = top;
  const offer = jpOffer(big);
  const meta = [offer ? yen(offer.price) : "", dateLine(big), big.brand !== "기타" ? big.brand : ""].filter(Boolean).join(" · ");
  return (
    <section className="mx-auto max-w-6xl px-4 pt-4 lg:pt-6">
      <h1 className="sr-only">일본 한정판·팝업스토어·콜라보 굿즈 소식</h1>
      <div className="grid gap-2 lg:grid-cols-[1.25fr_1fr] lg:gap-4">
        <Link href={`/products/${big.slug}`} className="card card-hover relative block overflow-hidden !rounded-[24px]">
          <ProductVisual product={big} className="aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[420px]" />
          {big.saleStatus === "upcoming" && big.releaseDate && (
            <span className="sticker absolute left-3 top-3 -rotate-3 bg-coral text-white">곧 출시 {dday(big.releaseDate)}</span>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/45 to-transparent px-4 pb-3.5 pt-12 text-white lg:px-6 lg:pb-5">
            <p className="line-clamp-2 font-display text-[20px] leading-snug lg:text-[28px]">{big.nameKo}</p>
            {meta && <p className="mt-1 text-[12px] opacity-90 lg:text-[14px]">{meta}</p>}
          </div>
        </Link>
        {/* 휴대폰: 2칸 × 2줄, 사진 밑에 제목 · 가격 (4칸 한 줄에 사진만 있으면 무슨 소식인지 알 수 없었다 — 11/19) */}
        <ul className="grid grid-cols-2 gap-2 lg:grid-cols-2 lg:gap-4">
          {small.map((p) => {
            const o = jpOffer(p);
            return (
              <li key={p.id}>
                <Link href={`/products/${p.slug}`} className="card card-hover flex h-full flex-col p-1 lg:p-1.5" aria-label={p.nameKo}>
                  {/* 웹에서는 카드 높이에 맞춰 사진이 남는 공간을 다 채운다 */}
                  <ProductVisual product={p} className="aspect-[4/3] rounded-[14px] lg:aspect-auto lg:min-h-[150px] lg:flex-1 lg:rounded-2xl" />
                  <div className="px-1 pb-1 pt-1.5 lg:px-1.5 lg:pb-1.5 lg:pt-2">
                    <p className="line-clamp-2 text-[13px] font-bold leading-snug text-ink lg:text-[14px]">{p.nameKo}</p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-mute lg:mt-1 lg:text-[12px]">
                      {o && <b className="mr-1.5 text-ink">{yen(o.price)}</b>}
                      {dateLine(p)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default async function Home() {
  const products = await getProducts();
  const live = products.filter((p) => p.saleStatus !== "ended");
  const hasTag = (p: Product, t: string) => p.tags.some((x) => x.includes(t));
  // 今週のかわいい: 최근 7일 글 가운데 한국에서 사랑받을 만한 것(추천)을 앞에, 그중에서도 캐릭터·가챠·문구·팝업을 맨 앞에 둔다
  const recent = live.filter((p) => daysUntil(p.addedAt) >= -7 && !p.tags.includes("관심낮음"));
  const cuteCats = ["character", "gacha", "stationery", "popup"];
  // 한국에서 잘 알려진 이름(치이카와·산리오·포켓몬·유니클로 …)이 든 글이 맨 앞, 그다음 추천 글, 그 안에서는 캐릭터·가챠·문구·팝업 먼저
  const score = (p: Product) => (isFavorite(p) ? 0 : p.editorPick ? 3 : 6) + (cuteCats.includes(p.category) ? 0 : 1) + (p.imageUrl ? 0 : 1);
  const ranked = recent.map((p, i) => ({ p, i })).sort((a, b) => score(a.p) - score(b.p) || a.i - b.i).map((x) => x.p);
  // 맨 위는 고정 글. 수집할 때마다 바뀌지 않고, 판매가 끝나거나 오래되면 수집기(curate.py)가 바꿔 끼운다
  const pinned = live.filter((p) => p.tags.includes(PIN_TAG) && p.imageUrl).sort((a, b) => a.slug.localeCompare(b.slug));
  const cute = [...pinned, ...ranked.filter((p) => !pinned.includes(p))];
  const heroList = cute.filter((p) => p.imageUrl).length >= 5 ? cute : live;
  const heroIds = new Set(heroList.filter((p) => p.imageUrl).slice(0, 5).map((p) => p.id));
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

  // 코너마다 한국에서 잘 알려진 이름이 든 글을 앞에, 그다음 추천 글, 관심 낮은 글은 맨 뒤로 (같은 순위 안에서는 최신순 유지)
  const favRank = (p: Product) => (isFavorite(p) ? 0 : p.editorPick ? 1 : p.tags.includes("관심낮음") ? 3 : 2);
  const favFirst = (list: Product[]) => list.map((p, i) => ({ p, i })).sort((a, b) => favRank(a.p) - favRank(b.p) || a.i - b.i).map((x) => x.p);

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
      <Hero products={heroList} />

      <div className="mx-auto max-w-6xl space-y-12 pt-8 lg:space-y-16 lg:px-4 lg:pt-10">
        {/* 今週のかわいい */}
        {cute.length > 0 && (
          <section>
            <SectionTitle ja="今週のかわいい" title="이번 주 발견한 귀여운 아이템" note="최근 일주일, 한국에서 사랑받을 만한 것부터" href="/products" tape="var(--color-pink-deep)" />
            <Rail products={cute.filter((p) => !heroIds.has(p.id))} />
          </section>
        )}

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
              <Rail products={favFirst(c.items)} />
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
