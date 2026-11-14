import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Explorer } from "@/components/Explorer";
import { brandsOf } from "@/lib/catalog";
import { getProducts } from "@/lib/data";
import { CATEGORIES } from "@/lib/taxonomy";

// 등록되지 않은 주소는 서버에서 다 그린 뒤 보낸다(검색엔진이 완성된 HTML을 받도록).
export const instant = false;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = CATEGORIES.find((x) => x.slug === slug);
  if (!c) return {};
  return { title: `일본 ${c.name}`, description: `${c.desc}. 한정 여부와 일본 현지 가격, 판매처를 함께 확인하세요.`, alternates: { canonical: `/category/${c.slug}` } };
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const c = CATEGORIES.find((x) => x.slug === slug);
  if (!c) notFound();
  const products = (await getProducts()).filter((p) => p.category === c.slug);
  return (
    <div className="pb-6 pt-6">
      <div className="mx-auto max-w-6xl px-4">
        <p className="font-maru text-[11px] font-bold tracking-[0.18em] text-coral-deep">CATEGORY</p>
        <h1 className="mt-1 font-display text-[28px] text-ink lg:text-[34px]">
          <span className="tape" style={{ ["--tape" as string]: "var(--color-pink)" }}>
            {c.name}
          </span>
        </h1>
        <p className="mt-1.5 text-[13px] text-ink-soft">{c.desc}</p>
      </div>
      <Suspense fallback={<p className="px-4 py-10 text-center text-[13px] text-mute">상품을 불러오는 중…</p>}>
        <Explorer products={products} fixedCategory={c.slug} brands={brandsOf(products)} />
      </Suspense>
    </div>
  );
}
