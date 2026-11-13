# JAPAN FINDS (가칭)

일본 한정상품·신상품·팝업 굿즈를 한국 사용자에게 소개하는 상품 발견 서비스.
상품을 팔지 않는다. **발견 → 정보 확인 → 구매 의향 → 겸사겸사 구매 부탁**으로 이어 주는 것이 목적이다.

현재 단계: **Phase 1 — 프론트엔드 프로토타입** (예시 데이터, DB·수집기 미연결)

## 실행

```bash
npm install
npm run dev
```

`.env.example`을 `.env.local`로 복사해 값을 채운다. 비워 둬도 예시 데이터로 모든 화면이 열린다.

## 화면

| 주소 | 내용 |
|---|---|
| `/` | 홈 — 히어로, 카테고리, 주목할 한정템, 신상품, 일정, 팝업, 출시 예정, 가격 비교 |
| `/products` | 검색·필터·정렬 (쿼리: `q` `category` `limited` `region` `brand` `kr` `price` `status` `sort`) |
| `/products/[slug]` | 상세 — 한정 근거, 일본·한국 가격, 판매처, 한국에서 구하는 방법, 구매 부탁 버튼 |
| `/category/[slug]` `/brand/[slug]` | 카테고리·브랜드 허브 |
| `/schedule` `/schedule/[slug]` | 팝업·발매·응모 일정 (D-day, 한국 이용 범위, 변경 내역) |
| `/compare` | 같은 상품임을 확인한 것만 일본·한국 가격 비교 |
| `/saved` | 관심 상품 (로그인 없이 브라우저 저장) |
| `/admin` | 수집 후보 검수·게시 상품·수집 로그 (`ADMIN_USER`/`ADMIN_PASSWORD` Basic 인증, 배포 환경에서 미설정이면 404) |

## 구조

```
src/app/            화면 (Next.js App Router)
src/components/     카드 · 스티커 · 가격 비교 · 구매 부탁 버튼 · 관리자 보드
src/lib/types.ts    도메인 타입 (DB 스키마와 대응)
src/lib/catalog.ts  조회 함수 — 지금은 demo-data, Phase 2에서 Supabase로 교체
src/lib/demo-data.ts 예시 데이터 (전부 지어낸 값, 화면에 '데모' 표시)
src/lib/gyeomsa.ts  겸사겸사 연동 인터페이스 (주소는 환경변수)
src/proxy.ts        /admin 보호
supabase/schema.sql DB 스키마 초안 (아직 실행 검증 전)
docs/               IA · 사용자 흐름 · 화면 설계 · 디자인 시스템 · DB · 수집 아키텍처 · MVP 우선순위 · 덕비서 벤치마크
```

## 지키는 원칙

- 가격·한정 여부를 지어내지 않는다. 모르면 `확인 필요` / `한정 여부 확인 중` / `한국 가격 미확인`.
- 한국 가격은 모델·용량·옵션이 같다고 확인한 경우에만 비교한다.
- 판매량 데이터가 없으면 '인기'·'TOP' 표현을 쓰지 않는다.
- AI가 정리한 후보는 관리자가 승인해야 게시된다.
- 수집은 공식 API·RSS·약관이 허용하는 경로만 쓴다 (`docs/05`, `docs/07`).
- 겸사겸사 주소는 환경변수로만 받는다. 없으면 '구매 부탁 출시 알림 받기'로 대체한다.
