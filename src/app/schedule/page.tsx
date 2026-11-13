import type { Metadata } from "next";
import { DemoNotice } from "@/components/Bits";
import { ScheduleList } from "@/components/ScheduleList";
import { eventPhase, sortEvents } from "@/lib/catalog";
import { getEvents } from "@/lib/data";

export const metadata: Metadata = {
  title: "일본 팝업·발매·응모 일정",
  description: "일본 팝업스토어, 신상품 발매, 추첨 응모 마감을 날짜순으로 정리했어요. 한국에서 이용할 수 있는지도 함께 확인하세요.",
  alternates: { canonical: "/schedule" },
};

export default async function SchedulePage() {
  const rows = sortEvents(await getEvents()).map((event) => ({ event, phase: eventPhase(event) }));
  return (
    <div className="mx-auto max-w-6xl px-4 pb-6 pt-6">
      <p className="font-maru text-[11px] font-bold tracking-[0.18em] text-coral-deep">SCHEDULE</p>
      <h1 className="mt-1 font-display text-[28px] text-ink lg:text-[34px]">
        <span className="tape" style={{ ["--tape" as string]: "var(--color-mint)" }}>
          일정 · 소식
        </span>
      </h1>
      <p className="mt-1.5 text-[13px] text-ink-soft">공식 공지에 나온 날짜만 실어요. 한국과 일본은 시차가 없어 표시된 시각 그대로예요.</p>
      <DemoNotice className="my-4" />
      <ScheduleList rows={rows} />
    </div>
  );
}
