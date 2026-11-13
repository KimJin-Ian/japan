"use client";
// 환율. 서버(layout)가 exchange_rates 최신 값을 읽어 내려 주고, 화면 어디서나 같은 값으로 원화를 계산한다.
import { createContext, useContext } from "react";
import { DEMO_RATE, setToday, won } from "@/lib/format";

export type Rate = {
  krwPer100Jpy: number;
  /** 화면에 그대로 적는 출처 설명 */
  label: string;
  /** DB에 환율이 없어 가정값을 쓰는 중인가 */
  isDemo: boolean;
};

export const FALLBACK_RATE: Rate = { krwPer100Jpy: DEMO_RATE.krwPer100Jpy, label: DEMO_RATE.label, isDemo: true };

const RateContext = createContext<Rate>(FALLBACK_RATE);

export function RateProvider({ rate, today, children }: { rate: Rate; today: string; children: React.ReactNode }) {
  // 브라우저 쪽 D-day 계산도 서버와 같은 날짜를 쓰게 한다
  setToday(today);
  return <RateContext.Provider value={rate}>{children}</RateContext.Provider>;
}

export const useRate = () => useContext(RateContext);

/** 엔 → 원 (10원 단위 반올림) */
export const toKrw = (jpy: number, rate: Rate) => Math.round((jpy * rate.krwPer100Jpy) / 100 / 10) * 10;

/** "약 18,410원" */
export function Krw({ jpy, className }: { jpy: number; className?: string }) {
  const rate = useRate();
  return <span className={className}>약 {won(toKrw(jpy, rate))}</span>;
}

/** "100엔 = 835.4원 · Frankfurter (유럽중앙은행 기준 2026-11-12)" */
export function RateNote() {
  const rate = useRate();
  return (
    <>
      100엔 = {rate.krwPer100Jpy.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}원 ({rate.label})
    </>
  );
}
