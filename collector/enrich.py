"""PR TIMES 후보의 원문 페이지를 열어 본문과 대표 이미지 주소를 채운다.

뉴스 사이트맵에는 제목만 있어서, 가격·판매 매장·날짜·상품 구성 같은 내용은 원문을 읽어야 알 수 있다.
  - 본문 글자는 Claude 가 한국어로 다시 정리하는 데만 쓴다(최대 6000자 저장). 화면에 원문을 그대로 싣지 않는다.
  - 이미지는 페이지가 링크 미리보기용으로 내놓는 대표 이미지(og:image) 주소 하나만 저장한다.
    파일을 내려받거나 잘라서 다시 올리지 않는다.
  - 한 번에 3개씩, 요청 사이에 쉬어 가며 읽는다. 실패한 글은 건너뛰고 다음 실행에서 다시 시도한다.

실행:
  python collector/enrich.py --dry-run
  python collector/enrich.py            # SUPABASE_URL · SUPABASE_SECRET_KEY 필요
환경변수: ENRICH_LIMIT (기본 3000)
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
from concurrent.futures import ThreadPoolExecutor

USER_AGENT = "japan-finds-collector/0.3 (daily reader)"
LIMIT = int(os.environ.get("ENRICH_LIMIT", "3000"))
WORKERS = 3
PAUSE = 0.4  # 요청 하나를 끝낸 뒤 쉬는 시간(초)


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


def extract(page: str) -> tuple[str | None, str | None]:
    """(본문 글자, 대표 이미지 주소)"""
    m = re.search(r'<meta[^>]+property="og:image"[^>]+content="(https://[^"]+)"', page)
    image = html.unescape(m.group(1)) if m else None
    if image and re.search(r"(ogp|default|common|logo)", image.rsplit("/", 1)[-1], re.I):
        image = None  # 사이트 공통 이미지는 쓰지 않는다

    start = page.find('id="press-release-body"')
    text = None
    if start >= 0:
        end = page.find('id="js-press-release-image-list"', start)
        chunk = page[start : end if end > start else start + 120_000]
        chunk = re.sub(r"<(script|style)\b[\s\S]*?</\1>", " ", chunk)
        chunk = re.sub(r"<br\s*/?>|</p>|</div>|</li>|</h\d>|</tr>", "\n", chunk)
        chunk = html.unescape(re.sub(r"<[^>]+>", " ", chunk.split(">", 1)[-1]))
        lines = [re.sub(r"[ \t　]+", " ", ln).strip() for ln in chunk.split("\n")]
        text = "\n".join(ln for ln in lines if ln)[:6000] or None
    return text, image


def fetch_one(c: dict) -> tuple[dict, str | None, str | None, str | None]:
    try:
        req = urllib.request.Request(c["source_url"], headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=30) as res:
            page = res.read().decode("utf-8", "ignore")
        text, image = extract(page)
        return c, text, image, None
    except (urllib.error.URLError, TimeoutError, ValueError) as e:
        return c, None, None, str(e)[:120]
    finally:
        time.sleep(PAUSE)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    cands: list[dict] = []
    while len(cands) < LIMIT:
        page = rest(
            "GET",
            "product_candidates?select=id,source_url,ai&source_name=like.PR%20TIMES*&ai_analyzed_at=is.null&review_status=eq.pending"
            f"&ai->>enriched=is.null&order=collected_at.desc,id.asc&limit={min(1000, LIMIT - len(cands))}&offset={len(cands)}",
        ) or []
        cands += page
        if len(page) < 1000:
            break
    print(f"원문을 읽을 PR TIMES 후보 {len(cands)}건")
    if args.dry_run or not cands:
        return 0

    ok = with_image = failed = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        for i, (c, text, image, err) in enumerate(pool.map(fetch_one, cands), 1):
            if err:
                failed += 1
                continue
            ai = {**(c.get("ai") or {}), "enriched": True}
            if image:
                ai["imageUrl"] = image
                with_image += 1
            patch: dict = {"ai": ai}
            if text:
                patch["raw_excerpt_ja"] = text
            rest("PATCH", f"product_candidates?id=eq.{c['id']}", patch)
            ok += 1
            if i % 200 == 0:
                print(f"   {i}/{len(cands)}")
    print(f"완료: 본문 {ok}건 · 대표 이미지 {with_image}건 · 실패 {failed}건(다음 실행에서 다시)")
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
