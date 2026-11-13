-- JAPAN FINDS — Supabase(PostgreSQL) 스키마 초안
-- Supabase SQL Editor에서 위에서부터 그대로 실행한다. (빈 프로젝트 기준)
-- 필드 이름은 src/lib/types.ts 의 camelCase 를 snake_case 로 옮긴 것이다. 대응표는 docs/04_DB_스키마.md 참고.

-- ───────────────────────── 확장 ─────────────────────────
create extension if not exists pg_trgm with schema extensions; -- 한국어·일본어 부분 일치 검색

-- ───────────────────────── enum ─────────────────────────
create type category_slug   as enum ('character','gacha','fashion','beauty','stationery','living','regional','popup');
create type limited_type    as enum ('japan','region','store','period','quantity');
create type limited_status  as enum ('verified','checking','none');
create type region_slug     as enum ('tokyo','osaka','kyoto','hokkaido','fukuoka','nagoya','okinawa','other','online');
create type sale_status     as enum ('upcoming','on_sale','ended');
create type kr_official     as enum ('yes','no','unknown');
create type publish_status  as enum ('draft','published','hidden');
create type offer_country   as enum ('JP','KR');
create type currency_code   as enum ('JPY','KRW');
create type source_type     as enum ('official_site','press_release','store_notice');
create type review_status   as enum ('pending','approved','rejected','merged');
create type image_rights    as enum ('unchecked','press_ok','not_allowed');
create type collect_method  as enum ('rss','api','manual');
create type conversion_event_type as enum (
  'product_view','product_save','request_click','gyeomsa_redirect',   -- JAPAN FINDS 가 측정
  'request_created','match_success','deal_completed'                  -- 겸사겸사가 검증해 서버 간 전달
);
create type event_origin    as enum ('japanfinds','gyeomsa');

-- ───────────────────────── 공통 함수 ─────────────────────────
-- 관리자 판별: Supabase Auth 사용자의 app_metadata.role = 'admin'
-- (app_metadata 는 사용자가 직접 바꿀 수 없고 service role 로만 설정한다)
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ───────────────────────── products ─────────────────────────
create table public.products (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_ko          text not null,
  name_ja          text not null,
  brand            text not null,
  brand_slug       text not null,
  category         category_slug not null,
  character        text,
  tags             text[] not null default '{}',
  summary          text not null default '',

  limited_status   limited_status not null default 'checking',
  limited_types    limited_type[] not null default '{}',
  limited_evidence text not null default '',           -- 한정 판단 근거. 확인 중이면 무엇을 확인 중인지

  region           region_slug not null default 'other',
  places           text[] not null default '{}',       -- 판매 매장 또는 구매 가능 사이트
  release_date     date,
  end_date         date,
  sale_status      sale_status not null default 'on_sale',
  kr_official      kr_official not null default 'unknown',
  conditions       text[] not null default '{}',       -- 구매 조건·주의사항

  editor_pick      boolean not null default false,
  visual           jsonb,                              -- { tone, motif } 자체 일러스트 설정
  image_url        text,                               -- 사용권이 확인된 이미지만
  image_rights     image_rights not null default 'unchecked',
  is_demo          boolean not null default false,     -- 예시 데이터 여부

  publish_status   publish_status not null default 'draft',
  published_at     timestamptz,
  added_at         date not null default current_date, -- JAPAN FINDS 등록일
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- 한정이 '확인됨'이면 유형과 근거가 반드시 있어야 한다
  constraint limited_verified_needs_evidence check (
    limited_status <> 'verified'
    or (cardinality(limited_types) > 0 and length(limited_evidence) > 0)
  ),
  constraint end_after_release check (end_date is null or release_date is null or end_date >= release_date)
);

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create index products_publish_idx   on public.products (publish_status, added_at desc);
create index products_category_idx  on public.products (category) where publish_status = 'published';
create index products_brand_idx     on public.products (brand_slug) where publish_status = 'published';
create index products_region_idx    on public.products (region) where publish_status = 'published';
create index products_release_idx   on public.products (release_date);
create index products_tags_idx      on public.products using gin (tags);
create index products_limited_idx   on public.products using gin (limited_types);
create index products_name_ko_trgm  on public.products using gin (name_ko extensions.gin_trgm_ops);
create index products_name_ja_trgm  on public.products using gin (name_ja extensions.gin_trgm_ops);
create index products_brand_trgm    on public.products using gin (brand extensions.gin_trgm_ops);
create index products_char_trgm     on public.products using gin (character extensions.gin_trgm_ops);

