import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventRow, SectionTitle } from "@/components/Bits";
import { PriceCompare } from "@/components/PriceCompare";
import { ProductGrid } from "@/components/ProductCard";
import { ProductVisual } from "@/components/ProductVisual";
import { RequestCta, ViewTracker } from "@/components/RequestCta";
import { KrSticker, LimitedStickers, StatusSticker } from "@/components/Stickers";
import { eventsForProduct, jpOffer, related } from "@/lib/catalog";
import { getAllProducts, getEvents, getProduct, getProducts } from "@/lib/data";
import { checkedLabel, dday, longDate, yen } from "@/lib/format";
import { buildPrefill, gyeomsaReady } from "@/lib/gyeomsa";
import { SITE_URL } from "@/lib/site";
import { KR_OFFICIAL, REGIONS, SALE_STATUS, categoryName, categoryShort } from "@/lib/taxonomy";
import type { Product } from "@/lib/types";

// 등록되지 않은 주소는 서버에서 다 그린 뒤 보낸다(검색엔진이 완성된 HTML을 받도록).
export const instant = false;

export async function generateStaticParams() {
  // 최근 글 200개만 미리 만들어 두고, 나머지는 처음 열릴 때 만든다
  const list = (await getAllProducts()).slice(0, 200).map((p) => ({ slug: p.slug }));
  // Cache Components 빌드는 최소 1개를 요구한다. 비어 있으면 404로 떨어지는 자리표시자를 넣는다
  return list.length ? list : [{ slug: "none" }];
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  const offer = jpOffer(p);
  const knownPlace = p.places.length > 0 && !p.places[0].includes("원문에서");
  const title = `${p.nameKo} — ${p.brand} 일본 ${categoryShort(p.category)} 소식`;
  const facts = [
    p.releaseDate ? `발매 ${longDate(p.releaseDate)}` : "",
    p.endDate ? `${longDate(p.endDate)}까지` : "",
    offer ? `일본 가격 ${yen(offer.price)}` : "",
    knownPlace ? `판매처 ${p.places.slice(0, 2).join(", ")}` : "",
  ].filter(Boolean);
  const description = `${p.summary.slice(0, 110)}${p.summary.length > 110 ? "…" : ""}${facts.length ? ` (${facts.join(" · ")})` : ""}`;
  return {
    title,
    description,
    keywords: [p.nameKo, p.brand, `${p.brand} 일본`, `일본 ${categoryShort(p.category)}`, `${REGIONS[p.region]} ${categoryShort(p.category)}`, "일본 한정", ...p.tags.slice(0, 4)],
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title, description, type: "article", ...(p.imageUrl && { images: [{ url: p.imageUrl, alt: p.nameKo }] }) },
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
      body:
        p.places.length === 0 || p.places[0] === "원문에서 판매처 확인"
          ? "판매 매장은 원문에서 확인해 주세요."
          : `${p.places[0]}${p.places.length > 1 ? ` 등 ${p.places.length}곳` : ""}에서 살 수 있어요.`,
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
    ...(p.imageUrl && { image: p.imageUrl }),
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

  // 검색·AI 답변용 질문-답변. 화면에 그대로 보이는 내용만 구조화 데이터로 내보낸다.
  const unknownPlace = p.places.length === 0 || p.places[0] === "원문에서 판매처 확인";
  const place = p.places.join(", ");
  const faq = [
    [
      `${p.nameKo}은(는) 어디서 살 수 있나요?`,
      unknownPlace
        ? "판매 매장은 발표 제목에서 확인되지 않았어요. 아래 원문 링크에서 판매처를 확인해 주세요."
        : `${REGIONS[p.region]} 기준으로 ${place}에서 판매한다고 안내돼요. 정확한 매장과 재고는 공식 발표에서 확인해 주세요.`,
    ],
    [
      "언제 나오나요? 언제까지 파나요?",
      `${p.releaseDate ? `${longDate(p.releaseDate)}에 ${p.saleStatus === "upcoming" ? "나올 예정이에요" : "나왔어요"}.` : "출시일은 발표 제목에서 확인되지 않았어요."} ${
        p.endDate ? `${longDate(p.endDate)}까지 판매해요.` : "종료일은 정해지지 않았거나 발표되지 않았어요."
      }`,
    ],
    [
      "가격은 얼마인가요?",
      offer ? `일본 현지 가격은 ${yen(offer.price)}이에요. 배송비와 세금, 대행 수수료는 포함하지 않은 값이에요.` : "가격은 아직 확인되지 않았어요. 공식 발표에서 확인해 주세요.",
    ],
    [
      "한국에서도 살 수 있나요?",
      p.krOfficial === "yes"
        ? "한국 공식 판매처가 있어요."
        : p.krOfficial === "no"
          ? "한국 공식 판매는 없어요. 일본 현지에서 사거나 일본에 가는 사람에게 부탁해야 해요."
          : "",
    ],
  ].filter(([, a]) => a) as [string, string][];
  const ld = (data: object) => <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;

  return (
    <article className="pb-28">
      <ViewTracker productId={p.id} />
      {ld(jsonLd)}
      {ld({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: categoryName(p.category), item: `${SITE_URL}/category/${p.category}` },
          { "@type": "ListItem", position: 3, name: p.nameKo, item: `${SITE_URL}/products/${p.slug}` },
        ],
      })}
      {ld({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
      })}

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

        <div className={p.imageUrl ? "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-10" : "mx-auto max-w-2xl"}>
          {/* 이미지: 출처가 제공한 사진이 있을 때만 */}
          {p.imageUrl && (
            <div className="relative lg:sticky lg:top-36">
              <ProductVisual product={p} className={`aspect-square rounded-[28px] ${ended ? "opacity-70 grayscale-[30%]" : ""}`} />
              <p className="mt-2 text-center text-[11px] text-mute">이미지 출처: {p.sources[0]?.label.replace(" 원문", "") ?? p.brand}</p>
            </div>
          )}

          <div className={p.imageUrl ? "mt-5 lg:mt-0" : ""}>
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
                    <span className="whitespace-nowrap">{longDate(p.releaseDate)}</span>
                    {p.saleStatus === "upcoming" && <span className="block text-[12px] text-coral-deep">{dday(p.releaseDate)}</span>}
                  </>
                ) : (
                  "확인 필요"
                )}
              </Fact>
              <Fact label="판매 종료일">
                {p.endDate ? (
                  <>
                    <span className="whitespace-nowrap">{longDate(p.endDate)}</span>
                    {!ended && <span className="block text-[12px] text-coral-deep">{dday(p.endDate)}</span>}
                  </>
                ) : p.limited.types.includes("quantity") ? (
                  "수량 소진 시"
                ) : (
                  "정해진 날짜 없음"
                )}
              </Fact>
              {p.krOfficial !== "unknown" && <Fact label="한국에서 살 수 있나요">{KR_OFFICIAL[p.krOfficial]}</Fact>}
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

            {/* 한정 근거: 발표에서 확인된 경우에만 */}
            {p.limited.status === "verified" && (
            <section className="mt-6 rounded-[22px] border-[1.5px] border-dashed border-pink-deep/70 bg-pink/30 p-5">
                <h2 className="font-display text-[19px] text-ink">
                  {p.limited.status === "verified" ? "왜 한정인가요" : p.limited.status === "checking" ? "한정 여부를 확인하고 있어요" : "한정 상품은 아니에요"}
                </h2>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{p.limited.evidence}</p>
              </section>
            )}

            <section className="mt-6">
              <h2 className="font-display text-[19px] text-ink">자세한 내용</h2>
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
              <h2 className="font-display text-[19px] text-ink">자주 묻는 질문</h2>
              <dl className="mt-2 divide-y divide-line rounded-2xl bg-white px-4 shadow-[var(--shadow-soft)]">
                {faq.map(([q, a]) => (
                  <div key={q} className="py-3.5">
                    <dt className="text-[14px] font-bold text-ink">{q}</dt>
                    <dd className="mt-1 text-[13px] leading-relaxed text-ink-soft">{a}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="mt-8">
              <h2 className="font-display text-[19px] text-ink">정보 출처</h2>
              <ul className="mt-2 divide-y divide-line rounded-2xl bg-white px-4 shadow-[var(--shadow-soft)]">
                {p.sources.map((s) => (
                  <li key={s.url} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3 text-[13px]">
                    <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="font-bold text-ink underline decoration-line underline-offset-4 hover:text-coral-deep">
                      {s.label} ↗
                    </a>
                    <span className="text-[11px] text-mute">
                      {SOURCE_TYPE[s.type]} · {checkedLabel(s.checkedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>

      {more.length > 0 && (
        <section className="mx-auto mt-14 max-w-6xl lg:px-4">
          <SectionTitle ja="YOU MAY ALSO LIKE" title="함께 구경하면 좋은 상품" tape="var(--color-peach)" />
          <div className="px-4 lg:px-0">
            <ProductGrid products={more} />
          </div>
        </section>
      )}

      {/* 모바일 고정 버튼 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <RequestCta product={p} prefill={prefill} className="flex-1" />
        </div>
      </div>
    </article>
  );
}
