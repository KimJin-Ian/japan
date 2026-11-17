// 한국에서 널리 알려진 이름이 든 글인지 판정한다. 목록은 favorites.json (수집기 collector/curate.py 와 함께 쓴다).
import data from "./favorites.json";
import type { Product } from "./types";

const NEEDLES = (data.groups as string[][]).flat().map((x) => x.toLowerCase());

export const isFavorite = (p: Product) => {
  const hay = `${p.nameKo} ${p.nameJa} ${p.brand} ${p.character ?? ""}`.toLowerCase();
  return NEEDLES.some((n) => hay.includes(n));
};

/** 홈 맨 위에 고정한 글에 붙는 태그 (collector/curate.py 가 붙이고 뗀다) */
export const PIN_TAG = "홈고정";
