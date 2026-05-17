from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parent.parent
BUILD_DIR = ROOT / "apps" / "desktop" / "build"
ICONSET_DIR = BUILD_DIR / "icon.iconset"
SOURCE_PNG = BUILD_DIR / "icon.png"
WINDOWS_ICO = BUILD_DIR / "icon.ico"
RESAMPLE_LANCZOS = getattr(getattr(Image, "Resampling", Image), "LANCZOS")


def ensure_dirs() -> None:
    BUILD_DIR.mkdir(parents=True, exist_ok=True)
    ICONSET_DIR.mkdir(parents=True, exist_ok=True)


def rounded_rect(draw: ImageDraw.ImageDraw, xy: tuple[float, float, float, float], radius: float, fill) -> None:
    left, top, right, bottom = xy
    radius = min(radius, (right - left) / 2, (bottom - top) / 2)

    draw.rectangle((left + radius, top, right - radius, bottom), fill=fill)
    draw.rectangle((left, top + radius, right, bottom - radius), fill=fill)
    draw.pieslice((left, top, left + radius * 2, top + radius * 2), 180, 270, fill=fill)
    draw.pieslice((right - radius * 2, top, right, top + radius * 2), 270, 360, fill=fill)
    draw.pieslice((left, bottom - radius * 2, left + radius * 2, bottom), 90, 180, fill=fill)
    draw.pieslice((right - radius * 2, bottom - radius * 2, right, bottom), 0, 90, fill=fill)


def make_base_icon(size: int = 1024) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    for y in range(size):
        t = y / max(size - 1, 1)
        r = int(12 + (32 - 12) * t)
        g = int(26 + (118 - 26) * t)
        b = int(43 + (162 - 43) * t)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    padding = size * 0.12
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    rounded_rect(
        shadow_draw,
        (padding, padding + size * 0.02, size - padding, size - padding + size * 0.02),
        radius=size * 0.18,
        fill=(7, 16, 27, 210),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(size * 0.035))
    image.alpha_composite(shadow)

    card = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    card_draw = ImageDraw.Draw(card)
    rounded_rect(
        card_draw,
        (padding, padding, size - padding, size - padding),
        radius=size * 0.18,
        fill=(245, 248, 252, 255),
    )

    # Top rail hinting at a workspace/browser shell.
    rail_height = size * 0.12
    rounded_rect(
        card_draw,
        (padding, padding, size - padding, padding + rail_height),
        radius=size * 0.18,
        fill=(225, 232, 240, 255),
    )

    dot_y = padding + rail_height * 0.5
    dot_r = size * 0.018
    dot_x = padding + size * 0.07
    dot_gap = size * 0.045
    for color in ((255, 95, 86, 255), (255, 189, 46, 255), (39, 201, 63, 255)):
        card_draw.ellipse((dot_x - dot_r, dot_y - dot_r, dot_x + dot_r, dot_y + dot_r), fill=color)
        dot_x += dot_gap

    # Stylized dock formed by two facing rails and a center bridge.
    inset = padding + size * 0.13
    outer_bottom = size - padding - size * 0.12
    inner_top = padding + rail_height + size * 0.09
    rail_width = size * 0.12
    bridge_width = size * 0.14
    radius = size * 0.09
    teal = (16, 150, 175, 255)
    navy = (15, 23, 42, 255)

    left_points = [
        (inset + rail_width, inner_top),
        (inset, inner_top),
        (inset, outer_bottom),
        (inset + rail_width, outer_bottom),
        (inset + rail_width, inner_top + size * 0.12),
        (inset + size * 0.26, inner_top + size * 0.27),
        (inset + size * 0.26, inner_top + size * 0.36),
        (inset + rail_width, inner_top + size * 0.22),
    ]
    right_anchor = size - inset
    right_points = [
        (right_anchor - rail_width, inner_top),
        (right_anchor, inner_top),
        (right_anchor, outer_bottom),
        (right_anchor - rail_width, outer_bottom),
        (right_anchor - rail_width, inner_top + size * 0.22),
        (right_anchor - size * 0.26, inner_top + size * 0.36),
        (right_anchor - size * 0.26, inner_top + size * 0.27),
        (right_anchor - rail_width, inner_top + size * 0.12),
    ]
    bridge_top = inner_top + size * 0.31
    bridge_bottom = bridge_top + size * 0.10
    bridge_left = size * 0.5 - bridge_width * 0.5
    bridge_right = size * 0.5 + bridge_width * 0.5

    card_draw.polygon(left_points, fill=teal)
    card_draw.polygon(right_points, fill=navy)
    rounded_rect(card_draw, (bridge_left, bridge_top, bridge_right, bridge_bottom), radius=radius, fill=(31, 41, 55, 255))

    highlight = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    highlight_draw = ImageDraw.Draw(highlight)
    highlight_draw.ellipse(
        (
            size * 0.2,
            size * 0.1,
            size * 0.85,
            size * 0.6,
        ),
        fill=(255, 255, 255, 45),
    )
    highlight = highlight.filter(ImageFilter.GaussianBlur(size * 0.04))
    card.alpha_composite(highlight)

    image.alpha_composite(card)
    return image


def save_iconset(base: Image.Image) -> None:
    iconset_sizes = {
        "icon_16x16.png": 16,
        "icon_16x16@2x.png": 32,
        "icon_32x32.png": 32,
        "icon_32x32@2x.png": 64,
        "icon_128x128.png": 128,
        "icon_128x128@2x.png": 256,
        "icon_256x256.png": 256,
        "icon_256x256@2x.png": 512,
        "icon_512x512.png": 512,
        "icon_512x512@2x.png": 1024,
    }

    for filename, size in iconset_sizes.items():
        resized = base.resize((size, size), RESAMPLE_LANCZOS)
        resized.save(ICONSET_DIR / filename)


def save_ico(base: Image.Image) -> None:
    base.save(
        WINDOWS_ICO,
        format="ICO",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )


def main() -> None:
    ensure_dirs()
    base = make_base_icon()
    base.save(SOURCE_PNG)
    save_ico(base)
    save_iconset(base)


if __name__ == "__main__":
    main()
