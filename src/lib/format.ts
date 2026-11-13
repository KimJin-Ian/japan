/** 프로토타입의 '오늘'. 데모 데이터의 판매 상태·D-day를 이 날짜 기준으로 계산한다.
 *  운영에서는 서버 시각(Asia/Seoul)으로 바꾼다. */
export const DEMO_TODAY = "2026-11-13";

/** 데모용 가정 환율. 실제 환율이 아니다. 운영에서는 exchange_rates 테이블의 최신 값과 확인 시각을 쓴다. */
export const DEMO_RATE = { krwPer100Jpy: 930, label: "데모용 가정 환율", checkedAt: "2026-11-13T09:00:00+09:00" };

export const yen = (n: number) => `${n.toLocaleString("ko-KR")}엔`;
export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/** 엔 → 원 환산 (10원 단위 반올림) */
export const jpyToKrw = (jpy: number) => Math.round((jpy * DEMO_RATE.krwPer100Jpy) / 100 / 10) * 10;

const DAY = 86_400_000;
const toUtc = (iso: string) => Date.parse(iso.slice(0, 10) + "T00:00:00Z");

/** 오늘부터 해당 날짜까지 남은 일수 (지났으면 음수) */
export const daysUntil = (iso: string, today = DEMO_TODAY) => Math.round((toUtc(iso) - toUtc(today)) / DAY);

export const dday = (iso: string) => {
  const d = daysUntil(iso);
  return d === 0 ? "D-DAY" : d > 0 ? `D-${d}` : `D+${-d}`;
};

/** 2026-11-20 → 11.20 (같은 해) / 27.01.12 (다른 해) */
export const shortDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return y === DEMO_TODAY.slice(0, 4) ? `${m}.${d}` : `${y.slice(2)}.${m}.${d}`;
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
