// '오늘'(한국·일본 날짜). 서버는 data.ts 의 getToday()가, 브라우저는 RateProvider 가 setToday 로 넣어 준다.
// D-day 와 진행 상태를 모두 이 날짜로 계산한다.
let TODAY = "2026-11-14";
export const setToday = (iso: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) TODAY = iso;
};
export const getTodayIso = () => TODAY;

/** DB에 환율이 없을 때만 쓰는 가정값. 평소에는 수집기가 넣은 exchange_rates 최신 값을 쓴다(components/Rate.tsx). */
export const DEMO_RATE = { krwPer100Jpy: 930, label: "데모용 가정 환율", checkedAt: "2026-11-13T09:00:00+09:00" };

export const yen = (n: number) => `${n.toLocaleString("ko-KR")}엔`;
export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

const DAY = 86_400_000;
const toUtc = (iso: string) => Date.parse(iso.slice(0, 10) + "T00:00:00Z");

/** 오늘부터 해당 날짜까지 남은 일수 (지났으면 음수) */
export const daysUntil = (iso: string, today = TODAY) => Math.round((toUtc(iso) - toUtc(today)) / DAY);

export const dday = (iso: string) => {
  const d = daysUntil(iso);
  return d === 0 ? "D-DAY" : d > 0 ? `D-${d}` : `D+${-d}`;
};

/** 2026-11-20 → 11.20 (같은 해) / 27.01.12 (다른 해) */
export const shortDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return y === TODAY.slice(0, 4) ? `${m}.${d}` : `${y.slice(2)}.${m}.${d}`;
};

export const longDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
};

/** 확인 시각: 2026-11-12T14:20 → 11월 12일 14:20 확인 */
export const checkedLabel = (iso: string) => {
  const [, m, d] = iso.slice(0, 10).split("-");
  const t = iso.slice(11, 16);
  return `${Number(m)}월 ${Number(d)}일${t ? ` ${t}` : ""} 확인`;
};
