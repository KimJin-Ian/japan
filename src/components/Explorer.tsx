"use client";
// 상품 목록: 검색 · 필터 · 정렬. 상태는 모두 URL 쿼리에 둔다(공유·뒤로 가기 가능).
// 데모에서는 브라우저에서 거르고, 운영에서는 같은 쿼리를 서버(Supabase)로 넘긴다.
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, LIMITED, PRICE_BANDS, REGIONS, categoryName } from "@/lib/taxonomy";
import type { CategorySlug, LimitedType, Product, RegionSlug } from "@/lib/types";
import { ProductGrid } from "./ProductCard";

const SORTS = [
  { key: "new", label: "최근 등록순" },
  { key: "release", label: "출시일순" },
  { key: "price_asc", label: "가격 낮은순" },
  { key: "price_desc", label: "가격 높은순" },
] as const;
// 인기순은 실제 조회·저장 데이터가 쌓인 뒤에 추가한다. 지금은 보여 주지 않는다.

const jpPrice = (p: Product) => p.offers.find((o) => o.country === "JP")?.price;

const haystack = (p: Product) =>
  [p.nameKo, p.nameJa, p.brand, p.character ?? "", categoryName(p.category), REGIONS[p.region], ...p.tags, ...p.limited.types.map((t) => `${LIMITED[t].ko} ${LIMITED[t].ja}`)]
    .join(" ")
    .toLowerCase();

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`btn min-h-9 whitespace-nowrap border-[1.5px] px-3.5 py-1.5 text-[13px] ${
        on ? "border-coral bg-coral text-white" : "border-line bg-white text-ink-soft hover:border-pink-deep"
      }`}
    >
      {children}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-line py-4 first:border-t-0 first:pt-0">
      <legend className="mb-2.5 float-left w-full text-[13px] font-bold text-ink">{title}</legend>
      <div className="clear-both flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

