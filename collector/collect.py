"""JAPAN FINDS 수집기 — 하루 1회 실행.

읽는 곳(모두 키 없이 공개된 피드, docs/09_소스_실검증.md 기준. 아래 SOURCES 목록 참고):
  - 보도자료: PR TIMES 뉴스 사이트맵(하루치 전량), @Press, 세븐일레븐 뉴스릴리스
  - 브랜드 공식: 미피, 스누피타운숍, 스누피, 키탄클럽, 점프숍
  - 매체(2차 출처): GAME Watch, HOBBY Watch, アニメ！アニメ！, FASHIONSNAP, ホビージャパン, Walkerplus
  - Frankfurter 환율 API: JPY→KRW (전 영업일 ECB 기준)
  약관이 자동 수집을 금지하거나 robots.txt 가 막은 곳(포켓몬센터, 치이카와 마켓, 가샤폰,
  ファッションプレス, 電撃ホビーウェブ 등)은 넣지 않는다.

지키는 것:
  - 소스당 요청 1회. 기사 페이지는 열지 않는다. 제목과 짧은 발췌, 피드가 항목과 함께 주는 대표 이미지 주소만 저장한다.
    이미지 파일은 내려받거나 잘라서 다시 올리지 않고, 원래 주소를 그대로 가리킨다.
  - 후보는 product_candidates 에 '검수 대기'로 들어갈 뿐, 게시는 관리자가 결정한다.
  - 같은 주소는 한 번만 들어간다(source_url_hash 유니크).
  - 실패는 지수 백오프로 재시도하고, 소스마다 collection_logs 에 결과를 남긴다.
    한 소스가 실패해도 나머지는 계속 돈다.

실행:
  python collector/collect.py --dry-run          # DB에 쓰지 않고 결과만 출력
  python collector/collect.py                    # SUPABASE_URL · SUPABASE_SECRET_KEY 필요
  python collector/collect.py --only prtimes     # 한 소스만
"""
from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

USER_AGENT = "japan-finds-collector/0.2 (daily feed reader)"

# 제목·발췌에 하나라도 있으면 후보로 본다
KEYWORDS = ["日本限定", "店舗限定", "地域限定", "期間限定", "数量限定", "限定", "ポップアップ", "POP UP", "POPUP", "POP-UP", "コラボ", "ご当地"]
# 소비자 상품이 아닌 글을 거르는 말 (제목 기준)
EXCLUDE = [
    "セミナー", "ウェビナー", "採用", "決算", "資金調達", "業務提携", "導入事例", "調査結果", "法人向け", "不動産", "投資",
    "ブラックフライデー", "セール", "クーポン", "割引", "OFF", "無料", "宿泊", "プラン", "コース", "食べ放題", "ビュッフェ",
    "アプリ", "ゲーム内", "ガチャ開催", "配信開始", "事前登録", "NFT", "講座", "イベント開催", "ツアー", "求人",
]

NS = {
    "rss": "http://purl.org/rss/1.0/",
    "dc": "http://purl.org/dc/elements/1.1/",
    "sm": "http://www.sitemaps.org/schemas/sitemap/0.9",
    "news": "http://www.google.com/schemas/sitemap-news/0.9",
    "atom": "http://www.w3.org/2005/Atom",
}

SOURCES = [
    {"key": "prtimes", "name": "PR TIMES", "target": "PR TIMES 뉴스 사이트맵 · 키워드 限定/ポップアップ/コラボ", "url": "https://prtimes.jp/sitemap-news.xml"},
    {"key": "atpress", "name": "@Press", "target": "@Press 보도자료 RSS", "url": "https://www.atpress.ne.jp/rss/index.rdf"},
    {"key": "sej", "name": "세븐일레븐 뉴스릴리스", "target": "세븐일레븐 뉴스릴리스 RSS", "url": "https://www.sej.co.jp/rss/news_release.xml"},
    # 브랜드 공식 피드는 글 전체가 그 브랜드 소식이라 키워드로 거르지 않는다(all)
    {"key": "miffy", "name": "미피 공식", "target": "미피(dickbruna.jp) RSS", "url": "https://dickbruna.jp/feed/", "all": True},
    {"key": "snoopytown", "name": "스누피타운숍", "target": "스누피타운숍 RSS", "url": "https://town.snoopy.co.jp/feed", "all": True},
    {"key": "snoopy", "name": "스누피 공식", "target": "스누피 공식 RSS", "url": "https://www.snoopy.co.jp/feed/", "all": True},
    {"key": "kitan", "name": "키탄클럽", "target": "키탄클럽(가챠) RSS", "url": "https://kitan.jp/feed/", "all": True},
    {"key": "jumpshop", "name": "점프숍", "target": "점프숍 블로그 Atom", "url": "https://jumpshop-benelic.com/blogs/news.atom", "all": True},
    # 매체 피드(2차 출처)는 키워드에 걸린 글만
    {"key": "gamewatch", "name": "GAME Watch", "target": "GAME Watch RSS", "url": "https://game.watch.impress.co.jp/data/rss/1.0/gmw/feed.rdf", "no_image": True},
    {"key": "hobbywatch", "name": "HOBBY Watch", "target": "HOBBY Watch RSS", "url": "https://hobby.watch.impress.co.jp/data/rss/1.0/hbw/feed.rdf", "no_image": True},
    {"key": "animeanime", "name": "アニメ！アニメ！", "target": "アニメ！アニメ！ RSS", "url": "https://animeanime.jp/rss20/index.rdf"},
    {"key": "fashionsnap", "name": "FASHIONSNAP", "target": "FASHIONSNAP RSS", "url": "https://www.fashionsnap.com/rss.xml"},
    {"key": "hjweb", "name": "ホビージャパンウェブ", "target": "ホビージャパンウェブ RSS", "url": "https://hjweb.jp/feed/"},
    {"key": "walkerplus", "name": "Walkerplus", "target": "Walkerplus RSS", "url": "https://www.walkerplus.com/rss/"},
]
RATE_URL = "https://api.frankfurter.dev/v1/latest?base=JPY&symbols=KRW"


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def fetch(url: str, retries: int = 3) -> tuple[bytes, int]:
    """(본문, 재시도 횟수). 끝내 실패하면 예외."""
    last: Exception | None = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=60) as res:
                return res.read(), attempt
        except (urllib.error.URLError, TimeoutError) as e:
            last = e
            if attempt < retries:
                time.sleep(2 ** attempt * 5)  # 5초, 10초, 20초
    raise RuntimeError(f"{retries}회 재시도 후에도 받지 못함: {last}")


