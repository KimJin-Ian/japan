import type { Metadata } from "next";
import Link from "next/link";
import { brandsOf } from "@/lib/catalog";
import { getProducts } from "@/lib/data";

export const metadata: Metadata = {
  title: "브랜드별 일본 소식",
  description: "브랜드와 캐릭터별로 일본 한정 상품, 콜라보, 팝업스토어 소식을 모아 볼 수 있어요.",
  alternates: { canonical: "/brands" },
};

export default async function BrandsPage() {
  const brands = brandsOf(await getProducts()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ko"));
  const many = brands.filter((b) => b.count >= 2);
  const single = brands.filter((b) => b.count < 2);
  const tones = ["bg-pink", "bg-butter", "bg-mint", "bg-sky", "bg-lilac", "bg-peach"];
  return (
    <div className="mx-auto max-w-6xl px-4 pb-6 pt-6">
      <p className="font-maru text-[11px] font-bold tracking-[0.18em] text-coral-deep">BRANDS</p>
      <h1 className="mt-1 font-display text-[28px] text-ink lg:text-[34px]">
        <span className="tape" style={{ ["--tape" as string]: "var(--color-butter)" }}>
          브랜드별로 보기
        </span>
      </h1>
      <p className="mt-1.5 text-[13px] text-ink-soft">소식이 올라온 브랜드 {brands.length}곳이에요.</p>

      {many.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-display text-[20px] text-ink">소식이 많은 브랜드</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {many.map((b, i) => (
              <li key={b.slug}>
                <Link href={`/brand/${b.slug}`} className="card flex h-full items-center gap-3 p-3.5">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-display text-[18px] text-ink ${tones[i % tones.length]}`} aria-hidden>
                    {b.name.trim().charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-[14px] font-bold leading-snug text-ink">{b.name}</span>
                    <span className="text-[12px] text-mute">소식 {b.count}건</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {single.length > 0 && (
        <section className="mt-9">
          <h2 className="mb-3 font-display text-[20px] text-ink">그 밖의 브랜드</h2>
          <ul className="flex flex-wrap gap-2">
            {single.map((b) => (
              <li key={b.slug}>
                <Link href={`/brand/${b.slug}`} className="block rounded-full border-[1.5px] border-line bg-white px-3.5 py-1.5 text-[13px] font-bold text-ink-soft hover:border-pink-deep hover:text-coral-deep">
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {brands.length === 0 && <p className="card dots mt-6 px-6 py-12 text-center text-[14px] text-ink-soft">아직 올라온 브랜드가 없어요.</p>}
    </div>
  );
}
