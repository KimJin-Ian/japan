import type { Metadata } from "next";
import { AdminBoard } from "@/components/AdminBoard";
import { allProducts } from "@/lib/catalog";
import { CANDIDATES, COLLECTION_LOGS } from "@/lib/demo-data";

// 접근 제한은 src/proxy.ts (Basic 인증) + robots.txt 차단 + noindex 로 건다.
export const metadata: Metadata = { title: "관리자", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminBoard candidates={CANDIDATES} products={allProducts()} logs={COLLECTION_LOGS} />;
}
