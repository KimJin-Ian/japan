// 겸사겸사 연동 인터페이스.
// 주소는 환경변수로만 받는다. 값이 없으면 '출시 알림 받기'로 대체한다(임의 주소를 만들지 않는다).
// JAPAN FINDS 상품 id(jf_…)와 겸사겸사 부탁 id는 서로 다른 값이다.
// 부탁 등록·매칭·거래 완료는 겸사겸사가 서버 간 검증 이벤트로 알려 줘야 하며,
// 이쪽 버튼 클릭을 전환 완료로 세지 않는다.
import type { Product } from "./types";

export const GYEOMSA_REQUEST_URL = process.env.NEXT_PUBLIC_GYEOMSA_REQUEST_URL ?? "";
export const gyeomsaReady = GYEOMSA_REQUEST_URL.length > 0;

/** 겸사겸사 부탁 작성 화면에 미리 채워 줄 값 */
export type RequestPrefill = {
  ref: "japanfinds";
  jf_product_id: string;
  name_ko: string;
  name_ja: string;
  brand: string;
  place: string;
  region: string;
  price_jpy?: string;
  source_url: string;
  /** 같은 클릭을 겸사겸사 쪽 부탁 등록과 이어 붙이기 위한 값 */
  click_id: string;
};

export const buildPrefill = (p: Product): Omit<RequestPrefill, "click_id"> => {
  const offer = p.offers.find((o) => o.country === "JP");
  return {
    ref: "japanfinds",
    jf_product_id: p.id,
    name_ko: p.nameKo,
    name_ja: p.nameJa,
    brand: p.brand,
    place: p.places[0] ?? "",
    region: p.region,
    price_jpy: offer ? String(offer.price) : undefined,
    source_url: p.sources[0]?.url ?? "",
  };
};

export const buildRequestUrl = (prefill: Omit<RequestPrefill, "click_id">, clickId: string) => {
  if (!gyeomsaReady) return null;
  const url = new URL(GYEOMSA_REQUEST_URL);
  for (const [k, v] of Object.entries({ ...prefill, click_id: clickId })) if (v) url.searchParams.set(k, v);
  return url.toString();
};
