"""Prepare palette-locked action, HUD and cursor art for the A9 review pack."""

import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter
from bar_art import action_icon
from hud_art import hud_icon


BATCH = Path(__file__).resolve().parent
ART = BATCH.parents[1]
OUTPUT = BATCH / "candidate" / "ui"
SAMPLE = ART / "inbox" / "A9-sample-r1"
SAMPLE_CHECKS = json.loads((SAMPLE / "pack-checks.json").read_text())
ITEMS = json.loads((ART / "manifest.json").read_text())["ui"]["items"]
PALETTE = [
    tuple(bytes.fromhex(color.removeprefix("#")))
    for color in json.loads((ART / "palette.json").read_text())
]
GROUPS = {"icon_bar", "icon_hud", "cursor"}


def prepare_icon(source, size):
    with Image.open(source) as raw:
        image = raw.convert("RGBA")
    alpha = image.getchannel("A").point(lambda opacity: 255 if opacity >= 128 else 0)
    bounds = alpha.getbbox()
    if not bounds or bounds == (0, 0, *image.size):
        raise ValueError(f"{source} needs an isolated icon with transparent margins")
    display_size = size // 2
    subject_size = 36 if size == 96 else 19
    image = image.crop(bounds)
    image.thumbnail((subject_size, subject_size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (display_size, display_size))
    canvas.paste(image, ((display_size - image.width) // 2, (display_size - image.height) // 2))
    canvas.putdata([
        (*min(PALETTE, key=lambda color: sum((a - b) ** 2 for a, b in zip(color, rgba))), 255)
        if rgba[3] >= 128 else (0, 0, 0, 0)
        for rgba in canvas.get_flattened_data()
    ])
    return canvas.resize((size, size), Image.Resampling.NEAREST)


def cursor(name):
    """Draw precise 1x shapes. Select has a tip at (6,3); the others aim at (16,16)."""
    image = Image.new("RGBA", (32, 32))
    fill = Image.new("L", image.size)
    draw = ImageDraw.Draw(fill)
    highlight = "#d9d9cb"
    edge = "#24272a"

    if name == "cursor_select":
        # The fill is inset one pixel from the point so the outer edge hits the hotspot.
        draw.polygon([(6,4), (20,14), (14,15), (18,23), (15,25), (10,17), (6,21)], fill=255)
    elif name == "cursor_attack":
        highlight = "#c88b76"
        draw.ellipse((8,8,24,24), outline=255, width=2)
        for box in [(15,4,17,11), (15,21,17,28), (4,15,11,17), (21,15,28,17)]:
            draw.rectangle(box, fill=255)
        draw.point((16,16), fill=255)
    elif name == "cursor_use":
        highlight = "#e0c7a1"
        draw.polygon([(16,7), (18,7), (19,9), (19,14), (21,13), (24,15), (25,17),
                      (24,22), (21,25), (14,25), (9,19), (8,16), (10,15), (14,18),
                      (15,17), (15,9)], fill=255)
    elif name == "cursor_move":
        up = [(16,4), (21,10), (18,10), (18,13), (14,13), (14,10), (11,10)]
        for points in [up, [(32-x,32-y) for x,y in up], [(y,x) for x,y in up],
                       [(32-y,x) for x,y in up]]:
            draw.polygon(points, fill=255)
        draw.rectangle((15,15,17,17), fill=255)
    elif name == "cursor_run":
        for x in (6, 16):
            draw.polygon([(x,9), (x+4,9), (x+11,16), (x+4,23), (x,23), (x+6,16)], fill=255)
    else:
        raise ValueError(f"Unknown cursor art key {name}")

    image.paste(edge, (0, 0, *image.size), fill.filter(ImageFilter.MaxFilter(3)))
    image.paste(highlight, (0, 0, *image.size), fill)
    return image


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, item in ITEMS.items():
        if item["group"] not in GROUPS:
            continue
        filename = f"{name}.png"
        path = OUTPUT / filename
        if name in SAMPLE_CHECKS:
            source = SAMPLE / "candidate" / "ui" / filename
            assert hashlib.sha256(source.read_bytes()).hexdigest() == SAMPLE_CHECKS[name]["sha256"], name
            shutil.copyfile(source, path)
        elif item["group"] == "cursor":
            cursor(name).save(path)
        elif item["group"] == "icon_hud":
            hud_icon(name.removeprefix("icon_hud_")).save(path)
        elif name in {"icon_bar_cook", "icon_bar_spike", "icon_bar_can"}:
            action_icon(name.removeprefix("icon_bar_")).save(path)
        else:
            prepare_icon(BATCH / "sources" / filename, item["size"][0]).save(path)
