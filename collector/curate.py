"""홈 맨 위에 고정해 둘 글을 정한다. 수집·번역이 끝난 뒤에 실행한다.

수집할 때마다 홈 상단이 바뀌지 않도록, 한 번 올린 글은 아래 경우가 아니면 그대로 둔다.
  1. 판매·행사 기간이 끝났다(종료일이 지났다).
  2. 올린 지 14일이 넘었고, 대신 올릴 만한 새 글이 있다.
빈 자리는 한국에서 잘 알려진 이름(src/lib/favorites.json)이 들어 있고, 번역 단계에서도 추천으로 분류됐고, 사진이 있는 최신 글로 채운다.
같은 이름(예: 스누피)이 상단을 독차지하지 않게 이름 하나당 2개까지만 올린다.

고정 표시는 products.tags 의 '홈고정' 태그로 남긴다(화면은 이 태그가 붙은 글을 맨 위에 그린다).

실행:
  python collector/curate.py --dry-run
  python collector/curate.py            # SUPABASE_URL · SUPABASE_SECRET_KEY 필요
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone

PIN = "홈고정"
SLOTS = 8  # 홈 상단에 고정하는 글 수
STALE_DAYS = 14  # 이보다 오래 고정된 글은 새 글이 있으면 바꾼다
PER_NAME = 2  # 같은 이름으로 올리는 최대 개수

HERE = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(HERE, "..", "src", "lib", "favorites.json"), encoding="utf-8") as f:
    FAVORITES: list[list[str]] = json.load(f)["groups"]  # [[대표 이름, 다른 표기…], …]


def rest(method: str, path: str, body=None):
    url = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1/" + path
    key = os.environ["SUPABASE_SECRET_KEY"]
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Prefer": "return=minimal"}
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
    with urllib.request.urlopen(urllib.request.Request(url, data=data, method=method, headers=headers), timeout=60) as res:
        raw = res.read()
        return json.loads(raw) if raw else None


def favorite_name(p: dict) -> str | None:
    """글에 들어 있는 인기 이름(대표 표기). 없으면 None"""
    hay = f"{p['name_ko']} {p['name_ja']} {p['brand']} {p.get('character') or ''}".lower()
    for group in FAVORITES:
        if any(x.lower() in hay for x in group):
            return group[0]
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    today = (datetime.now(timezone.utc) + timedelta(hours=9)).date()  # 한국·일본 날짜
    cols = "id,slug,name_ko,name_ja,brand,character,category,tags,image_url,release_date,end_date,added_at,published_at,editor_pick"
    q = urllib.parse.urlencode({"select": cols, "image_url": "not.is.null", "order": "published_at.desc", "limit": 2000})
    rows = rest("GET", "products?" + q) or []

    def ended(p: dict) -> bool:
        return bool(p["end_date"]) and date.fromisoformat(p["end_date"]) < today

    def usable(p: dict) -> bool:
        return not ended(p) and "관심낮음" not in p["tags"] and "뉴스" not in p["tags"]

    pinned = [p for p in rows if PIN in p["tags"]]
    keep: list[dict] = []
    drop: list[tuple[dict, str]] = []
    for p in pinned:
        if ended(p):
            drop.append((p, "판매·행사 종료"))
        elif not usable(p) or favorite_name(p) is None:
            drop.append((p, "기준에서 벗어남"))
        else:
            keep.append(p)

    used: dict[str, int] = {}
    for p in keep:
        n = favorite_name(p)
        used[n] = used.get(n, 0) + 1

    # 새로 올릴 후보: 인기 이름이 있고 아직 고정되지 않은 최신 글. 세일·오픈 안내보다 상품·굿즈를 앞세운다
    def is_goods(p: dict) -> bool:
        return not any(w in p["name_ko"] for w in ("세일", "블랙프라이데이", "오픈", "휴업", "안내", "캠페인"))

    # 이름이 걸린 것만으로는 부족하다(호텔 뷔페 이름에 다른 낱말이 걸리는 식). 번역 단계에서도 '추천'으로 본 글만 올린다
    cands = [p for p in rows if PIN not in p["tags"] and usable(p) and favorite_name(p) and p["editor_pick"]]
    cands.sort(key=lambda p: (not is_goods(p), p["category"] not in ("character", "gacha", "stationery", "popup")))  # 안정 정렬: 최신순 유지

    def take() -> dict | None:
        for p in cands:
            n = favorite_name(p)
            if used.get(n, 0) < PER_NAME:
                cands.remove(p)
                used[n] = used.get(n, 0) + 1
                return p
        return None

    add: list[dict] = []
    while len(keep) + len(add) < SLOTS:
        p = take()
        if p is None:
            break
        add.append(p)

    # 오래 고정된 글은 바꿀 새 글이 있을 때만 내린다
    for p in sorted(keep, key=lambda p: p["added_at"]):
        if (today - date.fromisoformat(p["added_at"])).days <= STALE_DAYS:
            break
        n = favorite_name(p)
        used[n] -= 1
        new = take()
        if new is None:
            used[n] += 1
            break
        keep.remove(p)
        drop.append((p, f"고정 {STALE_DAYS}일 경과, 새 글로 교체"))
        add.append(new)

    for p, why in drop:
        print(f"내림 ({why}): {p['name_ko'][:40]}")
    for p in add:
        print(f"올림 [{favorite_name(p)}]: {p['name_ko'][:40]}")
    print(f"유지 {len(keep)}건 · 올림 {len(add)}건 · 내림 {len(drop)}건")
    if args.dry_run:
        return 0

    for p, _ in drop:
        rest("PATCH", f"products?id=eq.{p['id']}", {"tags": [t for t in p["tags"] if t != PIN]})
    for p in add:
        rest("PATCH", f"products?id=eq.{p['id']}", {"tags": p["tags"] + [PIN]})
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
