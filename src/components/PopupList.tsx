"use client";
import { useState } from "react";
import { REGIONS } from "@/lib/taxonomy";
import type { Product, RegionSlug } from "@/lib/types";
import { ProductGrid } from "./ProductCard";

type Phase = "open" | "soon" | "ended";
const PHASES: { key: Phase; label: string }[] = [
  { key: "open", label: "열리는 중" },
  { key: "soon", label: "곧 열림" },
  { key: "ended", label: "종료" },
];
const phaseOf = (p: Product): Phase => (p.saleStatus === "upcoming" ? "soon" : p.saleStatus === "ended" ? "ended" : "open");

/** 팝업스토어 목록: 진행 상태와 지역으로 고른다 */
export function PopupList({ products }: { products: Product[] }) {
  const [phase, setPhase] = useState<Phase>("open");
  const [region, setRegion] = useState<RegionSlug | "">("");
  const regions = [...new Set(products.map((p) => p.region))] as RegionSlug[];
  const count = (ph: Phase) => products.filter((p) => phaseOf(p) === ph).length;
  const shown = products
    .filter((p) => phaseOf(p) === phase && (!region || p.region === region))
    .sort((a, b) => (phase === "soon" ? (a.releaseDate ?? "9").localeCompare(b.releaseDate ?? "9") : (a.endDate ?? "9").localeCompare(b.endDate ?? "9")));

  const tab = (on: boolean) => `btn min-h-10 whitespace-nowrap border-[1.5px] px-4 text-[13px] ${on ? "border-coral bg-coral text-white" : "border-line bg-white text-ink-soft"}`;
  const chip = (on: boolean) => `sticker min-h-8 px-3 ${on ? "bg-ink text-white" : "bg-white text-ink-soft"}`;

  return (
    <div>
      <div className="chips" role="tablist" aria-label="진행 상태">
        {PHASES.map((p) => (
          <button key={p.key} type="button" role="tab" aria-selected={phase === p.key} onClick={() => setPhase(p.key)} className={tab(phase === p.key)}>
            {p.label} {count(p.key)}
          </button>
        ))}
      </div>
      <div className="chips mt-2.5">
        <button type="button" aria-pressed={!region} onClick={() => setRegion("")} className={chip(!region)}>
          모든 지역
        </button>
        {regions.map((r) => (
          <button key={r} type="button" aria-pressed={region === r} onClick={() => setRegion(region === r ? "" : r)} className={chip(region === r)}>
            {REGIONS[r]}
          </button>
        ))}
      </div>
      <div className="mt-5">
        {shown.length > 0 ? <ProductGrid products={shown} /> : <p className="card dots px-6 py-12 text-center text-[14px] text-ink-soft">이 조건에 해당하는 팝업이 없어요.</p>}
      </div>
    </div>
  );
}
