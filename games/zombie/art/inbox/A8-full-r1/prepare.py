"""Extend the approved A8 sample with the remaining seven kit frames."""

import hashlib
import json
from pathlib import Path
from shutil import copyfile
from statistics import median

from PIL import Image, ImageColor, ImageDraw


BATCH = Path(__file__).resolve().parent
SAMPLE = BATCH.parent / 'A8-sample-r1'
APPROVED = SAMPLE / 'candidate' / SAMPLE.name / 'ui'
OUT = BATCH / 'candidate' / BATCH.name / 'ui'
ART = BATCH.parents[1]
PALETTE = [ImageColor.getrgb(color) for color in json.loads((ART / 'palette.json').read_text())]


def snap(rgb):
    return min(PALETTE, key=lambda color: sum((a - b) ** 2 for a, b in zip(rgb, color)))


def save(image, name):
    image.convert('RGBA').save(OUT / f'{name}.png')


def source_tiles():
    sheet = Image.open(BATCH / 'source.png').convert('RGB')
    width, height = sheet.size
    for start, stop in ((0, width // 2), (width // 2, width)):
        matte = Image.new('1', (stop - start, height))
        matte.putdata([r < 140 or g > 90 or b < 120 for r, g, b in sheet.crop((start, 0, stop, height)).get_flattened_data()])
        left, top, right, bottom = matte.getbbox()
        yield sheet.crop((start + left + 2, top + 2, start + right - 2, bottom - 2))


def material(tile, size, inset, middle):
    """Keep four worn corners, with a solid center and steady side profiles."""
    tile = tile.resize((size, size), Image.Resampling.BOX)
    result = Image.new('RGB', (size, size), middle)
    for y in range(size):
        for x in range(size):
            horizontal = inset <= x < size - inset
            vertical = inset <= y < size - inset
            if horizontal and vertical:
                continue
            if not horizontal and not vertical:
                color = tile.getpixel((x, y))
            else:
                samples = [tile.getpixel((i, y) if horizontal else (x, i)) for i in range(inset, size - inset)]
                color = tuple(median(channel) for channel in zip(*samples))
            result.putpixel((x, y), snap(color))
    return result


def active_button():
    button = Image.open(APPROVED / 'kit_button_normal.png').convert('RGB')
    for y in range(button.height):
        for x in range(button.width):
            edge = min(x, y, button.width - 1 - x, button.height - 1 - y)
            if edge == 1:
                button.putpixel((x, y), ImageColor.getrgb('#785c46'))
            if 2 <= edge <= 4:
                light = max(button.getpixel((x, y)))
                shade = '#ad9a67' if light >= 100 else '#957456'
                button.putpixel((x, y), ImageColor.getrgb(shade))
    return button


def slider():
    track = Image.new('RGBA', (128, 24))
    groove = ImageDraw.Draw(track)
    groove.rounded_rectangle((1, 4, 126, 20), 5, fill='#363b3f')
    groove.rounded_rectangle((3, 5, 124, 17), 4, fill='#24272a')
    groove.line((10, 6, 117, 6), fill='#302724', width=2)
    groove.line((10, 19, 117, 19), fill='#4b5358')

    button = Image.open(APPROVED / 'kit_button_normal.png').convert('RGBA')
    tab = button.resize((26, 36), Image.Resampling.NEAREST)
    tab_draw = ImageDraw.Draw(tab)
    tab_draw.line((2, 3, 23, 3), fill='#818d91', width=2)
    tab_draw.line((2, 4, 2, 30), fill='#646e73', width=2)
    for x in (8, 16):
        tab_draw.line((x, 10, x, 25), fill='#24272a', width=2)
        tab_draw.line((x + 2, 10, x + 2, 25), fill='#818d91', width=2)
    knob = Image.new('RGBA', (32, 40))
    knob.paste(tab, (3, 2))
    return track, knob


def checkboxes():
    button = Image.open(APPROVED / 'kit_button_pressed.png').convert('RGBA')
    well = button.resize((36, 36), Image.Resampling.NEAREST)
    off = Image.new('RGBA', (40, 40))
    off.paste(well, (2, 2))
    draw = ImageDraw.Draw(off)
    draw.rectangle((6, 6, 33, 33), outline='#646e73', width=2)
    draw.line((8, 8, 31, 8), fill='#24272a', width=2)
    on = off.copy()
    scratch = ImageDraw.Draw(on)
    scratch.line([(11, 13), (20, 19), (28, 27)], fill='#957456', width=5)
    scratch.line([(27, 10), (19, 21), (12, 29)], fill='#957456', width=5)
    scratch.line([(11, 12), (20, 19), (28, 26)], fill='#cab08a', width=2)
    scratch.line([(27, 10), (19, 20), (12, 28)], fill='#cab08a', width=2)
    return off, on


OUT.mkdir(parents=True, exist_ok=True)
approved_hashes = json.loads((SAMPLE / 'pack-checks.json').read_text())
for frame in APPROVED.glob('*.png'):
    assert hashlib.sha256(frame.read_bytes()).hexdigest() == approved_hashes[frame.stem]['sha256'], frame.name
    copyfile(frame, OUT / frame.name)

canvas, paper = source_tiles()
save(material(canvas, 96, 8, '#45362d'), 'kit_card')
save(material(paper, 64, 6, '#302724'), 'kit_tooltip')
save(active_button(), 'kit_button_active')
track, knob = slider()
save(track, 'kit_slider_track')
save(knob, 'kit_slider_knob')
off, on = checkboxes()
save(off, 'kit_check_off')
save(on, 'kit_check_on')