-- ───────────────────────── product_sources ─────────────────────────
create table public.product_sources (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  label       text not null,
  url         text not null,
  type        source_type not null,
  checked_at  timestamptz not null,          -- 마지막 확인 시각
  verified    boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (product_id, url)
);
create index product_sources_product_idx on public.product_sources (product_id);

-- ───────────────────────── product_offers ─────────────────────────
-- 같은 상품을 여러 판매처가 팔 수 있으므로 가격은 상품과 분리한다.
create table public.product_offers (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid not null references public.products(id) on delete cascade,
  country            offer_country not null,
  seller             text not null,
  price              numeric(12,2) not null check (price >= 0),
  currency           currency_code not null,
  url                text not null,
  product_code       text,                    -- JAN 코드 등
  tax_included       boolean not null default true,
  same_item_verified boolean,                 -- KR 오퍼 전용: 일본 상품과 모델·용량·옵션이 같은지 관리자가 확인
  note               text,
  checked_at         timestamptz not null,    -- 가격 확인 시각
  created_at         timestamptz not null default now(),
  constraint offer_currency_matches_country check (
    (country = 'JP' and currency = 'JPY') or (country = 'KR' and currency = 'KRW')
  )
);
create index product_offers_product_idx on public.product_offers (product_id, country);
create index product_offers_code_idx    on public.product_offers (product_code) where product_code is not null;
-- 가격 비교 화면: 동일 상품으로 검증된 한국 오퍼만
create index product_offers_compare_idx on public.product_offers (product_id)
  where country = 'KR' and same_item_verified is true;

-- ───────────────────────── collection_logs ─────────────────────────
create table public.collection_logs (
  id          uuid primary key default gen_random_uuid(),
  target      text not null,                  -- 수집 대상 (예: PR TIMES 키워드 피드)
  method      collect_method not null,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  ok          boolean not null default false,
  found       integer not null default 0,     -- 발견한 항목 수
  added       integer not null default 0,     -- 새로 적재한 후보 수
  retries     integer not null default 0,
  error       text
);
create index collection_logs_started_idx on public.collection_logs (started_at desc);

-- ───────────────────────── product_candidates ─────────────────────────
create table public.product_candidates (
  id              uuid primary key default gen_random_uuid(),
  raw_title_ja    text not null,
  raw_excerpt_ja  text,                       -- 분석에 쓴 발췌(본문 전체를 저장하지 않는다)
  source_name     text not null,
  source_url      text not null,
  source_url_hash text generated always as (md5(source_url)) stored,
  collected_at    timestamptz not null default now(),
  collection_log_id uuid references public.collection_logs(id) on delete set null,

  ai              jsonb not null default '{}'::jsonb,  -- 필드별 { value, confidence } — types.ts 의 Candidate.ai
  ai_model        text,
  ai_analyzed_at  timestamptz,

  review_status   review_status not null default 'pending',
  duplicate_of    uuid references public.products(id) on delete set null,  -- 중복 의심 상품
  image_rights    image_rights not null default 'unchecked',
  product_id      uuid references public.products(id) on delete set null,  -- 승인·병합 결과로 연결된 상품
  reviewed_by     uuid references auth.users(id) on delete set null,
  reviewed_at     timestamptz,
  review_note     text,

  unique (source_url_hash)                    -- 같은 출처 URL 은 한 번만 적재
);
create index product_candidates_status_idx on public.product_candidates (review_status, collected_at desc);

-- ───────────────────────── user_interests ─────────────────────────
-- MVP 는 localStorage 저장. Supabase Auth 도입 후 이 테이블로 옮긴다.
create table public.user_interests (
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  created_at  timestamptz not null default now(),   -- 관심 등록 시각
  notify      boolean not null default false,       -- 알림 신청 여부
  primary key (user_id, product_id)
);
create index user_interests_product_idx on public.user_interests (product_id);

-- ───────────────────────── exchange_rates ─────────────────────────
create table public.exchange_rates (
  id          uuid primary key default gen_random_uuid(),
  base        currency_code not null default 'JPY',
  quote       currency_code not null default 'KRW',
  rate        numeric(12,6) not null check (rate > 0),  -- 1 base = rate quote
  source      text not null,                             -- 환율 제공처
  fetched_at  timestamptz not null default now()         -- 화면에 표시하는 확인 시각
);
create index exchange_rates_latest_idx on public.exchange_rates (base, quote, fetched_at desc);

