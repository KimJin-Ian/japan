import type { CategorySlug, LimitedType, RegionSlug, SaleStatus, KrOfficial } from "./types";

export const CATEGORIES: { slug: CategorySlug; name: string; short: string; desc: string }[] = [
  { slug: "character", name: "캐릭터·애니메이션 굿즈", short: "캐릭터", desc: "일본 캐릭터숍과 공식 스토어에서 나오는 굿즈" },
  { slug: "gacha", name: "가챠·피규어", short: "가챠·피규어", desc: "캡슐토이 신작과 이벤트 한정 피규어" },
  { slug: "fashion", name: "패션·액세서리", short: "패션", desc: "지역·매장 한정으로 나오는 옷과 소품" },
  { slug: "beauty", name: "뷰티·화장품", short: "뷰티", desc: "시즌 한정 색상과 일본 한정 패키지" },
  { slug: "stationery", name: "문구·잡화", short: "문구", desc: "계절 한정 잉크, 노트, 마스킹테이프" },
  { slug: "living", name: "생활용품", short: "생활", desc: "산지 이름이 붙는 그릇·타월·주방 소품" },
  { slug: "regional", name: "일본 지역 한정상품", short: "지역 한정", desc: "그 지역 역·공항·기념품점에서만 파는 상품" },
  { slug: "popup", name: "팝업스토어 한정상품", short: "팝업", desc: "기간이 정해진 팝업에서만 살 수 있는 상품" },
];

/** 한정 유형. 일본 매장에서 실제로 보게 되는 표기(ja)를 함께 보여 준다 */
export const LIMITED: Record<LimitedType, { ko: string; ja: string }> = {
  japan: { ko: "일본 한정", ja: "日本限定" },
  region: { ko: "지역 한정", ja: "地域限定" },
  store: { ko: "매장 한정", ja: "店舗限定" },
  period: { ko: "기간 한정", ja: "期間限定" },
  quantity: { ko: "수량 한정", ja: "数量限定" },
};

export const REGIONS: Record<RegionSlug, string> = {
  tokyo: "도쿄",
  osaka: "오사카",
  kyoto: "교토",
  hokkaido: "홋카이도",
  fukuoka: "후쿠오카",
  nagoya: "나고야",
  okinawa: "오키나와",
  other: "그 밖의 지역",
  online: "일본 온라인",
};

export const SALE_STATUS: Record<SaleStatus, string> = {
  upcoming: "출시 예정",
  on_sale: "판매 중",
  ended: "판매 종료",
};

export const KR_OFFICIAL: Record<KrOfficial, string> = {
  yes: "한국 공식 판매 있음",
  no: "한국 공식 판매 없음",
  unknown: "한국 판매 여부 확인 중",
};

export const PRICE_BANDS = [
  { key: "u1000", label: "1,000엔 미만", min: 0, max: 999 },
  { key: "u3000", label: "1,000~2,999엔", min: 1000, max: 2999 },
  { key: "u6000", label: "3,000~5,999엔", min: 3000, max: 5999 },
  { key: "o6000", label: "6,000엔 이상", min: 6000, max: Infinity },
] as const;

export const categoryName = (slug: CategorySlug) => CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
export const categoryShort = (slug: CategorySlug) => CATEGORIES.find((c) => c.slug === slug)?.short ?? slug;
