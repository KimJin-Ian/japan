import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoNotice, EventRow, SectionTitle } from "@/components/Bits";
import { PriceCompare } from "@/components/PriceCompare";
import { ProductCard } from "@/components/ProductCard";
import { ProductVisual } from "@/components/ProductVisual";
import { RequestCta, ViewTracker } from "@/components/RequestCta";
import { SaveButton } from "@/components/SaveButton";
import { DemoSticker, KrSticker, LimitedStickers, StatusSticker } from "@/components/Stickers";
import { eventsForProduct, jpOffer, related } from "@/lib/catalog";
import { getEvents, getProduct, getProducts } from "@/lib/data";
import { checkedLabel, dday, longDate, yen } from "@/lib/format";
import { buildPrefill, gyeomsaReady } from "@/lib/gyeomsa";
import { SITE_URL } from "@/lib/site";
import { KR_OFFICIAL, REGIONS, SALE_STATUS, categoryName } from "@/lib/taxonomy";
import type { Product } from "@/lib/types";

// 등록되지 않은 주소는 서버에서 다 그린 뒤 보낸다(검색엔진이 완성된 HTML을 받도록).
export const instant = false;

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  const offer = jpOffer(p);
  const title = `${p.nameKo} — 일본 가격·판매처`;
  const description = `${p.summary} ${offer ? `일본 현지 가격 ${yen(offer.price)}.` : ""} 살 수 있는 곳: ${p.places.join(", ")}.`;
  return {
    title,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title, description, type: "article" },
    // 예시 데이터 페이지는 검색에 노출하지 않는다
    robots: p.isDemo ? { index: false, follow: true } : undefined,
  };
}

const SOURCE_TYPE = { official_site: "공식 사이트", press_release: "보도자료", store_notice: "매장 공지" } as const;