-- ───────────────────────── conversion_events ─────────────────────────
-- JAPAN FINDS 상품 id 와 겸사겸사 부탁 id 는 서로 다른 값이다.
-- 둘은 이동 시 발급하는 ref(추적 값)로만 연결한다.
create table public.conversion_events (
  id                 bigint generated always as identity primary key,
  event_type         conversion_event_type not null,
  origin             event_origin not null,
  product_id         uuid references public.products(id) on delete set null,
  session_id         text,                    -- 익명 세션 id (개인정보 아님)
  user_id            uuid references auth.users(id) on delete set null,
  ref                uuid,                    -- gyeomsa_redirect 때 발급. 겸사겸사가 그대로 돌려준다
  gyeomsa_request_id text,                    -- 겸사겸사 쪽 부탁 id (외부 값, FK 아님)
  occurred_at        timestamptz not null default now(),
  payload            jsonb not null default '{}'::jsonb,

  -- 검증이 필요한 이벤트는 겸사겸사에서 온 것만 인정한다 (버튼 클릭을 거래 완료로 세지 않기 위함)
  constraint verified_events_come_from_gyeomsa check (
    (event_type in ('request_created','match_success','deal_completed')
       and origin = 'gyeomsa' and ref is not null and gyeomsa_request_id is not null)
    or
    (event_type in ('product_view','product_save','request_click','gyeomsa_redirect')
       and origin = 'japanfinds')
  )
);
create index conversion_events_type_idx    on public.conversion_events (event_type, occurred_at desc);
create index conversion_events_product_idx on public.conversion_events (product_id, event_type);
create index conversion_events_ref_idx     on public.conversion_events (ref) where ref is not null;
-- 겸사겸사가 같은 이벤트를 다시 보내도 한 번만 기록
create unique index conversion_events_gyeomsa_once
  on public.conversion_events (gyeomsa_request_id, event_type)
  where origin = 'gyeomsa';

-- ───────────────────────── notify_requests ─────────────────────────
-- 겸사겸사 연동 전: '구매 부탁 출시 알림 받기' 신청
create table public.notify_requests (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references public.products(id) on delete set null,
  contact     text not null,                  -- 이메일 등 연락처 (개인정보 — 수집 동의 필요)
  consent_at  timestamptz not null,           -- 수집·이용 동의 시각
  session_id  text,
  created_at  timestamptz not null default now(),
  notified_at timestamptz,
  unique (product_id, contact)
);

-- ───────────────────────── 인기 집계(데이터가 쌓인 뒤 사용) ─────────────────────────
-- 인기순 정렬은 이 뷰에 실제 값이 쌓이기 전에는 화면에 노출하지 않는다.
create view public.product_popularity
with (security_invoker = true) as
select
  product_id,
  count(*) filter (where event_type = 'product_view') as views,
  count(*) filter (where event_type = 'product_save') as saves
from public.conversion_events
where product_id is not null
  and occurred_at > now() - interval '30 days'
group by product_id;

-- ───────────────────────── RLS ─────────────────────────
alter table public.products           enable row level security;
alter table public.product_sources    enable row level security;
alter table public.product_offers     enable row level security;
alter table public.product_candidates enable row level security;
alter table public.collection_logs    enable row level security;
alter table public.user_interests     enable row level security;
alter table public.exchange_rates     enable row level security;
alter table public.conversion_events  enable row level security;
alter table public.notify_requests    enable row level security;

-- products: 누구나 게시 상품만 읽기, 관리자는 전부
create policy "products: published 읽기" on public.products
  for select to anon, authenticated
  using (publish_status = 'published');
create policy "products: 관리자 전체" on public.products
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- product_sources / product_offers: 게시 상품에 딸린 것만 읽기
create policy "sources: published 읽기" on public.product_sources
  for select to anon, authenticated
  using (exists (select 1 from public.products p
                 where p.id = product_id and p.publish_status = 'published'));
create policy "sources: 관리자 전체" on public.product_sources
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "offers: published 읽기" on public.product_offers
  for select to anon, authenticated
  using (exists (select 1 from public.products p
                 where p.id = product_id and p.publish_status = 'published'));
create policy "offers: 관리자 전체" on public.product_offers
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- product_candidates / collection_logs: 관리자만 (수집기는 service role 로 쓰므로 RLS 를 거치지 않는다)
create policy "candidates: 관리자 전체" on public.product_candidates
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "logs: 관리자 읽기" on public.collection_logs
  for select to authenticated
  using (public.is_admin());

-- user_interests: 본인 것만
create policy "interests: 본인 읽기" on public.user_interests
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy "interests: 본인 추가" on public.user_interests
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "interests: 본인 수정" on public.user_interests
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "interests: 본인 삭제" on public.user_interests
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- exchange_rates: 누구나 읽기, 쓰기는 service role(스케줄러)만
create policy "rates: 읽기" on public.exchange_rates
  for select to anon, authenticated
  using (true);

