import type { Metadata } from "next";
import { PopupList } from "@/components/PopupList";
import { getProducts } from "@/lib/data";

export const metadata: Metadata = {
  title: "일본 팝업스토어 일정",
  description: "도쿄·오사카 등 일본에서 지금 열리는 팝업스토어와 곧 열리는 팝업을 지역별로 모았어요. 기간과 장소, 한정 상품 소식을 확인하세요.",
  keywords: ["일본 팝업스토어", "도쿄 팝업스토어", "오사카 팝업스토어", "일본 팝업 일정", "시부야 파르코 팝업", "일본 캐릭터 팝업"],
  alternates: { canonical: "/popup" },
};

export default async function PopupPage() {
  const products = (await getProducts()).filter((p) => p.category === "popup");
  return (
    <div className="mx-auto max-w-6xl px-4 pb-6 pt-6">
      <p className="font-maru text-[11px] font-bold tracking-[0.18em] text-coral-deep">POP UP STORE</p>
      <h1 className="mt-1 font-display text-[28px] text-ink lg:text-[34px]">
        <span className="tape" style={{ ["--tape" as string]: "var(--color-mint)" }}>
          일본 팝업스토어
        </span>
      </h1>
      <p className="mt-1.5 text-[13px] text-ink-soft">기간이 끝나면 살 수 없는 것들이에요. 여행 날짜와 겹치는 팝업을 찾아보세요.</p>
      <PopupList products={products} />
    </div>
  );
}
