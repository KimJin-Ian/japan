import type { Metadata } from "next";
import { DemoNotice, EventRow } from "@/components/Bits";
import { DateRow } from "@/components/DateRow";
import { liveEvents } from "@/lib/catalog";
import { getEvents, getProducts } from "@/lib/data";
import { daysUntil } from "@/lib/format";
import type { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "일본 발매·팝업 캘린더",
  description: "일본에서 이번 주에 나오는 한정 상품, 곧 열리는 팝업스토어, 곧 끝나는 행사를 날짜순으로 정리했어요.",
  alternates: { canonical: "/schedule" },
};

function Group({ title, note, items, kind }: { title: string; note: string; items: Product[]; kind: "start" | "end" }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-9">
      <h2 className="font-display text-[21px] text-ink">
        <span className="tape" style={{ ["--tape" as string]: kind === "start" ? "var(--color-mint)" : "var(--color-pink)" }}>
          {title}
        </span>
        <span className="ml-2 font-sans text-[13px] font-bold text-mute">{items.length}</span>
      </h2>
      <p className="mt-1.5 text-[12px] text-mute">{note}</p>
      <ul className="mt-3 grid gap-3 md:grid-cols-2">
        {items.slice(0, 40).map((p) => (
          <li key={p.id}>
            <DateRow product={p} kind={kind} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 캘린더: 상품의 출시일·종료일로 '이번 주 시작 / 곧 종료 / 그 뒤 예정'을 자동으로 만든다 */
export default async function SchedulePage() {
  const [products, allEvents] = await Promise.all([getProducts(), getEvents()]);
  const events = liveEvents(allEvents);

  const until = (iso?: string) => (iso ? daysUntil(iso) : NaN);
  const byStart = (a: Product, b: Product) => (a.releaseDate ?? "").localeCompare(b.releaseDate ?? "");
  const byEnd = (a: Product, b: Product) => (a.endDate ?? "").localeCompare(b.endDate ?? "");

  const thisWeek = products.filter((p) => until(p.releaseDate) >= 0 && until(p.releaseDate) <= 7).sort(byStart);
  const endingSoon = products.filter((p) => p.saleStatus !== "upcoming" && until(p.endDate) >= 0 && until(p.endDate) <= 14).sort(byEnd);
  const later = products.filter((p) => until(p.releaseDate) > 7).sort(byStart);
  const justOut = products.filter((p) => until(p.releaseDate) < 0 && until(p.releaseDate) >= -7).sort((a, b) => byStart(b, a));
  const empty = thisWeek.length + endingSoon.length + later.length + justOut.length + events.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-6 pt-6">
      <p className="font-maru text-[11px] font-bold tracking-[0.18em] text-coral-deep">CALENDAR</p>
      <h1 className="mt-1 font-display text-[28px] text-ink lg:text-[34px]">
        <span className="tape" style={{ ["--tape" as string]: "var(--color-mint)" }}>
          발매 · 팝업 캘린더
        </span>
      </h1>
      <p className="mt-1.5 text-[13px] text-ink-soft">발표에 날짜가 적힌 소식만 실어요. 한국과 일본은 시차가 없어 날짜 그대로예요.</p>
      <DemoNotice className="my-4" />

      {events.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-display text-[21px] text-ink">일정 · 소식</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {events.map((e) => (
              <li key={e.id}>
                <EventRow event={e} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <Group title="이번 주에 시작" note="오늘부터 7일 안에 발매하거나 열리는 것" items={thisWeek} kind="start" />
      <Group title="곧 끝나요" note="14일 안에 판매·행사가 끝나는 것" items={endingSoon} kind="end" />
      <Group title="그 뒤에 예정" note="다음 주 이후" items={later} kind="start" />
      <Group title="지난주에 나온 것" note="최근 7일 안에 시작" items={justOut} kind="start" />

      {empty && <p className="card dots mt-6 px-6 py-12 text-center text-[14px] text-ink-soft">날짜가 확인된 소식이 아직 없어요.</p>}
    </div>
  );
}
