"use client";
import { toggleSaved, useSaved } from "@/lib/client-store";

const Heart = ({ on }: { on: boolean }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
    <path
      d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"
      fill={on ? "#f0705f" : "#fff"}
      stroke={on ? "#f0705f" : "#9a8f89"}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

/** 카드 모서리의 동그란 하트 */
export function SaveHeart({ id, name }: { id: string; name: string }) {
  const on = useSaved().some((s) => s.id === id);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `${name} 관심 상품에서 빼기` : `${name} 관심 상품에 담기`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSaved(id);
      }}
      className="btn absolute right-2 top-2 z-10 h-10 w-10 bg-white/95 shadow-[0_2px_6px_rgb(120_90_70/0.18)]"
    >
      <Heart on={on} />
    </button>
  );
}

/** 상세 화면의 큰 저장 버튼 */
export function SaveButton({ id, className = "" }: { id: string; className?: string }) {
  const on = useSaved().some((s) => s.id === id);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => toggleSaved(id)}
      className={`btn btn-secondary h-12 px-4 text-sm ${on ? "border-coral/50 bg-pink/40" : ""} ${className}`}
    >
      <Heart on={on} />
      {on ? "담았어요" : "담기"}
    </button>
  );
}

export function SavedCount() {
  const n = useSaved().length;
  if (n === 0) return null;
  return (
    <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
      {n}
    </span>
  );
}
