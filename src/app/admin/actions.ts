"use server";
// 관리자 쓰기 동작. /admin 은 proxy.ts 의 Basic 인증 뒤에 있고, 서버 액션 요청도 같은 경로로 들어온다.
// 비밀 키는 서버에서만 쓴다.
import { updateTag } from "next/cache";
import { adminDb } from "@/lib/data";
import type { ReviewStatus, SaleStatus } from "@/lib/types";

const REVIEW: ReviewStatus[] = ["pending", "approved", "rejected", "merged"];
const SALE: SaleStatus[] = ["upcoming", "on_sale", "ended"];

/** 후보 검수 상태 저장. (승인된 후보를 상품으로 만드는 등록 폼은 다음 단계에서 붙인다) */
export async function setReviewStatus(id: string, status: ReviewStatus) {
  if (!REVIEW.includes(status)) throw new Error("알 수 없는 검수 상태");
  const { error } = await adminDb()
    .from("product_candidates")
    .update({ review_status: status, reviewed_at: status === "pending" ? null : new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** 게시 상품의 판매 상태 변경(판매 종료 처리 등). 사용자 화면 캐시를 바로 비운다 */
export async function setSaleStatus(productId: string, status: SaleStatus) {
  if (!SALE.includes(status)) throw new Error("알 수 없는 판매 상태");
  const { error } = await adminDb().from("products").update({ sale_status: status }).eq("id", productId);
  if (error) throw new Error(error.message);
  updateTag("products");
}
