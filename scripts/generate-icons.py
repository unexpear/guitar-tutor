"""Generate the StandardTune app icon set.

The mark: a tuner gauge arc with the needle dead-centre (in tune), sitting
above three guitar strings. Same motif as the store feature graphic, so the
listing and the launcher read as one brand.

Run:  python scripts/generate-icons.py
Writes assets/icon.png, the three Android adaptive layers, the splash mark,
the web favicon, and a 512x512 copy for the Play listing.
"""

import math
import os

from PIL import Image, ImageDraw

# --- palette (matches constants/Colors.ts) ---
NAVY_TOP = (26, 26, 46)      # #1a1a2e
NAVY_BOTTOM = (15, 15, 35)   # #0f0f23
GREEN = (76, 175, 80)        # Colors.success
GREEN_LIGHT = (132, 218, 136)
TRACK = (72, 78, 112)        # muted slate for the inactive gauge
STRING = (176, 186, 220)

SS = 4  # supersample factor; everything is drawn at 4x then downscaled
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


def _draw_glyph(d, size, scale=1.0, mono=False):
    """Draw the gauge+needle+strings mark centred on a `size` square canvas."""
    cx, cy = size / 2, size / 2
    unit = size * scale

    green = (255, 255, 255) if mono else GREEN
    green_hi = (255, 255, 255) if mono else GREEN_LIGHT
    track = (255, 255, 255, 90) if mono else TRACK
    string_col = (255, 255, 255, 120) if mono else STRING

    # Gauge geometry: an arc opening upward, needle pointing to 12 o'clock.
    radius = unit * 0.30
    arc_w = unit * 0.055
    gauge_cy = cy + unit * 0.10          # sits above the strings
    box = [cx - radius, gauge_cy - radius, cx + radius, gauge_cy + radius]

    # inactive track (200deg -> 340deg, i.e. the top sweep)
    d.arc(box, 200, 340, fill=track, width=int(arc_w))
    # in-tune segment, centred on 270deg
    d.arc(box, 252, 288, fill=green, width=int(arc_w))

    # tick marks along the sweep
    for a in (205, 227, 249, 291, 313, 335):
        rad = math.radians(a)
        r0, r1 = radius - arc_w * 0.15, radius + arc_w * 0.55
        d.line(
            [
                (cx + r0 * math.cos(rad), gauge_cy + r0 * math.sin(rad)),
                (cx + r1 * math.cos(rad), gauge_cy + r1 * math.sin(rad)),
            ],
            fill=track,
            width=max(1, int(unit * 0.012)),
        )

    # needle: straight up from the pivot into the green segment
    needle_w = unit * 0.045
    needle_top = gauge_cy - radius - arc_w * 0.15
    d.rounded_rectangle(
        [cx - needle_w / 2, needle_top, cx + needle_w / 2, gauge_cy],
        radius=needle_w / 2,
        fill=green_hi,
    )

    # pivot
    pr = unit * 0.085
    d.ellipse([cx - pr, gauge_cy - pr, cx + pr, gauge_cy + pr], fill=green)
    ir = pr * 0.42
    if not mono:
        d.ellipse(
            [cx - ir, gauge_cy - ir, cx + ir, gauge_cy + ir], fill=NAVY_BOTTOM
        )

    # three strings falling away below the gauge, graded in weight
    top = gauge_cy + pr + unit * 0.05
    bottom = cy + unit * 0.46
    for dx, w in ((-unit * 0.13, 0.020), (0.0, 0.015), (unit * 0.13, 0.011)):
        sw = unit * w
        d.rounded_rectangle(
            [cx + dx - sw / 2, top, cx + dx + sw / 2, bottom],
            radius=sw / 2,
            fill=string_col,
        )


def glyph_layer(size, scale=1.0, mono=False):
    img = Image.new("RGBA", (size * SS, size * SS), (0, 0, 0, 0))
    _draw_glyph(ImageDraw.Draw(img), size * SS, scale, mono)
    return img.resize((size, size), Image.LANCZOS)


def navy_bg(size, gradient=True):
    img = Image.new("RGBA", (size, size), NAVY_BOTTOM + (255,))
    if gradient:
        d = ImageDraw.Draw(img)
        for y in range(size):
            t = y / max(1, size - 1)
            d.line(
                [(0, y), (size, y)],
                fill=tuple(
                    int(NAVY_TOP[i] + (NAVY_BOTTOM[i] - NAVY_TOP[i]) * t)
                    for i in range(3)
                )
                + (255,),
            )
    return img


def out(name):
    return os.path.join(ROOT, name)


def main():
    # Full-bleed icon (iOS + Expo default): glyph on the navy field.
    icon = navy_bg(1024)
    icon.alpha_composite(glyph_layer(1024, scale=0.92))
    icon.convert("RGB").save(out("assets/icon.png"))

    # Play Store listing icon.
    icon.convert("RGB").resize((512, 512), Image.LANCZOS).save(
        out("assets/play-store-icon-512.png")
    )

    # Android adaptive layers. The foreground keeps the mark inside the
    # guaranteed-visible inner circle (~66%), so launcher masks never clip it.
    glyph_layer(1024, scale=0.60).save(out("assets/android-icon-foreground.png"))
    navy_bg(1024).save(out("assets/android-icon-background.png"))
    glyph_layer(1024, scale=0.60, mono=True).save(
        out("assets/android-icon-monochrome.png")
    )

    # Splash mark (shown on app.json's splash background).
    glyph_layer(1024, scale=0.72).save(out("assets/splash-icon.png"))

    # Web favicon.
    icon.convert("RGB").resize((96, 96), Image.LANCZOS).save(out("assets/favicon.png"))

    for f in (
        "assets/icon.png",
        "assets/play-store-icon-512.png",
        "assets/android-icon-foreground.png",
        "assets/android-icon-background.png",
        "assets/android-icon-monochrome.png",
        "assets/splash-icon.png",
        "assets/favicon.png",
    ):
        im = Image.open(out(f))
        print(f"{f}: {im.size} {im.mode}")


if __name__ == "__main__":
    main()