IMG_PATTERNS = [
    r'<(?:\w+:)?(?:content|thumbnail)\b[^>]*\burl="(https://[^"]+)"',  # media:content / media:thumbnail
    r'<enclosure\b[^>]*\burl="(https://[^"]+)"[^>]*type="image/',
    r'<enclosure\b[^>]*type="image/[^"]*"[^>]*\burl="(https://[^"]+)"',
    r'<img\b[^>]*\bsrc="(https://[^"]+)"',  # 본문 HTML 안 첫 이미지
]


def first_image(node: ET.Element) -> str | None:
    """피드 항목에 들어 있는 대표 이미지 주소. 피드가 주지 않으면 None (기사 페이지를 따로 열지 않는다)."""
    raw = html.unescape(ET.tostring(node, encoding="unicode"))
    for pat in IMG_PATTERNS:
        m = re.search(pat, raw)
        if m and not re.search(r"(spacer|pixel|blank|emoji|icon|logo)", m.group(1), re.I):
            return m.group(1)
    return None


def parse(xml: bytes) -> list[dict]:
    """피드 형식(뉴스 사이트맵 · RSS 1.0 · RSS 2.0 · Atom)을 알아서 가려 [{title, link, excerpt, date}] 로 맞춘다."""
    root = ET.fromstring(xml)
    tag = root.tag.rsplit("}", 1)[-1]
    fmt = {"urlset": "news_sitemap", "RDF": "rss1", "feed": "atom"}.get(tag, "rss2")
    out: list[dict] = []
    if fmt == "atom":
        for e in root.findall("atom:entry", NS):
            link = next((l.get("href", "") for l in e.findall("atom:link", NS) if l.get("rel", "alternate") == "alternate"), "")
            out.append({
                "title": (e.findtext("atom:title", "", NS) or "").strip(),
                "link": link.strip(),
                "excerpt": "",  # 본문(HTML)은 저장하지 않는다
                "date": (e.findtext("atom:published", "", NS) or e.findtext("atom:updated", "", NS) or "").strip(),
                "image": first_image(e),
            })
    elif fmt == "news_sitemap":
        for u in root.findall("sm:url", NS):
            n = u.find("news:news", NS)
            if n is None:
                continue
            out.append({
                "title": (n.findtext("news:title", "", NS) or "").strip(),
                "link": (u.findtext("sm:loc", "", NS) or "").strip(),
                "excerpt": (n.findtext("news:keywords", "", NS) or "").strip(),  # 발행사가 붙인 키워드
                "date": (n.findtext("news:publication_date", "", NS) or "").strip(),
            })
    elif fmt == "rss1":
        for it in root.findall("rss:item", NS):
            out.append({
                "title": (it.findtext("rss:title", "", NS) or "").strip(),
                "link": (it.findtext("rss:link", "", NS) or "").strip(),
                "excerpt": (it.findtext("rss:description", "", NS) or "").strip(),
                "date": (it.findtext("dc:date", "", NS) or "").strip(),
                "image": first_image(it),
            })
    else:  # rss2
        for it in root.iter("item"):
            out.append({
                "title": (it.findtext("title") or "").strip(),
                "link": (it.findtext("link") or "").strip(),
                "excerpt": (it.findtext("description") or "").strip(),
                "date": (it.findtext("pubDate") or "").strip(),
                "image": first_image(it),
            })
    return out