export function Explorer({ products, fixedCategory, brands }: { products: Product[]; fixedCategory?: CategorySlug; brands: { slug: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [sheet, setSheet] = useState(false);

  const q = sp.get("q") ?? "";
  const category = fixedCategory ?? sp.get("category") ?? "";
  const limited = (sp.get("limited") ?? "").split(",").filter(Boolean);
  const region = sp.get("region") ?? "";
  const brand = sp.get("brand") ?? "";
  const kr = sp.get("kr") ?? "";
  const price = sp.get("price") ?? "";
  const status = sp.get("status") ?? "";
  const sort = sp.get("sort") ?? "new";

  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const s = next.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };
  const toggle = (key: string, cur: string, v: string) => set({ [key]: cur === v ? "" : v });
  const toggleLimited = (v: string) => set({ limited: (limited.includes(v) ? limited.filter((x) => x !== v) : [...limited, v]).join(",") });

  useEffect(() => {
    document.body.style.overflow = sheet ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheet]);

  const result = useMemo(() => {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    const band = PRICE_BANDS.find((b) => b.key === price);
    const list = products.filter((p) => {
      if (tokens.length && !tokens.every((t) => haystack(p).includes(t))) return false;
      if (category && p.category !== category) return false;
      if (limited.includes("checking") && p.limited.status !== "checking") return false;
      const types = limited.filter((l) => l !== "checking") as LimitedType[];
      if (types.length && !types.every((t) => p.limited.status === "verified" && p.limited.types.includes(t))) return false;
      if (region && p.region !== region) return false;
      if (brand && p.brandSlug !== brand) return false;
      if (kr && p.krOfficial !== kr) return false;
      if (status ? p.saleStatus !== status : false) return false;
      if (band) {
        const jp = jpPrice(p);
        if (jp === undefined || jp < band.min || jp > band.max) return false;
      }
      return true;
    });
    const priceOf = (p: Product, missing: number) => jpPrice(p) ?? missing;
    return list.sort((a, b) => {
      // 판매 종료 상품은 항상 뒤로
      if ((a.saleStatus === "ended") !== (b.saleStatus === "ended")) return a.saleStatus === "ended" ? 1 : -1;
      if (sort === "release") return (b.releaseDate ?? "").localeCompare(a.releaseDate ?? "");
      if (sort === "price_asc") return priceOf(a, Infinity) - priceOf(b, Infinity);
      if (sort === "price_desc") return priceOf(b, -1) - priceOf(a, -1);
      return b.addedAt.localeCompare(a.addedAt);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, sp, fixedCategory]);

  const activeCount = [limited.length > 0, region, brand, kr, price, status].filter(Boolean).length;
  const reset = () => router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false });

  const panel = (
    <>
      <Group title="한정 유형">
        {(Object.keys(LIMITED) as LimitedType[]).map((t) => (
          <Chip key={t} on={limited.includes(t)} onClick={() => toggleLimited(t)}>
            {LIMITED[t].ko}
          </Chip>
        ))}
        <Chip on={limited.includes("checking")} onClick={() => toggleLimited("checking")}>
          확인 중
        </Chip>
      </Group>
      <Group title="판매 상태">
        <Chip on={status === "on_sale"} onClick={() => toggle("status", status, "on_sale")}>
          판매 중
        </Chip>
        <Chip on={status === "upcoming"} onClick={() => toggle("status", status, "upcoming")}>
          곧 출시
        </Chip>
        <Chip on={status === "ended"} onClick={() => toggle("status", status, "ended")}>
          판매 종료
        </Chip>
      </Group>
      <Group title="일본 지역">
        {(Object.keys(REGIONS) as RegionSlug[]).map((r) => (
          <Chip key={r} on={region === r} onClick={() => toggle("region", region, r)}>
            {REGIONS[r]}
          </Chip>
        ))}
      </Group>
      <Group title="한국 공식 판매">
        <Chip on={kr === "no"} onClick={() => toggle("kr", kr, "no")}>
          한국 미출시
        </Chip>
        <Chip on={kr === "yes"} onClick={() => toggle("kr", kr, "yes")}>
          한국 판매 있음
        </Chip>
        <Chip on={kr === "unknown"} onClick={() => toggle("kr", kr, "unknown")}>
          확인 중
        </Chip>
      </Group>
      <Group title="일본 가격대">
        {PRICE_BANDS.map((b) => (
          <Chip key={b.key} on={price === b.key} onClick={() => toggle("price", price, b.key)}>
            {b.label}
          </Chip>
        ))}
      </Group>
      <Group title="브랜드">
        {brands.map((b) => (
          <Chip key={b.slug} on={brand === b.slug} onClick={() => toggle("brand", brand, b.slug)}>
            {b.name}
          </Chip>
        ))}
      </Group>
    </>
  );

  return (
    <div className="mx-auto max-w-6xl px-4">
      {!fixedCategory && (
        <div className="chips -mx-4 px-4 pb-3">
          <Chip on={!category} onClick={() => set({ category: "" })}>
            전체
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c.slug} on={category === c.slug} onClick={() => toggle("category", category, c.slug)}>
              {c.short}
            </Chip>
          ))}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[232px_1fr] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="card sticky top-32 p-5">{panel}</div>
        </aside>

        <div>
          <div className="mb-4 flex items-center gap-2">
            <p className="mr-auto text-[13px] text-ink-soft" aria-live="polite">
              {q && <b className="text-ink">‘{q}’ </b>}
              상품 <b className="text-coral-deep">{result.length}</b>개
            </p>
            <button type="button" onClick={() => setSheet(true)} className="btn btn-secondary h-10 px-3.5 text-[13px] lg:hidden">
              필터{activeCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-[11px] text-white">{activeCount}</span>}
            </button>
            <label className="sr-only" htmlFor="sort">
              정렬
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => set({ sort: e.target.value === "new" ? "" : e.target.value })}
              className="h-10 rounded-full border-[1.5px] border-line bg-white px-3 text-[13px] font-bold text-ink-soft"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {result.length > 0 ? (
            <div className="[&_ul]:xl:grid-cols-4">
              <ProductGrid products={result} />
            </div>
          ) : (
            <div className="card dots px-6 py-14 text-center">
              <p className="font-display text-[22px] text-ink">조건에 맞는 상품이 아직 없어요</p>
              <p className="mx-auto mt-2 max-w-xs text-[13px] text-ink-soft">필터를 줄이거나 다른 말로 찾아보세요. 일본어 상품명으로도 찾을 수 있어요.</p>
              <button type="button" onClick={reset} className="btn btn-primary mt-5 h-11 px-5 text-[14px]">
                필터 지우기
              </button>
            </div>
          )}
        </div>
      </div>

      {sheet && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="필터">
          <button type="button" aria-label="필터 닫기" className="absolute inset-0 bg-ink/40" onClick={() => setSheet(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[84dvh] flex-col rounded-t-[28px] bg-cream">
            <div className="flex items-center justify-between px-5 pb-2 pt-4">
              <h2 className="font-display text-[20px]">필터</h2>
              <button type="button" onClick={reset} className="text-[13px] font-bold text-ink-soft underline underline-offset-4">
                모두 지우기
              </button>
            </div>
            <div className="overflow-y-auto px-5 pb-4">{panel}</div>
            <div className="border-t border-line bg-white px-5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
              <button type="button" onClick={() => setSheet(false)} className="btn btn-primary h-12 w-full text-[15px]">
                상품 {result.length}개 보기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
