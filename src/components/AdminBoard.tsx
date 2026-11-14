"use client";
// 관리자 대시보드. DB가 연결돼 있으면(live) 검수 상태와 판매 상태를 Supabase에 저장한다.
// 연결이 없으면 예시 데이터로 화면만 보여 주고 저장하지 않는다.
import { useState, useTransition } from "react";
import { checkedLabel } from "@/lib/format";
import { LIMITED, SALE_STATUS, categoryName } from "@/lib/taxonomy";
import type { AiField, Candidate, CollectionLog, LimitedType, Product, ReviewStatus, SaleStatus } from "@/lib/types";

const CONF_MIN = 0.6;
const STATUS: Record<ReviewStatus, { label: string; cls: string }> = {
  pending: { label: "검수 대기", cls: "bg-butter text-[#7a5c0a]" },
  approved: { label: "게시 승인", cls: "bg-mint text-mint-deep" },
  rejected: { label: "반려", cls: "bg-cream-deep text-ink-soft" },
  merged: { label: "기존 상품에 병합", cls: "bg-sky text-[#2f5f93]" },
};
const RIGHTS = { unchecked: "사용권 미확인", press_ok: "보도자료 이미지 사용 가능", not_allowed: "이미지 사용 불가" } as const;

function Conf({ f }: { f: AiField<unknown> }) {
  if (f.value === null || f.confidence < CONF_MIN) return <span className="sticker border border-dashed border-coral/60 bg-white text-coral-deep">확인 필요</span>;
  return <span className="text-[11px] font-bold text-mint-deep">{Math.round(f.confidence * 100)}%</span>;
}

function FieldRow({ label, f, children }: { label: string; f: AiField<unknown>; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="w-[76px] shrink-0 pt-2 text-[12px] font-bold text-mute">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
      <span className="shrink-0 pt-2">
        <Conf f={f} />
      </span>
    </div>
  );
}

const inputCls = "h-9 w-full rounded-xl border-[1.5px] border-line bg-white px-3 text-[14px] text-ink focus:border-coral focus:outline-none";

function CandidateCard({ c, products, onDecide }: { c: Candidate; products: Product[]; onDecide: (id: string, s: ReviewStatus) => void }) {
  const [name, setName] = useState(c.ai.nameKo.value ?? "");
  const [price, setPrice] = useState(c.ai.priceJpy.value?.toString() ?? "");
  const [sourceOk, setSourceOk] = useState(false);
  const [rights, setRights] = useState(c.imageRights);
  const dup = products.find((p) => p.id === c.duplicateOf);
  const pending = c.reviewStatus === "pending";
  const useful = c.ai.usefulForKr.value;

  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`sticker ${STATUS[c.reviewStatus].cls}`}>{STATUS[c.reviewStatus].label}</span>
        {useful === false && <span className="sticker bg-ink/75 text-white">AI: 한국 사용자와 관련 낮음</span>}
        <span className="ml-auto text-[11px] text-mute">
          {c.sourceName} · {checkedLabel(c.collectedAt).replace("확인", "수집")}
        </span>
      </div>
      <p className="mt-3 font-maru text-[14px] font-bold leading-snug text-ink" lang="ja">
        {c.rawTitleJa}
      </p>
      <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-block text-[12px] font-bold text-coral-deep underline underline-offset-4">
        원문 열기 ↗
      </a>

      {dup && (
        <div className="mt-3 rounded-2xl bg-sky/60 p-3 text-[13px] text-ink">
          <b>중복 의심:</b> 이미 게시된 ‘{dup.nameKo}’와 같은 상품일 수 있어요.
        </div>
      )}

      <div className="mt-3 divide-y divide-line border-y border-line">
        <FieldRow label="한국어 이름" f={c.ai.nameKo}>
          <input aria-label="한국어 상품명" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} disabled={!pending} />
        </FieldRow>
        <FieldRow label="요약" f={c.ai.summaryKo}>
          <p className="pt-1.5 text-[13px] leading-relaxed text-ink-soft">{c.ai.summaryKo.value ?? "—"}</p>
        </FieldRow>
        <FieldRow label="브랜드" f={c.ai.brand}>
          <p className="pt-1.5 text-[14px] text-ink">{c.ai.brand.value ?? "—"}</p>
        </FieldRow>
        <FieldRow label="카테고리" f={c.ai.category}>
          <p className="pt-1.5 text-[14px] text-ink">{c.ai.category.value ? categoryName(c.ai.category.value) : "—"}</p>
        </FieldRow>
        <FieldRow label="한정 유형" f={c.ai.limitedTypes}>
          <p className="pt-1.5 text-[14px] text-ink">
            {c.ai.limitedTypes.value === null ? "—" : c.ai.limitedTypes.value.length ? c.ai.limitedTypes.value.map((t: LimitedType) => LIMITED[t].ko).join(" · ") : "한정 표기 없음"}
          </p>
        </FieldRow>
        <FieldRow label="출시일" f={c.ai.releaseDate}>
          <p className="pt-1.5 text-[14px] text-ink">{c.ai.releaseDate.value ?? "—"}</p>
        </FieldRow>
        <FieldRow label="판매 장소" f={c.ai.places}>
          <p className="pt-1.5 text-[14px] text-ink">{c.ai.places.value ?? "—"}</p>
        </FieldRow>
        <FieldRow label="일본 가격" f={c.ai.priceJpy}>
          <div className="flex items-center gap-2">
            <input aria-label="일본 가격(엔)" inputMode="numeric" className={`${inputCls} max-w-[140px]`} value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} placeholder="미확인" disabled={!pending} />
            <span className="text-[13px] text-ink-soft">엔</span>
          </div>
        </FieldRow>
      </div>

      <div className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
        <label className="flex min-h-11 items-center gap-2 rounded-xl bg-cream px-3">
          <input type="checkbox" className="h-4 w-4 accent-[#e76d72]" checked={sourceOk} onChange={(e) => setSourceOk(e.target.checked)} disabled={!pending} />
          공식 출처를 직접 열어 확인했어요
        </label>
        <label className="flex min-h-11 items-center gap-2 rounded-xl bg-cream px-3">
          <span className="shrink-0 text-ink-soft">이미지</span>
          <select aria-label="이미지 사용권" className="min-w-0 flex-1 bg-transparent font-bold text-ink" value={rights} onChange={(e) => setRights(e.target.value as Candidate["imageRights"])} disabled={!pending}>
            {Object.entries(RIGHTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>

      {pending ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={!sourceOk || !name} onClick={() => onDecide(c.id, "approved")} className="btn btn-primary h-11 px-5 text-[14px] disabled:cursor-not-allowed disabled:opacity-40">
            게시 승인
          </button>
          {dup && (
            <button type="button" onClick={() => onDecide(c.id, "merged")} className="btn btn-secondary h-11 px-4 text-[14px]">
              기존 상품에 병합
            </button>
          )}
          <button type="button" onClick={() => onDecide(c.id, "rejected")} className="btn btn-secondary h-11 px-4 text-[14px]">
            반려
          </button>
          {!sourceOk && <p className="w-full text-[12px] text-mute">출처 확인에 체크해야 승인할 수 있어요.</p>}
        </div>
      ) : (
        <button type="button" onClick={() => onDecide(c.id, "pending")} className="mt-4 text-[13px] font-bold text-ink-soft underline underline-offset-4">
          검수 대기로 되돌리기
        </button>
      )}
    </article>
  );
}

