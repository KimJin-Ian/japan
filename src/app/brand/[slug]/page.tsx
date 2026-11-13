import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoNotice, EventRow, SectionTitle } from "@/components/Bits";
import { ProductGrid } from "@/components/ProductCard";
import { brandsOf, eventsForBrand } from "@/lib/catalog";
import { getEvents, getProducts } from "@/lib/data";

// 등록되지 않은 주소는 서버에서 다 그린 뒤 보낸다(검색엔진이 완성된 HTML을 받도록).
export const instant = false;

export async function generateStaticParams() {
  return brandsOf(await getProducts()).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/brand/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const b = brandsOf(await getProducts()).find((x) => x.slug === slug);
  if (!b) return {};
  return { title: `${b.name} 일본 한정상품·일정`, description: `${b.name}의 일본 한정상품, 신상품, 팝업·발매 일정을 모았어요.`, alternates: { canonical: `/brand/${b.slug}` } };
}

/** 브랜드 허브: 그 브랜드의 상품과 일정을 한 페이지에 */
export default async function BrandPage({ params }: PageProps<"/brand/[slug]">) {
  const { slug } = await params;
  const [all, allEvents] = await Promise.all([getProducts(), getEvents()]);
  const b = brandsOf(all).find((x) => x.slug === slug);
  if (!b) notFound();
  const products = all.filter((p) => p.brandSlug === b.slug);
  const events = eventsForBrand(allEvents, b.slug);
  return (
    <div className="mx-auto max-w-6xl pb-6 pt-6">
      <div className="px-4">
        <p className="font-maru text-[11px] font-bold tracking-[0.18em] text-coral-deep">BRAND</p>
        <h1 className="mt-1 font-display text-[28px] text-ink lg:text-[34px]">
          <span className="tape" style={{ ["--tape" as string]: "var(--color-mint)" }}>
            {b.name}
          </span>
        </h1>
        <p className="mt-1.5 text-[13px] text-ink-soft">
          상품 {products.length}개 · 일정 {events.length}건
        </p>
        <DemoNotice className="my-4" />
      </div>

      {events.length > 0 && (
        <section className="mt-6">
          <SectionTitle ja="SCHEDULE" title="일정 · 소식" tape="var(--color-mint)" />
          <ul className="grid gap-3 px-4 md:grid-cols-2">
            {events.map((e) => (
              <li key={e.id}>
                <EventRow event={e} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <SectionTitle ja="ITEMS" title="상품" tape="var(--color-pink)" />
        <div className="px-4">
          <ProductGrid products={products} />
        </div>
      </section>
    </div>
  );
}