-- conversion_events / notify_requests: 클라이언트가 직접 쓰지 않는다.
-- Next.js 서버(Route Handler)가 service role 로 기록하고, 관리자만 읽는다.
create policy "events: 관리자 읽기" on public.conversion_events
  for select to authenticated
  using (public.is_admin());
create policy "notify: 관리자 읽기" on public.notify_requests
  for select to authenticated
  using (public.is_admin());

-- ═════════════════════════ 일정·소식 (events) ═════════════════════════
-- 공식 공지 단위의 발매 · 팝업 · 캠페인 · 예약 · 추첨 · 재입고 일정.
-- src/lib/types.ts 의 EventItem 과 대응한다. (배경: docs/07_덕비서_벤치마크.md)
-- 위 블록을 모두 실행한 뒤 이어서 실행한다.

create type event_kind as enum ('release','popup','campaign','preorder','lottery','restock');
-- 한국에서 이용할 수 있는 범위
create type kr_scope   as enum ('jp_only','no_kr_shipping','mixed','kr_available','checking');

create table public.events (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title_ko          text not null,
  title_ja          text not null,                       -- 공식 공지 원제
  brand             text not null,
  brand_slug        text not null,
  characters        text[] not null default '{}',
  kind              event_kind not null,
  summary           text not null default '',            -- 자체 작성 한국어 요약 (원문 복제 금지)
  region            region_slug not null,
  place             text,
  start_date        date,
  end_date          date,

  kr_scope          kr_scope not null default 'checking',
  scope_quoted      boolean not null default false,      -- 한국 이용 범위를 공식 원문 문장에서 직접 확인했는가

  -- 공식 출처 (types.ts 의 EventItem.source)
  source_label      text not null,
  source_url        text not null,
  source_url_hash   text generated always as (md5(source_url)) stored,
  source_type       source_type not null default 'official_site',
  source_verified   boolean not null default false,
  notice_checked_at timestamptz not null,                -- 공식 공지를 읽은 시각
  link_checked_at   timestamptz,                         -- 링크가 살아 있는지 마지막으로 본 시각
  link_ok           boolean,                             -- 마지막 링크 점검 결과

  collect_method    collect_method not null default 'manual',  -- rss · api · manual(URL·CSV 등록)
  is_demo           boolean not null default false,
  publish_status    publish_status not null default 'draft',
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (source_url_hash),
  constraint event_end_after_start check (end_date is null or start_date is null or end_date >= start_date),
  -- '원문 인용'이라고 표시하려면 범위가 확정돼 있어야 한다
  constraint scope_quoted_needs_scope check (not scope_quoted or kr_scope <> 'checking')
);

create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create index events_publish_idx on public.events (publish_status, start_date);
create index events_end_idx     on public.events (end_date) where publish_status = 'published';
create index events_brand_idx   on public.events (brand_slug) where publish_status = 'published';
create index events_kind_idx    on public.events (kind) where publish_status = 'published';
create index events_title_ko_trgm on public.events using gin (title_ko extensions.gin_trgm_ops);
create index events_title_ja_trgm on public.events using gin (title_ja extensions.gin_trgm_ops);

-- 일정·조건 변경 내역 (types.ts 의 EventItem.changes)
create table public.event_changes (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  changed_at  timestamptz not null,       -- 바뀐 것을 확인한 시각 (types.ts 의 at)
  before_text text not null,
  after_text  text not null,
  created_at  timestamptz not null default now()
);
create index event_changes_event_idx on public.event_changes (event_id, changed_at desc);

-- 일정 ↔ 상품 (types.ts 의 EventItem.productSlugs)
create table public.event_products (
  event_id   uuid not null references public.events(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (event_id, product_id)
);
create index event_products_product_idx on public.event_products (product_id);

-- RLS
alter table public.events         enable row level security;
alter table public.event_changes  enable row level security;
alter table public.event_products enable row level security;

create policy "events_pub: published 읽기" on public.events
  for select to anon, authenticated
  using (publish_status = 'published');
create policy "events_pub: 관리자 전체" on public.events
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "event_changes: published 읽기" on public.event_changes
  for select to anon, authenticated
  using (exists (select 1 from public.events e
                 where e.id = event_id and e.publish_status = 'published'));
create policy "event_changes: 관리자 전체" on public.event_changes
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 연결 행은 일정과 상품이 둘 다 게시 상태일 때만 보인다
create policy "event_products: published 읽기" on public.event_products
  for select to anon, authenticated
  using (
    exists (select 1 from public.events e   where e.id = event_id   and e.publish_status = 'published')
    and exists (select 1 from public.products p where p.id = product_id and p.publish_status = 'published')
  );
create policy "event_products: 관리자 전체" on public.event_products
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