type Tab = "candidates" | "products" | "logs";

export function AdminBoard({
  candidates,
  products,
  logs,
  live,
  decideAction,
  saleAction,
}: {
  candidates: Candidate[];
  products: Product[];
  logs: CollectionLog[];
  live: boolean;
  decideAction: (id: string, s: ReviewStatus) => Promise<void>;
  saleAction: (id: string, s: SaleStatus) => Promise<void>;
}) {
  const [, startTransition] = useTransition();
  const [saveError, setSaveError] = useState("");
  const [tab, setTab] = useState<Tab>("candidates");
  const [cands, setCands] = useState(candidates);
  const [filter, setFilter] = useState<ReviewStatus | "all">("pending");
  const [sale, setSale] = useState<Record<string, SaleStatus>>(() => Object.fromEntries(products.map((p) => [p.id, p.saleStatus])));

  const save = (run: () => Promise<void>, undo: () => void) => {
    if (!live) return;
    setSaveError("");
    startTransition(async () => {
      try {
        await run();
      } catch (e) {
        undo();
        setSaveError(`저장하지 못했어요: ${e instanceof Error ? e.message : "알 수 없는 오류"}`);
      }
    });
  };
  const decide = (id: string, s: ReviewStatus) => {
    const prev = cands;
    setCands((cs) => cs.map((c) => (c.id === id ? { ...c, reviewStatus: s } : c)));
    save(() => decideAction(id, s), () => setCands(prev));
  };
  const changeSale = (id: string, s: SaleStatus) => {
    const prev = sale;
    setSale((x) => ({ ...x, [id]: s }));
    save(() => saleAction(id, s), () => setSale(prev));
  };
  const count = (s: ReviewStatus) => cands.filter((c) => c.reviewStatus === s).length;
  const shown = cands.filter((c) => filter === "all" || c.reviewStatus === filter);
  const lastOk = logs.find((l) => l.ok);
  const failed = logs.filter((l) => !l.ok).length;

  const tabCls = (on: boolean) => `btn h-10 whitespace-nowrap px-4 text-[14px] ${on ? "bg-ink text-white" : "bg-white text-ink-soft"}`;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-display text-[26px] text-ink">JAPAN FINDS 관리자</h1>
        <span className={`sticker ${live ? "bg-mint text-mint-deep" : "bg-ink text-white"}`}>{live ? "Supabase 연결됨" : "DB 미연결 · 저장되지 않음"}</span>
      </div>
      <p className="mt-1 text-[13px] text-ink-soft">AI가 정리한 후보는 여기서 승인해야만 사용자 화면에 나가요.</p>
      {saveError && (
        <p role="alert" className="mt-3 rounded-2xl bg-coral px-4 py-3 text-[13px] font-bold text-white">
          {saveError}
        </p>
      )}

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["검수 대기", `${count("pending")}건`],
          ["게시 중인 상품", `${products.length}개`],
          ["마지막 수집 성공", lastOk ? checkedLabel(lastOk.startedAt).replace(" 확인", "") : "—"],
          ["최근 수집 실패", `${failed}건`],
        ].map(([k, v]) => (
          <div key={k} className="card p-4">
            <dt className="text-[11px] font-bold text-mute">{k}</dt>
            <dd className="mt-1 font-display text-[22px] leading-tight text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="chips mt-6" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "candidates"} className={tabCls(tab === "candidates")} onClick={() => setTab("candidates")}>
          수집 후보 검수
        </button>
        <button type="button" role="tab" aria-selected={tab === "products"} className={tabCls(tab === "products")} onClick={() => setTab("products")}>
          게시 상품
        </button>
        <button type="button" role="tab" aria-selected={tab === "logs"} className={tabCls(tab === "logs")} onClick={() => setTab("logs")}>
          수집 실행 내역
        </button>
      </div>

      {tab === "candidates" && (
        <div className="mt-4">
          <div className="chips mb-4">
            {(["pending", "approved", "merged", "rejected", "all"] as const).map((s) => (
              <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)} className={`sticker min-h-8 px-3 ${filter === s ? "bg-coral text-white" : "bg-white text-ink-soft"}`}>
                {s === "all" ? `전체 ${cands.length}` : `${STATUS[s].label} ${count(s)}`}
              </button>
            ))}
          </div>
          {shown.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {shown.map((c) => (
                <CandidateCard key={c.id} c={c} products={products} onDecide={decide} />
              ))}
            </div>
          ) : (
            <p className="card px-6 py-12 text-center text-[14px] text-ink-soft">이 상태의 후보가 없어요.</p>
          )}
        </div>
      )}

      {tab === "products" && (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="border-b border-line text-[11px] text-mute">
              <tr>
                <th className="px-4 py-3 font-bold">상품</th>
                <th className="px-2 py-3 font-bold">한정</th>
                <th className="px-2 py-3 font-bold">출처</th>
                <th className="px-2 py-3 font-bold">가격 확인</th>
                <th className="px-4 py-3 font-bold">판매 상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => {
                const jp = p.offers.find((o) => o.country === "JP");
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <p className="font-bold text-ink">{p.nameKo}</p>
                      <p className="text-[11px] text-mute">
                        {p.id} · {p.brand}
                      </p>
                    </td>
                    <td className="px-2 py-3 text-ink-soft">{p.limited.status === "verified" ? "근거 확인" : p.limited.status === "checking" ? "확인 중" : "상시"}</td>
                    <td className="px-2 py-3 text-ink-soft">{p.sources.every((s) => s.verified) ? "검증됨" : "검증 대기"}</td>
                    <td className="px-2 py-3 text-ink-soft">{jp ? checkedLabel(jp.checkedAt).replace(" 확인", "") : "가격 없음"}</td>
                    <td className="px-4 py-3">
                      <select aria-label={`${p.nameKo} 판매 상태`} value={sale[p.id]} onChange={(e) => changeSale(p.id, e.target.value as SaleStatus)} className="h-9 rounded-xl border-[1.5px] border-line bg-white px-2 font-bold text-ink">
                        {(Object.keys(SALE_STATUS) as SaleStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {SALE_STATUS[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "logs" && (
        <ul className="mt-4 space-y-2.5">
          {logs.map((l) => (
            <li key={l.id} className="card flex flex-wrap items-center gap-x-4 gap-y-1 p-4 text-[13px]">
              <span className={`sticker ${l.ok ? "bg-mint text-mint-deep" : "bg-coral text-white"}`}>{l.ok ? "성공" : "실패"}</span>
              <span className="font-bold text-ink">{l.target}</span>
              <span className="text-mute">{l.method}</span>
              <span className="ml-auto text-[12px] text-mute">{checkedLabel(l.startedAt).replace(" 확인", "")}</span>
              <p className="w-full text-[12px] text-ink-soft">
                확인 {l.found}건 · 새 후보 {l.added}건 · 재시도 {l.retries}회
                {l.error && <span className="ml-2 font-bold text-coral-deep">{l.error}</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
