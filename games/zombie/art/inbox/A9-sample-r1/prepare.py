"""Prepare the four A9 review textures from their transparent source images."""

import json
from pathlib import Path

from PIL import Image


BATCH = Path(__file__).resolve().parent
KEYS = ("knife", "gun", "crouch", "fix")
PALETTE = [
    tuple(bytes.fromhex(color.removeprefix("#")))
    for color in json.loads((BATCH.parents[1] / "palette.json").read_text())
]


def pixel_icon(path):
    with Image.open(path) as source:
        image = source.convert("RGBA")
    alpha = image.getchannel("A").point(lambda opacity: 255 if opacity >= 128 else 0)
    bounds = alpha.getbbox()
    if not bounds or bounds == (0, 0, *image.size):
        raise ValueError(f"Expected an isolated icon with transparent margins in {path}")
    image = image.crop(bounds)
    image.thumbnail((36, 36), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (48, 48))
    canvas.paste(image, ((48 - image.width) // 2, (48 - image.height) // 2))
    canvas.putdata([
        (*min(PALETTE, key=lambda color: sum((a - b) ** 2 for a, b in zip(color, rgba))), 255)
        if rgba[3] >= 128 else (0, 0, 0, 0)
        for rgba in canvas.get_flattened_data()
    ])
    return canvas.resize((96, 96), Image.Resampling.NEAREST)


output = BATCH / "candidate" / "ui"
output.mkdir(parents=True, exist_ok=True)
for key in KEYS:
    pixel_icon(BATCH / f"source-{key}.png").save(output / f"icon_bar_{key}.png")
