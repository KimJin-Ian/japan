"use client";
// 구매 부탁 전환 지점.
// 겸사겸사 주소(NEXT_PUBLIC_GYEOMSA_REQUEST_URL)가 있으면 상품 정보를 채워 이동하고,
// 없으면 '구매 부탁 출시 알림 받기'를 대신 보여 준다.
import { useEffect, useState } from "react";
import { newClickId, saveNotify, track } from "@/lib/client-store";
import { buildRequestUrl, gyeomsaReady, type RequestPrefill } from "@/lib/gyeomsa";
import type { Product } from "@/lib/types";

const Plane = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
    <path d="M21.5 3.2 2.9 10.4c-.8.3-.8 1.4 0 1.7l4.9 1.8 1.9 5.6c.2.7 1.1.9 1.6.3l2.6-2.9 4.6 3.4c.6.4 1.4.1 1.5-.6L22.8 4.3c.2-.8-.6-1.4-1.3-1.1zM9.9 13.3l7.6-5.3-5.800 6.500-.3 3.300z" />
  </svg>
);

export function ViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    track("product_view", { product_id: productId });
  }, [productId]);
  return null;
}

export function RequestCta({ product, prefill, className = "" }: { product: Product; prefill: Omit<RequestPrefill, "click_id">; className?: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const ended = product.saleStatus === "ended";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const onClick = () => {
    const clickId = newClickId();
    track("request_click", { product_id: product.id, click_id: clickId });
    const url = buildRequestUrl(prefill, clickId);
    if (url) {
      track("gyeomsa_redirect", { product_id: product.id, click_id: clickId });
      window.location.href = url;
      return;
    }
    setOpen(true);
  };

  if (ended) {
    return (
      <button type="button" disabled className={`btn h-12 cursor-not-allowed bg-cream-deep px-5 text-[15px] text-mute ${className}`}>
        판매가 끝난 상품이에요
      </button>
    );
  }

  const rows: [string, string | undefined][] = [
    ["상품", prefill.name_ko],
    ["일본어 이름", prefill.name_ja],
    ["살 곳", prefill.place],
    ["일본 가격", prefill.price_jpy ? `${Number(prefill.price_jpy).toLocaleString("ko-KR")}엔` : "확인 필요"],
  ];

  return (
    <>
      <button type="button" onClick={onClick} className={`btn btn-primary h-12 px-5 text-[15px] ${className}`}>
        <Plane />
        일본 여행자에게 부탁하기
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid items-end sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="req-title">
          <button type="button" aria-label="닫기" className="absolute inset-0 bg-ink/45" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-[28px] bg-cream p-5 pb-[calc(20px+env(safe-area-inset-bottom))] sm:rounded-[28px]">
            <span className="absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2 -rotate-2 rounded-[2px] bg-butter" aria-hidden />
            {done ? (
              <div className="py-6 text-center">
                <p className="font-display text-[24px] text-ink">알림 신청을 받았어요</p>
                <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-ink-soft">
                  구매 부탁이 열리면 이 상품부터 알려 드릴게요. 그동안 마음에 드는 상품을 더 담아 두세요.
                </p>
                <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary mt-5 h-11 px-6 text-[14px]">
                  계속 구경하기
                </button>
              </div>
            ) : (
              <>
                <h2 id="req-title" className="font-display text-[23px] leading-snug text-ink">
                  일본 가는 사람에게
                  <br />
                  부탁하는 기능을 준비하고 있어요
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                  <b className="text-ink">겸사겸사</b>는 원래 일본에 가는 여행자가 가는 김에 대신 사다 주는 서비스예요. 열리면 아래 내용이 미리 채워진 부탁 글로
                  바로 이어져요.
                </p>
                <dl className="mt-4 space-y-1.5 rounded-2xl bg-white p-4 text-[13px]">
                  {rows.map(([k, v]) => (
                    <div key={k} className="flex gap-3">
                      <dt className="w-[72px] shrink-0 text-mute">{k}</dt>
                      <dd className="min-w-0 flex-1 font-medium text-ink">{v || "확인 필요"}</dd>
                    </div>
                  ))}
                </dl>
                <form
                  className="mt-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveNotify(product.id, email);
                    setDone(true);
                  }}
                >
                  <label htmlFor="notify-email" className="mb-1.5 block text-[13px] font-bold text-ink">
                    열리면 알려 드릴 이메일
                  </label>
                  <input
                    id="notify-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-12 w-full rounded-full border-[1.5px] border-line bg-white px-4 text-[15px] focus:border-coral focus:outline-none"
                  />
                  <p className="mt-2 text-[11px] leading-relaxed text-mute">
                    프로토타입이라 이메일은 이 기기에만 저장되고 어디로도 전송되지 않아요. 실제 서비스에서는 수집 동의를 받고 알림 용도로만 써요.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary h-12 px-5 text-[14px]">
                      나중에
                    </button>
                    <button type="submit" className="btn btn-primary h-12 flex-1 text-[15px]">
                      구매 부탁 출시 알림 받기
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export { gyeomsaReady };
