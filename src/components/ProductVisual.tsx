import type { Product, VisualMotif } from "@/lib/types";

// 데모 상품용 그림. 실제 상품 사진을 무단으로 쓰지 않기 위해 단순한 도형 일러스트로 대신한다.
// 운영에서는 사용권을 확인한 이미지(products.image_url, image_rights = 'press_ok' 등)만 보여 준다.

const TONES: Record<Product["visual"]["tone"], { bg: string; main: string; sub: string; line: string }> = {
  pink: { bg: "#ffe9ec", main: "#f7a8b4", sub: "#fff6f7", line: "#b9606f" },
  peach: { bg: "#ffeadb", main: "#f6b48f", sub: "#fff7f0", line: "#b06a45" },
  butter: { bg: "#fff4c9", main: "#f3cf63", sub: "#fffbea", line: "#9c7a1c" },
  mint: { bg: "#dff5ea", main: "#8fd3b3", sub: "#f3fbf7", line: "#3f8a6b" },
  sky: { bg: "#e2effc", main: "#9cc3ec", sub: "#f4f9fe", line: "#4a78a8" },
  lilac: { bg: "#efe7fa", main: "#c2a8e6", sub: "#f9f5fd", line: "#7658a6" },
};

type T = (typeof TONES)[keyof typeof TONES];

const face = (cx: number, cy: number, t: T) => (
  <g fill={t.line}>
    <circle cx={cx - 9} cy={cy} r="2.6" />
    <circle cx={cx + 9} cy={cy} r="2.6" />
    <path d={`M${cx - 4} ${cy + 6} q4 4 8 0`} fill="none" stroke={t.line} strokeWidth="2" strokeLinecap="round" />
    <circle cx={cx - 17} cy={cy + 7} r="4" fill="#ff9aa5" opacity=".55" />
    <circle cx={cx + 17} cy={cy + 7} r="4" fill="#ff9aa5" opacity=".55" />
  </g>
);