/** 한국에서 구하는 방법 — 판매처 조건에서 알 수 있는 것만 적는다 */
function waysToGet(p: Product) {
  const hasOnline = p.places.some((x) => x.includes("온라인"));
  return [
    {
      title: "일본에 가서 직접 사기",
      ok: true,
      body: `${p.places[0]}${p.places.length > 1 ? ` 등 ${p.places.length}곳` : ""}에서 살 수 있어요.`,
    },
    {
      title: "일본 온라인몰에서 한국으로 받기",
      ok: false,
      body: hasOnline ? "온라인 판매는 있지만 일본 주소로만 배송한다고 안내돼요." : "온라인 판매가 없는 매장·회장 전용 상품이에요.",
    },
    {
      title: "배송대행 · 구매대행",
      ok: hasOnline,
      body: hasOnline
        ? "일본 주소로 받아 다시 보내는 방식은 가능할 수 있어요. 판매처가 대행 주문을 받는지와 수수료·국제배송비를 먼저 확인하세요."
        : "온라인 주문이 없어서 일반 배송대행으로는 구하기 어려워요.",
    },
  ];
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-[var(--shadow-soft)]">
      <dt className="text-[11px] font-bold text-mute">{label}</dt>
      <dd className="mt-1 text-[14px] font-bold leading-snug text-ink">{children}</dd>
    </div>
  );
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const [all, allEvents] = await Promise.all([getProducts(), getEvents()]);

  const offer = jpOffer(p);
  const events = eventsForProduct(allEvents, p.slug);
  const more = related(all, p);
  const prefill = buildPrefill(p);
  const ended = p.saleStatus === "ended";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nameKo,
    alternateName: p.nameJa,
    description: p.summary,
    brand: { "@type": "Brand", name: p.brand },
    category: categoryName(p.category),
    url: `${SITE_URL}/products/${p.slug}`,
    ...(p.releaseDate && { releaseDate: p.releaseDate }),
    ...(offer && {
      offers: {
        "@type": "Offer",
        price: offer.price,
        priceCurrency: "JPY",
        availability: ended ? "https://schema.org/Discontinued" : p.saleStatus === "upcoming" ? "https://schema.org/PreOrder" : "https://schema.org/InStoreOnly",
        url: offer.url,
        eligibleRegion: "JP",
      },
    }),
  };

  return (
    <article className="pb-28">
      <ViewTracker productId={p.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <div className="mx-auto max-w-6xl px-4 pt-4">
        <nav aria-label="현재 위치" className="mb-3 text-[12px] text-mute">
          <Link href="/" className="hover:text-coral-deep">
            홈
          </Link>
          <span className="mx-1.5">›</span>
          <Link href={`/category/${p.category}`} className="hover:text-coral-deep">
            {categoryName(p.category)}
          </Link>
        </nav>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-10">
          {/* 이미지 */}
          <div className="relative lg:sticky lg:top-36">
            <ProductVisual product={p} className={`aspect-square rounded-[28px] ${ended ? "opacity-70 grayscale-[30%]" : ""}`} />
            {p.isDemo && <DemoSticker className="absolute left-3 top-3 -rotate-3" />}
          </div>

          <div className="mt-5 lg:mt-0">
            {/* 한정 여부를 가장 먼저 */}
            <div className="flex flex-wrap gap-1.5">
              <StatusSticker product={p} />
              <LimitedStickers product={p} />
              <KrSticker product={p} />
            </div>

            <h1 className="mt-3 font-display text-[27px] leading-[1.25] text-ink lg:text-[34px]">{p.nameKo}</h1>
            <p className="mt-1.5 font-maru text-[13px] font-medium text-ink-soft" lang="ja">
              {p.nameJa}
            </p>
            <p className="mt-2 text-[13px] text-ink-soft">
              <Link href={`/brand/${p.brandSlug}`} className="font-bold text-ink underline decoration-line underline-offset-4 hover:text-coral-deep">
                {p.brand}
              </Link>
              <span className="mx-1.5 text-line">|</span>
              {categoryName(p.category)}
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{p.summary}</p>

            {/* 데스크톱 버튼 */}
            <div className="mt-5 hidden items-center gap-2 lg:flex">
              <SaveButton id={p.id} />
              <RequestCta product={p} prefill={prefill} className="flex-1" />
            </div>

            <section id="price" className="mt-6 scroll-mt-28">
              <h2 className="sr-only">가격</h2>
              <PriceCompare product={p} />
            </section>

            <dl className="mt-4 grid grid-cols-2 gap-2.5">
              <Fact label="판매 상태">{SALE_STATUS[p.saleStatus]}</Fact>
              <Fact label="출시일">
                {p.releaseDate ? (
                  <>
                    {longDate(p.releaseDate)}
                    {p.saleStatus === "upcoming" && <span className="ml-1.5 whitespace-nowrap text-coral-deep">{dday(p.releaseDate)}</span>}
                  </>
                ) : (
                  "확인 필요"
                )}
              </Fact>
              <Fact label="판매 종료일">
                {p.endDate ? (
                  <>
                    {longDate(p.endDate)}
                    {!ended && <span className="ml-1.5 whitespace-nowrap text-coral-deep">{dday(p.endDate)}</span>}
                  </>
                ) : p.limited.types.includes("quantity") ? (
                  "수량 소진 시"
                ) : (
                  "정해진 날짜 없음"
                )}
              </Fact>
              <Fact label="한국에서 살 수 있나요">{KR_OFFICIAL[p.krOfficial]}</Fact>
              <div className="col-span-2">
                <Fact label={`살 수 있는 곳 · ${REGIONS[p.region]}`}>
                  <ul className="space-y-0.5">
                    {p.places.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </Fact>
              </div>
            </dl>

            {/* 한정 근거 */}
            <section className="mt-6 rounded-[22px] border-[1.5px] border-dashed border-pink-deep/70 bg-pink/30 p-5">
              <h2 className="font-display text-[19px] text-ink">
                {p.limited.status === "verified" ? "왜 한정인가요" : p.limited.status === "checking" ? "한정 여부를 확인하고 있어요" : "한정 상품은 아니에요"}
              </h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{p.limited.evidence}</p>
            </section>

            <section className="mt-6">
              <h2 className="font-display text-[19px] text-ink">사기 전에 알아 둘 것</h2>
              <ul className="mt-2 space-y-1.5 text-[14px] leading-relaxed text-ink-soft">
                {p.conditions.map((c) => (
                  <li key={c} className="flex gap-2">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-coral" aria-hidden />
                    {c}
                  </li>
                ))}
              </ul>
            </section>

            {/* 한국에서 구하는 방법 → 구매 부탁 전환 */}
            {!ended && (
              <section className="mt-8">
                <h2 className="font-display text-[19px] text-ink">한국에서 구하려면</h2>
                <ul className="mt-3 space-y-2.5">
                  {waysToGet(p).map((w) => (
                    <li key={w.title} className="flex gap-3 rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)]">
                      <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-bold ${w.ok ? "bg-mint text-mint-deep" : "bg-cream-deep text-mute"}`} aria-hidden>
                        {w.ok ? "○" : "×"}
                      </span>
                      <div>
                        <h3 className="text-[14px] font-bold text-ink">{w.title}</h3>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">{w.body}</p>
                      </div>
                    </li>
                  ))}
                  <li className="dots relative rounded-[22px] border-[1.5px] border-coral/40 bg-white p-5">
                    <span className="absolute -top-2 left-6 h-4 w-14 -rotate-3 rounded-[2px] bg-butter" aria-hidden />
                    <h3 className="font-display text-[20px] leading-snug text-ink">일본 가는 사람에게 부탁하기</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                      마침 {REGIONS[p.region] === "일본 온라인" ? "일본" : REGIONS[p.region]}에 가는 여행자가 가는 김에 사다 줄 수 있어요. 상품 이름과 살 곳은 미리 채워
                      드려요.
                      {!gyeomsaReady && " 지금은 준비 중이라 열리면 알려 드려요."}
                    </p>
                    <RequestCta product={p} prefill={prefill} className="mt-4 w-full" />
                  </li>
                </ul>
              </section>
            )}

            {events.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-3 font-display text-[19px] text-ink">관련 일정</h2>
                <ul className="space-y-2.5">
                  {events.map((e) => (
                    <li key={e.id}>
                      <EventRow event={e} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-8">
              <h2 className="font-display text-[19px] text-ink">정보 출처</h2>
              <ul className="mt-2 divide-y divide-line rounded-2xl bg-white px-4 shadow-[var(--shadow-soft)]">
                {p.sources.map((s) => (
                  <li key={s.url} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3 text-[13px]">
                    <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="font-bold text-ink underline decoration-line underline-offset-4 hover:text-coral-deep">
                      {s.label} ↗
                    </a>
                    <span className="text-[11px] text-mute">
                      {SOURCE_TYPE[s.type]} · {checkedLabel(s.checkedAt)} · {s.verified ? "검증됨" : "검증 대기"}
                    </span>
                  </li>
                ))}
              </ul>
              <DemoNotice className="mt-3" />
            </section>
          </div>
        </div>
      </div>

      {more.length > 0 && (
        <section className="mx-auto mt-14 max-w-6xl lg:px-4">
          <SectionTitle ja="YOU MAY ALSO LIKE" title="함께 구경하면 좋은 상품" tape="var(--color-peach)" />
          <ul className="rail">
            {more.map((q) => (
              <li key={q.id}>
                <ProductCard product={q} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 모바일 고정 버튼 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <SaveButton id={p.id} />
          <RequestCta product={p} prefill={prefill} className="flex-1" />
        </div>
      </div>
    </article>
  );
}
