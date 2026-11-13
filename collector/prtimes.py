"""PR TIMES 공식 RSS에서 한정·팝업·콜라보 보도자료 후보를 모아 Supabase product_candidates 에 넣는다.

- 공식 RSS(https://prtimes.jp/index.rdf)만 읽는다. 기사 본문·이미지는 가져오지 않는다.
- 제목과 요약 발췌(300자)만 저장한다. 게시 여부는 관리자가 /admin 에서 결정한다.
- 같은 주소는 한 번만 들어간다(source_url_hash 유니크).
- 실패하면 지수 백오프로 재시도하고 collection_logs 에 결과를 남긴다.

실행:
  python collector/prtimes.py --dry-run     # DB에 쓰지 않고 걸린 항목만 출력
  python collector/prtimes.py               # SUPABASE_URL · SUPABASE_SECRET_KEY 필요
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

FEED_URL = "https://prtimes.jp/index.rdf"
USER_AGENT = "japan-finds-collector/0.1 (RSS reader)"
TARGET = "PR TIMES RSS · 키워드 限定/ポップアップ/コラボ"

# 제목이나 요약에 하나라도 있으면 후보로 본다
KEYWORDS = ["日本限定", "店舗限定", "地域限定", "期間限定", "数量限定", "限定", "ポップアップ", "POP UP", "POPUP", "コラボ", "新商品", "ご当地"]
# 소비자 상품이 아닌 보도자료를 거르는 말 (제목 기준)
EXCLUDE = ["セミナー", "ウェビナー", "採用", "決算", "資金調達", "業務提携", "導入事例", "調査結果", "法人向け", "キャンペーンコード", "不動産", "投資"]

NS = {"rss": "http://purl.org/rss/1.0/", "dc": "http://purl.org/dc/elements/1.1/"}


def fetch(url: str, retries: int = 3) -> tuple[bytes, int]:
    """(본문, 재시도 횟수). 실패하면 마지막 예외를 던진다."""
    last: Exception | None = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=30) as res:
                return res.read(), attempt
        except (urllib.error.URLError, TimeoutError) as e:  # HTTPError 포함
            last = e
            if attempt < retries:
                time.sleep(2 ** attempt * 5)  # 5초, 10초, 20초
    raise RuntimeError(f"{url} 를 {retries}회 재시도 후에도 받지 못함: {last}")


def parse(xml: bytes) -> list[dict]:
    root = ET.fromstring(xml)
    items = []
    for it in root.findall("rss:item", NS):
        text = lambda tag: (it.findtext(tag, default="", namespaces=NS) or "").strip()
        items.append({"title": text("rss:title"), "link": text("rss:link"), "summary": text("rss:description"), "date": text("dc:date"), "company": text("dc:corp") or text("dc:creator")})
    return items


def matched_keywords(item: dict) -> list[str]:
    if any(x in item["title"] for x in EXCLUDE):
        return []
    hay = f'{item["title"]} {item["summary"]}'
    hits = [k for k in KEYWORDS if k in hay]
    # '新商品'만 걸린 것은 범위가 너무 넓어 제외한다
    return [] if hits == ["新商品"] else hits


def supabase(method: str, path: str, body, prefer: str = "return=minimal"):
    url = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1/" + path
    key = os.environ["SUPABASE_SECRET_KEY"]
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        method=method,
        headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json", "Prefer": prefer},
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        raw = res.read()
        return json.loads(raw) if raw else None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="DB에 쓰지 않고 결과만 출력")
    args = ap.parse_args()

    started = datetime.now(timezone.utc).isoformat()
    log = {"target": TARGET, "method": "rss", "started_at": started, "ok": False, "found": 0, "added": 0, "retries": 0, "error": None}
    rows: list[dict] = []
    try:
        xml, log["retries"] = fetch(FEED_URL)
        items = parse(xml)
        log["found"] = len(items)
        for it in items:
            hits = matched_keywords(it)
            if hits and it["link"].startswith("https://prtimes.jp/"):
                rows.append({
                    "raw_title_ja": it["title"],
                    "raw_excerpt_ja": it["summary"][:300],
                    "source_name": "PR TIMES RSS" + (f' · {it["company"]}' if it["company"] else ""),
                    "source_url": it["link"],
                    "collected_at": started,
                    "ai": {"matchedKeywords": hits, "publishedAt": it["date"]},
                })
        log["ok"] = True
    except Exception as e:  # 수집 실패도 로그로 남긴다
        log["error"] = str(e)[:500]

    if args.dry_run:
        dates = sorted(i["date"] for i in items) if log["ok"] else []
        print(f"피드 {log['found']}건 ({dates[0] if dates else '-'} ~ {dates[-1] if dates else '-'}) · 후보 {len(rows)}건 · 재시도 {log['retries']}회 · 오류 {log['error']}")
        for r in rows:
            print(f"- [{'/'.join(r['ai']['matchedKeywords'])}] {r['raw_title_ja'][:70]}")
        return 0 if log["ok"] else 1

    saved = supabase("POST", "collection_logs", log, prefer="return=representation")
    log_id = saved[0]["id"]
    added = 0
    if rows:
        for r in rows:
            r["collection_log_id"] = log_id
        # 이미 있는 주소는 건너뛴다
        inserted = supabase("POST", "product_candidates?on_conflict=source_url_hash", rows, prefer="resolution=ignore-duplicates,return=representation")
        added = len(inserted or [])
    supabase("PATCH", f"collection_logs?id=eq.{log_id}", {"added": added, "finished_at": datetime.now(timezone.utc).isoformat()})
    print(f"피드 {log['found']}건 · 후보 {len(rows)}건 · 새로 저장 {added}건 · 오류 {log['error']}")
    return 0 if log["ok"] else 1


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