const MOTIFS: Record<VisualMotif, (t: T) => React.ReactNode> = {
  plush: (t) => (
    <g>
      <path d="M68 62 l8-20 14 14z M132 62 l-8-20-14 14z" fill={t.main} />
      <ellipse cx="100" cy="84" rx="38" ry="32" fill={t.sub} stroke={t.main} strokeWidth="4" />
      <ellipse cx="100" cy="138" rx="30" ry="26" fill={t.sub} stroke={t.main} strokeWidth="4" />
      <rect x="78" y="46" width="44" height="14" rx="5" fill={t.line} />
      <rect x="72" y="58" width="56" height="5" rx="2.5" fill={t.line} />
      {face(100, 86, t)}
    </g>
  ),
  keyring: (t) => (
    <g>
      <circle cx="100" cy="42" r="13" fill="none" stroke={t.line} strokeWidth="4" />
      <path d="M100 55 v16" stroke={t.line} strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="100" cy="112" rx="36" ry="40" fill={t.sub} stroke={t.main} strokeWidth="4" />
      <path d="M68 132 q32 16 64 0 v14 q-32 14-64 0z" fill="#f0705f" />
      {face(100, 106, t)}
    </g>
  ),
  capsule: (t) => (
    <g>
      <path d="M52 100 a48 48 0 0 1 96 0z" fill={t.sub} stroke={t.main} strokeWidth="4" />
      <path d="M52 100 a48 48 0 0 0 96 0z" fill={t.main} />
      <rect x="48" y="95" width="104" height="10" rx="5" fill={t.line} opacity=".85" />
      <path d="M74 76 q10-18 30-20" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <circle cx="118" cy="78" r="5" fill={t.main} />
    </g>
  ),
  figure: (t) => (
    <g>
      <circle cx="100" cy="66" r="24" fill={t.sub} stroke={t.main} strokeWidth="4" />
      <path d="M76 62 q24-34 48 0 q-10-8-24-8 t-24 8z" fill={t.main} />
      <path d="M78 150 l10-56 h24 l10 56z" fill={t.main} />
      <ellipse cx="100" cy="154" rx="40" ry="8" fill={t.line} opacity=".3" />
      <path d="M146 44 l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#f3cf63" />
      {face(100, 70, t)}
    </g>
  ),
  tote: (t) => (
    <g>
      <path d="M76 78 q0-34 24-34 t24 34" fill="none" stroke={t.line} strokeWidth="5" strokeLinecap="round" />
      <path d="M56 78 h88 l8 78 h-104z" fill={t.main} />
      <rect x="84" y="104" width="32" height="22" rx="4" fill={t.sub} />
      <path d="M60 86 h80" stroke={t.sub} strokeWidth="2" strokeDasharray="5 5" />
    </g>
  ),
  socks: (t) => (
    <g>
      <path d="M66 44 h30 v62 l26 20 q10 10 0 20 q-10 8-24 0 l-32-24z" fill={t.main} />
      <path d="M66 44 h30 v14 h-30z" fill={t.line} />
      <path d="M112 62 h28 v52 l18 16 q8 10-2 18 q-12 6-22-2 l-22-18z" fill={t.sub} stroke={t.main} strokeWidth="4" />
      <path d="M70 74 h22 M70 86 h22" stroke={t.sub} strokeWidth="3" strokeDasharray="4 4" />
    </g>
  ),
  tube: (t) => (
    <g>
      <rect x="84" y="36" width="32" height="22" rx="5" fill={t.line} />
      <path d="M74 58 h52 l-6 96 q-20 8-40 0z" fill={t.main} />
      <rect x="84" y="86" width="32" height="34" rx="6" fill={t.sub} />
      <circle cx="100" cy="103" r="8" fill="#f3cf63" />
    </g>
  ),
  jar: (t) => (
    <g>
      <rect x="60" y="56" width="80" height="22" rx="8" fill={t.line} />
      <rect x="52" y="78" width="96" height="70" rx="16" fill={t.main} />
      <rect x="68" y="96" width="64" height="32" rx="8" fill={t.sub} />
      <path d="M82 112 h36" stroke={t.main} strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  ink: (t) => (
    <g>
      <rect x="80" y="40" width="40" height="20" rx="4" fill={t.line} />
      <path d="M62 76 q0-14 14-14 h48 q14 0 14 14 v62 q0 14-14 14 h-48 q-14 0-14-14z" fill={t.sub} stroke={t.main} strokeWidth="4" />
      <path d="M66 104 h68 v34 q0 10-10 10 h-48 q-10 0-10-10z" fill={t.main} />
      <path d="M154 62 q10 14 0 20 q-10-6 0-20z" fill={t.main} />
    </g>
  ),
  notebook: (t) => (
    <g>
      <rect x="58" y="40" width="88" height="120" rx="8" fill={t.main} />
      <rect x="58" y="40" width="14" height="120" rx="6" fill={t.line} />
      <rect x="84" y="62" width="48" height="26" rx="5" fill={t.sub} />
      <path d="M84 108 h48 M84 122 h48 M84 136 h30" stroke={t.sub} strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  tape: (t) => (
    <g>
      <circle cx="92" cy="100" r="44" fill={t.main} />
      <circle cx="92" cy="100" r="20" fill={t.bg} stroke={t.sub} strokeWidth="6" />
      <path d="M92 144 h64 l-8 -12 8 -12 h-40" fill={t.main} opacity=".8" />
      <circle cx="70" cy="76" r="4" fill={t.sub} />
      <circle cx="118" cy="82" r="4" fill={t.sub} />
      <circle cx="74" cy="124" r="4" fill={t.sub} />
    </g>
  ),
  glass: (t) => (
    <g>
      <path d="M62 44 h76 l-8 112 h-60z" fill={t.sub} stroke={t.main} strokeWidth="4" />
      <path d="M66 96 h68 l-5 58 h-58z" fill={t.main} opacity=".55" />
      <path d="M74 154 l26-40 26 40z" fill="#fff" stroke={t.main} strokeWidth="3" />
      <path d="M92 126 l8-12 8 12 -4 -2 -4 3 -4 -3z" fill={t.main} />
    </g>
  ),
  towel: (t) => (
    <g>
      <rect x="52" y="58" width="96" height="30" rx="12" fill={t.main} />
      <rect x="52" y="86" width="96" height="30" rx="12" fill={t.sub} stroke={t.main} strokeWidth="4" />
      <rect x="52" y="114" width="96" height="30" rx="12" fill={t.main} />
      <rect x="116" y="120" width="20" height="14" rx="3" fill={t.sub} />
    </g>
  ),
  sweets: (t) => (
    <g>
      <rect x="46" y="74" width="108" height="72" rx="12" fill={t.main} />
      <rect x="46" y="74" width="108" height="20" rx="10" fill={t.line} opacity=".85" />
      <circle cx="78" cy="122" r="14" fill={t.sub} />
      <circle cx="122" cy="122" r="14" fill={t.sub} />
      <path d="M100 74 v-14 q-14-16-20-4 q-2 12 20 18 q22-6 20-18 q-6-12-20 4" fill="none" stroke="#f0705f" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  stand: (t) => (
    <g>
      <path d="M70 46 h60 q10 0 10 10 v76 h-80 v-76 q0-10 10-10z" fill={t.sub} stroke={t.main} strokeWidth="4" />
      <ellipse cx="100" cy="94" rx="24" ry="26" fill={t.main} />
      <path d="M82 76 l4-12 10 8z M118 76 l-4-12-10 8z" fill={t.main} />
      <rect x="50" y="134" width="100" height="14" rx="7" fill={t.line} opacity=".8" />
      {face(100, 94, { ...t, line: "#fff" })}
    </g>
  ),
  tee: (t) => (
    <g>
      <path d="M72 46 l-34 20 14 26 16-8 v70 h64 v-70 l16 8 14-26-34-20 q-28 18-56 0z" fill={t.main} />
      <path d="M100 96 l4 10 10 1-8 7 3 10-9-6-9 6 3-10-8-7 10-1z" fill={t.sub} />
    </g>
  ),
};

/** 카테고리 아이콘 등 작은 장식용 */
export function MotifIcon({ motif, tone, className = "" }: { motif: VisualMotif; tone: Product["visual"]["tone"]; className?: string }) {
  const t = TONES[tone];
  return (
    <span className={`block overflow-hidden ${className}`} style={{ background: t.bg }} aria-hidden>
      <svg viewBox="0 0 200 200" className="h-full w-full">
        {MOTIFS[motif](t)}
      </svg>
    </span>
  );
}

export function ProductVisual({ product, className = "" }: { product: Product; className?: string }) {
  const t = TONES[product.visual.tone];
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: t.bg }}>
      <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label={`${product.nameKo} 예시 그림`}>
        <circle cx="34" cy="38" r="3" fill={t.main} opacity=".6" />
        <circle cx="170" cy="150" r="4" fill={t.main} opacity=".5" />
        <path d="M168 34 l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#fff" />
        <path d="M30 160 l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z" fill="#fff" />
        {MOTIFS[product.visual.motif](t)}
      </svg>
      {product.isDemo && (
        <span className="absolute bottom-2 right-2 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold text-ink-soft">
          데모 그림
        </span>
      )}
    </div>
  );
}
