"""Prepare the five A8 review frames from the generated material sheet."""

import json
from pathlib import Path
from statistics import median

from PIL import Image, ImageColor


BATCH = Path(__file__).resolve().parent
ART = BATCH.parents[1]
OUT = BATCH / 'candidate' / BATCH.name / 'ui'
SIZE = 96
PALETTE = [ImageColor.getrgb(color) for color in json.loads((ART / 'palette.json').read_text())]


def snap(rgb):
    return min(PALETTE, key=lambda color: sum((a - b) ** 2 for a, b in zip(rgb, color)))


def make_tile(key, texture, treatment):
    image = Image.new('RGBA', (SIZE, SIZE))
    for y in range(SIZE):
        for x in range(SIZE):
            image.putpixel((x, y), (*snap(treatment(texture, x, y)), 255))
    image.save(OUT / f'{key}.png')


def normal(texture, x, y):
    return texture.getpixel((x, y))


def panel_finish(texture, x, y):
    # Keep the original stitches and wear in the fixed corners. A consistent
    # edge profile keeps the stitching from stretching into long dashes.
    in_x = 12 <= x < SIZE - 12
    in_y = 12 <= y < SIZE - 12
    if in_x and in_y:
        return ImageColor.getrgb('#302724')
    if not in_x and not in_y:
        return normal(texture, x, y)

    edge = min(x, SIZE - 1 - x) if in_y else min(y, SIZE - 1 - y)
    samples = [normal(texture, x, i) if in_y else normal(texture, i, y) for i in range(14, 82)]
    if edge == 1:
        return ImageColor.getrgb('#4b5358')
    if edge == 4:
        return ImageColor.getrgb('#5e4839')
    return tuple(median(channel) for channel in zip(*samples))


def hover(texture, x, y):
    # Lift the rim one palette step and leave the worn face almost unchanged.
    edge = min(x, y, SIZE - 1 - x, SIZE - 1 - y)
    lift = 22 if 1 <= edge <= 4 else 4
    return tuple(channel + lift for channel in normal(texture, x, y))


def pressed(texture, x, y):
    # Reverse the light on the bevel while keeping the face's scratches in place.
    if min(x, y, SIZE - 1 - x, SIZE - 1 - y) < 5:
        return tuple(channel * 0.78 for channel in normal(texture, SIZE - 1 - x, SIZE - 1 - y))
    return tuple(channel * 0.80 for channel in normal(texture, x, y))


def disabled(texture, x, y):
    light = sum(normal(texture, x, y)) / 3
    gray = 35 + 0.18 * light
    return gray, gray + 1, gray + 1


sheet = Image.open(BATCH / 'source.png').convert('RGB')
panel = sheet.crop((58, 60, 831, 827)).resize((SIZE, SIZE), Image.Resampling.BOX)
button = sheet.crop((942, 60, 1716, 827)).resize((SIZE, SIZE), Image.Resampling.BOX)
OUT.mkdir(parents=True, exist_ok=True)
make_tile('kit_panel', panel, panel_finish)
for state in (normal, hover, pressed, disabled):
    make_tile(f'kit_button_{state.__name__}', button, state)
