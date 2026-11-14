"use client";
// 브라우저 저장소: 전환 이벤트 큐 · 출시 알림 신청.
// MVP는 로그인 없이 localStorage에 둔다. Supabase Auth를 붙이면 user_interests · conversion_events 로 옮긴다.

const EVENTS_KEY = "jf:events";
const NOTIFY_KEY = "jf:notify";

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서는 조용히 넘어간다 */
  }
};

/* ---------- 전환 이벤트 ---------- */
// JAPAN FINDS가 직접 재는 이벤트만 여기서 기록한다.
// request_created · match_success · deal_completed 는 겸사겸사가 검증해 보내 주는 값으로만 센다.
export type TrackEvent = "product_view" | "request_click" | "gyeomsa_redirect" | "notify_signup";

export const track = (name: TrackEvent, props: Record<string, string> = {}) => {
  const queue = read<unknown[]>(EVENTS_KEY, []);
  queue.push({ name, props, at: new Date().toISOString() });
  write(EVENTS_KEY, queue.slice(-200));
};

export const newClickId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;

/* ---------- 구매 부탁 출시 알림 ---------- */
export const saveNotify = (productId: string, email: string) => {
  const list = read<{ productId: string; email: string; at: string }[]>(NOTIFY_KEY, []);
  list.push({ productId, email, at: new Date().toISOString() });
  write(NOTIFY_KEY, list);
  track("notify_signup", { product_id: productId });
};
