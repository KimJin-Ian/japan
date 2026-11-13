// JAPAN FINDS 도메인 타입.
// DB(supabase/schema.sql)의 products · product_offers · product_sources · product_candidates · collection_logs 와 1:1로 대응한다.

export type CategorySlug =
  | "character"
  | "gacha"
  | "fashion"
  | "beauty"
  | "stationery"
  | "living"
  | "regional"
  | "popup";

export type LimitedType = "japan" | "region" | "store" | "period" | "quantity";

export type RegionSlug =
  | "tokyo"
  | "osaka"
  | "kyoto"
  | "hokkaido"
  | "fukuoka"
  | "nagoya"
  | "okinawa"
  | "other"
  | "online";

/** verified: 근거 확인됨 / checking: 한정 여부 확인 중 / none: 상시 판매 상품 */
export type LimitedStatus = "verified" | "checking" | "none";

export type SaleStatus = "upcoming" | "on_sale" | "ended";

/** 한국 공식 판매 여부 */
export type KrOfficial = "yes" | "no" | "unknown";

export type Offer = {
  country: "JP" | "KR";
  seller: string;
  price: number;
  currency: "JPY" | "KRW";
  url: string;
  /** 가격 확인 시각 (ISO) */
  checkedAt: string;
  taxIncluded: boolean;
  /** KR 오퍼 전용: 일본 상품과 모델·용량·옵션이 같은지 관리자가 확인했는가 */
  sameItemVerified?: boolean;
  productCode?: string;
  note?: string;
};

export type Source = {
  label: string;
  url: string;
  type: "official_site" | "press_release" | "store_notice";
  checkedAt: string;
  verified: boolean;
};

export type VisualMotif =
  | "plush"
  | "keyring"
  | "capsule"
  | "figure"
  | "tote"
  | "socks"
  | "tube"
  | "jar"
  | "ink"
  | "notebook"
  | "tape"
  | "glass"
  | "towel"
  | "sweets"
  | "stand"
  | "tee";

export type Product = {
  id: string;
  slug: string;
  nameKo: string;
  nameJa: string;
  brand: string;
  brandSlug: string;
  category: CategorySlug;
  character?: string;
  tags: string[];
  summary: string;
  limited: {
    status: LimitedStatus;
    types: LimitedType[];
    /** 한정 여부를 판단한 근거. 확인 중이면 무엇을 확인하고 있는지 */
    evidence: string;
  };
  region: RegionSlug;
  /** 판매 매장 또는 구매 가능 사이트 */
  places: string[];
  releaseDate?: string;
  endDate?: string;
  saleStatus: SaleStatus;
  krOfficial: KrOfficial;
  conditions: string[];
  offers: Offer[];
  sources: Source[];
  editorPick?: boolean;
  /** JAPAN FINDS 등록일 (ISO date) */
  addedAt: string;
  visual: { tone: "pink" | "peach" | "butter" | "mint" | "sky" | "lilac"; motif: VisualMotif };
  /** 출처 피드가 제공한 대표 이미지 주소(원본을 그대로 가리킨다). 없으면 visual 그림을 쓴다 */
  imageUrl?: string;
  /** 예시 데이터 여부. 실제 게시 상품은 false */
  isDemo: boolean;
};

/* ---------- 관리자 ---------- */

export type ReviewStatus = "pending" | "approved" | "rejected" | "merged";

export type AiField<T> = {
  value: T | null;
  /** 0~1. 0.6 미만이면 화면에 '확인 필요'로 표시 */
  confidence: number;
};

export type Candidate = {
  id: string;
  rawTitleJa: string;
  sourceName: string;
  sourceUrl: string;
  collectedAt: string;
  reviewStatus: ReviewStatus;
  /** 중복으로 의심되는 기존 상품 id */
  duplicateOf?: string;
  imageRights: "unchecked" | "press_ok" | "not_allowed";
  ai: {
    nameKo: AiField<string>;
    summaryKo: AiField<string>;
    brand: AiField<string>;
    category: AiField<CategorySlug>;
    limitedTypes: AiField<LimitedType[]>;
    releaseDate: AiField<string>;
    endDate: AiField<string>;
    places: AiField<string>;
    priceJpy: AiField<number>;
    usefulForKr: AiField<boolean>;
  };
};

export type CollectionLog = {
  id: string;
  target: string;
  method: "RSS" | "API" | "수동 등록";
  startedAt: string;
  ok: boolean;
  found: number;
  added: number;
  retries: number;
  error?: string;
};

/* ---------- 일정·소식 (팝업 · 발매 · 캠페인) ---------- */

export type EventKind = "release" | "popup" | "campaign" | "preorder" | "lottery" | "restock";

/** 한국에서 이용할 수 있는 범위 */
export type KrScope = "jp_only" | "no_kr_shipping" | "mixed" | "kr_available" | "checking";

export type EventItem = {
  id: string;
  slug: string;
  titleKo: string;
  /** 공식 공지 원제 */
  titleJa: string;
  brand: string;
  brandSlug: string;
  characters: string[];
  kind: EventKind;
  summary: string;
  region: RegionSlug;
  place?: string;
  startDate?: string;
  endDate?: string;
  krScope: KrScope;
  /** true면 한국 이용 범위를 공식 원문 문장에서 직접 확인했다 */
  scopeQuoted: boolean;
  source: Source;
  /** 공식 공지를 읽은 시각 / 링크가 살아 있는지 마지막으로 본 시각 */
  noticeCheckedAt: string;
  linkCheckedAt: string;
  /** 일정·조건이 바뀐 기록 */
  changes: { at: string; before: string; after: string }[];
  productSlugs: string[];
  isDemo: boolean;
};
