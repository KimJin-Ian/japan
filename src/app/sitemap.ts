import type { MetadataRoute } from "next";
import { allEvents, allProducts, brands } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";
import { CATEGORIES } from "@/lib/taxonomy";

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (path: string) => `${SITE_URL}${path}`;
  return [
    { url: u("/") },
    { url: u("/products") },
    { url: u("/schedule") },
    { url: u("/compare") },
    ...CATEGORIES.map((c) => ({ url: u(`/category/${c.slug}`) })),
    ...brands().map((b) => ({ url: u(`/brand/${b.slug}`) })),
    // 예시 데이터는 사이트맵에 넣지 않는다. 승인·게시된 실제 상품만 들어간다.
    ...allProducts()
      .filter((p) => !p.isDemo)
      .map((p) => ({ url: u(`/products/${p.slug}`), lastModified: p.addedAt })),
    ...allEvents()
      .filter((e) => !e.isDemo)
      .map((e) => ({ url: u(`/schedule/${e.slug}`), lastModified: e.noticeCheckedAt })),
  ];
}
