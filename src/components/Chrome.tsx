"use client";
// 사이트 공통 틀: 상단 헤더 · 모바일 하단 탭바
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/taxonomy";
import { SavedCount } from "./SaveButton";

const I = {
  home: "M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z",
  search: "M10.5 4a6.5 6.5 0 1 0 4.1 11.6L19.5 20.5 21 19l-4.9-4.9A6.5 6.5 0 0 0 10.5 4zm0 2.2a4.3 4.3 0 1 1 0 8.6 4.3 4.3 0 0 1 0-8.6z",
  cal: "M7 3v2H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2V3h-2v2H9V3zm-1 7h12v8H6zm2.5 2v2h2v-2z",
  yen: "M7 4l5 7 5-7h2.4l-5 7H18v2h-5v1.5h5v2h-5V20h-2v-3.5H6v-2h5V13H6v-2h3.6l-5-7z",
  shop: "M4 4h16l1.5 5.5a3 3 0 0 1-2.5 3.4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.1a3 3 0 0 1-2.5-3.4zm3 9.5V19h4v-4h2v4h4v-5.5a3 3 0 0 1-2.5-1.3 3 3 0 0 1-5 0A3 3 0 0 1 7 13.5z",
  heart: "M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z",
};

const Icon = ({ d, size = 22 }: { d: string; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
    <path d={d} />
  </svg>
);

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-1.5" aria-label="JAPAN FINDS 홈">
      <svg viewBox="0 0 64 64" className="h-8 w-8 -rotate-6 drop-shadow-[0_2px_0_#c9483a]" aria-hidden>
        <rect width="64" height="64" rx="15" fill="#f0705f" />
        <circle cx="45" cy="17.5" r="9.5" fill="#fff0b8" />
        <path d="M5.8 51.2 23.8 25.6h10l18 25.6z" fill="#fff" />
        <rect x="6.4" y="50" width="47.4" height="3.8" rx="1.9" fill="#fff" />
      </svg>
      <span className="font-maru text-[17px] font-black tracking-tight text-ink">
        JAPAN <span className="text-coral-deep">FINDS</span>
      </span>
    </Link>
  );
}

export function SearchBox({ defaultValue = "", big = false }: { defaultValue?: string; big?: boolean }) {
  return (
    <form action="/products" role="search" className="relative w-full">
      <label className="sr-only" htmlFor={big ? "q-big" : "q"}>
        상품 검색
      </label>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-coral">
        <Icon d={I.search} size={big ? 22 : 18} />
      </span>
      <input
        id={big ? "q-big" : "q"}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="어떤 일본 상품을 찾고 있나요?"
        className={`w-full rounded-full border-[1.5px] border-line bg-white pr-4 text-ink placeholder:text-mute focus:border-coral focus:outline-none ${
          big ? "h-14 pl-12 text-[16px] shadow-[var(--shadow-soft)]" : "h-11 pl-11 text-[15px]"
        }`}
      />
    </form>
  );
}

export function Header() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 lg:h-16">
        <Logo />
        <div className="hidden flex-1 px-4 md:block">
          <SearchBox />
        </div>
        <nav className="ml-auto hidden items-center gap-1 text-[14px] font-bold text-ink-soft lg:flex">
          <Link href="/products" className="rounded-full px-3 py-2 hover:bg-cream-deep">
            소식
          </Link>
          <Link href="/popup" className="rounded-full px-3 py-2 hover:bg-cream-deep">
            팝업
          </Link>
          <Link href="/collab" className="rounded-full px-3 py-2 hover:bg-cream-deep">
            콜라보
          </Link>
          <Link href="/schedule" className="rounded-full px-3 py-2 hover:bg-cream-deep">
            캘린더
          </Link>
          <Link href="/brands" className="rounded-full px-3 py-2 hover:bg-cream-deep">
            브랜드
          </Link>
          <Link href="/news" className="rounded-full px-3 py-2 hover:bg-cream-deep">
            뉴스
          </Link>
        </nav>
        <Link href="/products" aria-label="검색" className="ml-auto grid h-11 w-11 place-items-center rounded-full text-ink-soft md:hidden">
          <Icon d={I.search} />
        </Link>
        <Link href="/saved" aria-label="관심 상품" className="relative grid h-11 w-11 place-items-center rounded-full text-ink-soft hover:bg-cream-deep">
          <Icon d={I.heart} />
          <SavedCount />
        </Link>
      </div>
      <nav aria-label="카테고리" className="mx-auto hidden max-w-6xl px-4 pb-2 lg:block">
        <ul className="chips text-[13px] font-bold text-ink-soft">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link href={`/category/${c.slug}`} className="block whitespace-nowrap rounded-full px-3 py-1.5 hover:bg-white hover:text-coral-deep">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

const TABS = [
  { href: "/", label: "홈", d: I.home, match: (p: string) => p === "/" },
  { href: "/products", label: "소식", d: I.search, match: (p: string) => ["/products", "/category", "/brand", "/collab", "/news"].some((x) => p.startsWith(x)) },
  { href: "/schedule", label: "캘린더", d: I.cal, match: (p: string) => p.startsWith("/schedule") },
  { href: "/popup", label: "팝업", d: I.shop, match: (p: string) => p.startsWith("/popup") },
  { href: "/saved", label: "관심", d: I.heart, match: (p: string) => p.startsWith("/saved") },
];

export function TabBar() {
  const pathname = usePathname();
  // 상품 상세는 탭바 대신 고정 구매 부탁 버튼을 쓴다
  if (pathname.startsWith("/admin") || /^\/products\/.+/.test(pathname)) return null;
  return (
    <nav aria-label="주요 메뉴" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map((t) => {
          const on = t.match(pathname);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={`flex h-[58px] flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${on ? "text-coral-deep" : "text-mute"}`}
              >
                <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${on ? "bg-pink" : ""}`}>
                  <Icon d={t.d} size={20} />
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
