import Link from "next/link";

export default function NotFound() {
  return (
    <div className="dots mx-auto my-10 max-w-md rounded-[28px] bg-white px-6 py-14 text-center shadow-[var(--shadow-soft)]">
      <p className="font-display text-[26px] text-ink">찾는 페이지가 없어요</p>
      <p className="mt-2 text-[13px] text-ink-soft">판매가 끝났거나 주소가 바뀌었을 수 있어요.</p>
      <Link href="/products" className="btn btn-primary mt-5 h-12 px-6 text-[15px]">
        다른 상품 구경하기
      </Link>
    </div>
  );
}