def matched_keywords(item: dict) -> list[str]:
    title = item["title"]
    if any(x in title for x in EXCLUDE):
        return []
    return [k for k in KEYWORDS if k in title]  # 제목에 있을 때만(발췌·키워드 칸은 잡음이 많다)


def supabase(method: str, path: str, body, prefer: str = "return=minimal"):
    url = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1/" + path
    key = os.environ["SUPABASE_SECRET_KEY"]
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        method=method,
        headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json", "Prefer": prefer},
    )
    with urllib.request.urlopen(req, timeout=60) as res:
        raw = res.read()
        return json.loads(raw) if raw else None


def collect_source(src: dict, dry: bool) -> bool:
    started = now()
    log = {"target": src["target"], "method": "rss", "started_at": started, "ok": False, "found": 0, "added": 0, "retries": 0, "error": None}
    rows: list[dict] = []
    try:
        xml, log["retries"] = fetch(src["url"])
        items = parse(xml)
        log["found"] = len(items)
        seen: set[str] = set()
        for it in items:
            hits = matched_keywords(it)
            if src.get("all") and it["title"]:
                hits = hits or ["공식 피드"]
            if not hits or not it["link"].startswith("https://") or it["link"] in seen:
                continue
            seen.add(it["link"])
            rows.append({
                "raw_title_ja": it["title"][:500],
                "raw_excerpt_ja": re.sub(r"<[^>]+>|\s+", " ", it["excerpt"]).strip()[:300] or None,
                "source_name": src["name"],
                "source_url": it["link"],
                "collected_at": started,
                "ai": {"matchedKeywords": hits, "publishedAt": it["date"], **({"imageUrl": it["image"]} if it.get("image") and not src.get("no_image") else {})},
            })
        log["ok"] = True
    except Exception as e:  # 실패도 로그로 남기고 다음 소스로 넘어간다
        log["error"] = str(e)[:500]

    if dry:
        print(f"[{src['key']}] 피드 {log['found']}건 · 후보 {len(rows)}건 · 재시도 {log['retries']}회 · 오류 {log['error']}")
        for r in rows[:6]:
            print(f"   - [{'/'.join(r['ai']['matchedKeywords'])}] {r['raw_title_ja'][:64]}")
        return log["ok"]

    log_id = supabase("POST", "collection_logs", log, prefer="return=representation")[0]["id"]
    added = 0
    for i in range(0, len(rows), 200):  # 한 번에 200행씩
        chunk = rows[i : i + 200]
        for r in chunk:
            r["collection_log_id"] = log_id
        inserted = supabase("POST", "product_candidates?on_conflict=source_url_hash", chunk, prefer="resolution=ignore-duplicates,return=representation")
        added += len(inserted or [])
    supabase("PATCH", f"collection_logs?id=eq.{log_id}", {"added": added, "finished_at": now()})
    print(f"[{src['key']}] 피드 {log['found']}건 · 후보 {len(rows)}건 · 새로 저장 {added}건 · 오류 {log['error']}")
    return log["ok"]


def collect_rate(dry: bool) -> bool:
    started = now()
    log = {"target": "환율 JPY→KRW · Frankfurter", "method": "api", "started_at": started, "ok": False, "found": 0, "added": 0, "retries": 0, "error": None}
    rate = date = None
    try:
        raw, log["retries"] = fetch(RATE_URL)
        data = json.loads(raw)
        rate, date = float(data["rates"]["KRW"]), data["date"]
        if not 3 < rate < 30:  # 1엔이 3~30원 범위를 벗어나면 잘못된 값으로 본다
            raise ValueError(f"환율 값이 이상함: {rate}")
        log["ok"], log["found"] = True, 1
    except Exception as e:
        log["error"] = str(e)[:500]

    if dry:
        print(f"[rate] 1 JPY = {rate} KRW (기준일 {date}) · 오류 {log['error']}")
        return log["ok"]

    if log["ok"]:
        supabase("POST", "exchange_rates", {"base": "JPY", "quote": "KRW", "rate": rate, "source": f"Frankfurter (유럽중앙은행 기준 {date})", "fetched_at": started})
        log["added"] = 1
    log["finished_at"] = now()
    supabase("POST", "collection_logs", log)
    print(f"[rate] 1 JPY = {rate} KRW (기준일 {date}) · 오류 {log['error']}")
    return log["ok"]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="DB에 쓰지 않고 결과만 출력")
    ap.add_argument("--only", help="이 key 의 소스만 실행 (예: prtimes, kitan, rate)")
    args = ap.parse_args()

    results: list[bool] = []
    for src in SOURCES:
        if args.only and args.only != src["key"]:
            continue
        results.append(collect_source(src, args.dry_run))
        time.sleep(2)  # 소스 사이 간격
    if not args.only or args.only == "rate":
        results.append(collect_rate(args.dry_run))

    failed = results.count(False)
    print(f"완료: {len(results)}개 중 실패 {failed}개")
    # 전부 실패했을 때만 워크플로를 실패로 표시한다(일부 실패는 로그에 남는다)
    return 1 if results and failed == len(results) else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
