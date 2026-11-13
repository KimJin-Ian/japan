import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminBoard } from "@/components/AdminBoard";
import { getAdminData } from "@/lib/data";
import { setReviewStatus, setSaleStatus } from "./actions";

// 접근 제한은 src/proxy.ts (Basic 인증) + robots.txt 차단 + noindex 로 건다.
export const metadata: Metadata = { title: "관리자", robots: { index: false, follow: false } };

async function Board() {
  const { candidates, logs, products, live } = await getAdminData();
  return <AdminBoard candidates={candidates} products={products} logs={logs} live={live} decideAction={setReviewStatus} saleAction={setSaleStatus} />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16 text-center text-[13px] text-mute">관리자 데이터를 불러오는 중…</p>}>
      <Board />
    </Suspense>
  );
}
