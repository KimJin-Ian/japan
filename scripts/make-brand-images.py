"""브라우저 탭 아이콘과 공유 썸네일(OG 이미지)을 그린다. 도형을 직접 그려서 만들며 외부 이미지는 쓰지 않는다.

실행: python scripts/make-brand-images.py
출력: src/app/icon.png (512) · src/app/apple-icon.png (180) · src/app/opengraph-image.png (1200x630)
글꼴: Windows 기본 글꼴(Noto Sans KR, Yu Gothic). 다른 환경에서는 FONT_KR / FONT_JA 경로를 바꾼다.
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "app")
FONT_KR = "C:/Windows/Fonts/NotoSansKR-VF.ttf"
FONT_JA = "C:/Windows/Fonts/YuGothB.ttc"

CREAM, CREAM_DEEP = "#fffaf2", "#f8efe0"
INK, INK_SOFT = "#3a3331", "#6b615d"
CORAL, CORAL_DEEP = "#e76d72", "#c4444c"
PINK, BUTTER, MINT, SKY, SKY_DEEP = "#ffdfe3", "#ffe6a3", "#d6f2e6", "#dcecfb", "#8fb4dd"


def kr(size: int, weight: int = 900) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(FONT_KR, size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def ja(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_JA, size)


def fuji(d: ImageDraw.ImageDraw, cx: float, base: float, w: float, h: float, body: str, snow: str) -> None:
    """후지산: 꼭대기가 살짝 평평한 사다리꼴 + 지그재그 눈"""
    top = w * 0.11
    d.polygon([(cx - w / 2, base), (cx - top, base - h), (cx + top, base - h), (cx + w / 2, base)], fill=body)
    sh = h * 0.34  # 눈 덮인 높이
    k = (w / 2 - top) / h  # 비탈 기울기
    left, right = cx - top - k * sh, cx + top + k * sh
    zig = [(left, base - h + sh)]
    n = 5
    for i in range(1, n * 2):
        x = left + (right - left) * i / (n * 2)
        zig.append((x, base - h + sh + (sh * 0.28 if i % 2 else -sh * 0.12)))
    zig.append((right, base - h + sh))
    d.polygon([(cx - top, base - h), (cx + top, base - h)] + zig[::-1], fill=snow)


def mark(size: int) -> Image.Image:
    """로고 마크: 코랄 바탕, 버터색 해, 흰 후지산"""
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=s * 0.23, fill=CORAL)
    r = s * 0.15
    d.ellipse([s * 0.70 - r, s * 0.27 - r, s * 0.70 + r, s * 0.27 + r], fill=BUTTER)
    fuji(d, s * 0.45, s * 0.80, s * 0.72, s * 0.40, "#ffffff", "#ffffff")
    d.rounded_rectangle([s * 0.10, s * 0.78, s * 0.84, s * 0.84], radius=s * 0.03, fill="#ffffff")
    return img.resize((size, size), Image.LANCZOS)


def seigaiha(d: ImageDraw.ImageDraw, x0: float, y0: float, x1: float, y1: float, r: float, line: str, width: int) -> None:
    """청해파(青海波) 무늬: 겹친 반원 물결"""
    row = 0
    y = y1 + r
    while y > y0 - r:
        x = x0 - r + (r if row % 2 else 0)
        while x < x1 + r:
            for k in (1.0, 0.68, 0.36):
                rr = r * k
                d.arc([x - rr, y - rr, x + rr, y + rr], 180, 360, fill=line, width=width)
            x += 2 * r
        y -= r * 0.5
        row += 1


def og() -> Image.Image:
    W, H, S = 1200, 630, 2
    img = Image.new("RGB", (W * S, H * S), CREAM)
    d = ImageDraw.Draw(img)
    u = lambda v: v * S

    # 포장지 같은 은은한 도트
    for yy in range(0, H, 22):
        for xx in range(0, W, 22):
            d.ellipse([u(xx + 10) - 2, u(yy + 10) - 2, u(xx + 10) + 2, u(yy + 10) + 2], fill="#fbe3dc")

    # 오른쪽 그림: 해 · 후지산 · 물결
    cx, base = 955, 470
    d.ellipse([u(cx - 135), u(132), u(cx + 135), u(402)], fill=CORAL)
    fuji(d, u(cx - 5), u(base), u(430), u(240), SKY_DEEP, "#ffffff")
    wave = Image.new("RGB", img.size, BUTTER)
    wd = ImageDraw.Draw(wave)
    seigaiha(wd, u(700), u(base - 6), u(W), u(H), u(46), "#f3cf63", 5)
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([u(716), u(base - 6), u(W + 60), u(H + 60)], radius=u(38), fill=255)
    img.paste(wave, (0, 0), mask)
    d = ImageDraw.Draw(img)
    # 반짝임
    for sx, sy, sr in [(770, 150, 13), (1130, 110, 9), (1150, 330, 11), (748, 360, 8)]:
        d.polygon([(u(sx), u(sy - sr)), (u(sx + sr * 0.28), u(sy - sr * 0.28)), (u(sx + sr), u(sy)), (u(sx + sr * 0.28), u(sy + sr * 0.28)),
                   (u(sx), u(sy + sr)), (u(sx - sr * 0.28), u(sy + sr * 0.28)), (u(sx - sr), u(sy)), (u(sx - sr * 0.28), u(sy - sr * 0.28))], fill="#f3cf63")

    # 왼쪽: 로고 · 문구
    m = mark(u(76))
    img.paste(m, (u(72), u(70)), m)
    d.text((u(166), u(84)), "JAPAN", font=kr(u(40)), fill=INK)
    wj = d.textlength("JAPAN ", font=kr(u(40)))
    d.text((u(166) + wj, u(84)), "FINDS", font=kr(u(40)), fill=CORAL_DEEP)

    d.text((u(74), u(208)), "日本でしか出会えないもの", font=ja(u(25)), fill=CORAL_DEEP)

    h1 = kr(u(70))
    line2 = "특별한 상품들"
    w2 = d.textlength(line2, font=h1)
    # 마스킹테이프
    tape = Image.new("RGBA", (int(w2 + u(44)), u(40)), (0, 0, 0, 0))
    ImageDraw.Draw(tape).rounded_rectangle([0, 0, tape.width - 1, tape.height - 1], radius=u(4), fill=PINK)
    tape = tape.rotate(-1.4, expand=True, resample=Image.BICUBIC)
    img.paste(tape, (u(60), u(398)), tape)
    d = ImageDraw.Draw(img)
    d.text((u(72), u(258)), "일본에서만 만날 수 있는", font=h1, fill=INK)
    d.text((u(72), u(350)), line2, font=h1, fill=INK)

    # 스티커 배지
    x = u(74)
    for label, bg, fg in [("한정", CORAL, "#ffffff"), ("팝업스토어", MINT, "#2f7d62"), ("콜라보", "#ebe2f8", "#6a4a9c"), ("신상품", BUTTER, "#7a5c0a")]:
        f = kr(u(25), 700)
        tw = d.textlength(label, font=f)
        d.rounded_rectangle([x, u(498), x + tw + u(40), u(548)], radius=u(25), fill=bg)
        d.text((x + u(20), u(504)), label, font=f, fill=fg)
        x += tw + u(52)

    return img.resize((W, H), Image.LANCZOS)


if __name__ == "__main__":
    mark(512).save(os.path.join(OUT, "icon.png"))
    bg = Image.new("RGB", (180, 180), CORAL)  # iOS 는 모서리를 직접 깎으므로 꽉 채운다
    big = mark(180)
    bg.paste(big, (0, 0), big)
    bg.save(os.path.join(OUT, "apple-icon.png"))
    og().save(os.path.join(OUT, "opengraph-image.png"), optimize=True)
    print("저장:", OUT)
