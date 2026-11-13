/** 배포 주소. 사이트맵·OG·구조화 데이터에 쓴다. Vercel 환경변수 NEXT_PUBLIC_SITE_URL 로 넣는다. */
// 끝에 붙은 / 는 떼어 낸다(주소가 //sitemap.xml 처럼 겹치지 않게)
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").trim().replace(/\/+$/, "");
