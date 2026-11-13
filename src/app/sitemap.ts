import type { MetadataRoute } from "next";
import { brandsOf } from "@/lib/catalog";
import { getEvents, getProducts } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import { CATEGORIES } from "@/lib/taxonomy";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, events] = await Promise.all([getProducts(), getEvents()]);
  const u = (path: string) => `${SITE_URL}${path}`;
  return [
    { url: u("/") },
    { url: u("/products") },
    { url: u("/schedule") },
    { url: u("/compare") },
    ...CATEGORIES.map((c) => ({ url: u(`/category/${c.slug}`) })),
    ...brandsOf(products).map((b) => ({ url: u(`/brand/${b.slug}`) })),
    // 예시 데이터는 사이트맵에 넣지 않는다. 승인·게시된 실제 상품만 들어간다.
    ...products
      .filter((p) => !p.isDemo)
      .map((p) => ({ url: u(`/products/${p.slug}`), lastModified: p.addedAt })),
    ...events
      .filter((e) => !e.isDemo)
      .map((e) => ({ url: u(`/schedule/${e.slug}`), lastModified: e.noticeCheckedAt })),
  ];
}
