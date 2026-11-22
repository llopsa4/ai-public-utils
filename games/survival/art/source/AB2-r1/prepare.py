"""Reproduce AB2 delivery cells and review sheets from individually generated paintings."""
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps, PngImagePlugin

HERE = Path(__file__).resolve().parent
ART = HERE.parents[1]
INBOX = ART / 'inbox' / 'AB2'
SUBJECTS = json.loads((HERE / 'subjects.json').read_text(encoding='utf-8'))
RESAMPLE = Image.Resampling.LANCZOS


def save(img, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    info = PngImagePlugin.PngInfo()
    info.add(b'sRGB', b'\0')
    img.convert('RGBA').save(path, pnginfo=info)


def cutout(path, magenta=False):
    rgb = np.asarray(Image.open(path).convert('RGB')).astype(float)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    excess = np.minimum(r, b) - g if magenta else g - np.maximum(r, b)
    alpha = np.clip(255 - np.clip((excess - 12) * 2.8, 0, 255), 0, 255)
    if magenta:
        spill = np.maximum(0, np.minimum(r, b) - g - 10)
        rgb[:, :, 0] -= spill
        rgb[:, :, 2] -= spill
    else:
        rgb[:, :, 1] = np.minimum(g, np.maximum(r, b) + 10)
    rgba = np.dstack((np.clip(rgb, 0, 255), alpha)).astype('uint8')
    rgba[alpha < 5] = 0
    img = Image.fromarray(rgba)
    box = img.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox()
    if not box:
        raise ValueError(f'Empty cutout: {path}')
    return img.crop(box)


def cell(subject, size):
    key = subject['key']
    magenta = any(word in key for word in ('heal', 'spring', 'summer'))
    img = cutout(HERE / f'{key}.png', magenta)
    # All cells preserve >=2px empty border at delivery resolution.
    is_cursor = key.startswith('cursor_')
    scale = size / 32 if is_cursor else 1
    if key == 'cursor_build':
        img = ImageOps.mirror(img)  # Handle end points to the bottom-left hotspot.
    limit = round(24 * scale) if is_cursor else 56
    img = ImageOps.contain(img, (limit, limit), RESAMPLE)
    result = Image.new('RGBA', (size, size))
    x, y = (size - img.width) // 2, (size - img.height) // 2
    if key == 'cursor_pointer':
        x, y = 2 * (size // 32), 2 * (size // 32)
    elif key in ('cursor_move', 'cursor_build'):
        alpha = np.asarray(img.getchannel('A'))
        yy, xx = np.where(alpha > 128)
        foot_y = int(yy.max())
        foot_x = round(float(xx[yy >= foot_y - max(1,round(scale))].mean()))
        hx, hy = subject['hotspot']
        x = max(2, min(size-img.width-2, round(hx*scale)-foot_x))
        y = max(2, min(size-img.height-2, round(hy*scale)-foot_y))
    result.alpha_composite(img, (x, y))
    # Remove resampling dust and prevent any nonzero alpha in the border.
    a = np.array(result)
    a[:2] = 0
    a[-2:] = 0
    a[:, :2] = 0
    a[:, -2:] = 0
    a[a[:, :, 3] < 4] = 0
    return Image.fromarray(a)


def font(size):
    return ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', size)


def sheets():
    cols, cw, ch = 6, 220, 166
    rows = math.ceil(len(SUBJECTS) / cols)
    sheet = Image.new('RGBA', (cols * cw + 32, rows * ch + 100), '#292b28')
    draw = ImageDraw.Draw(sheet)
    draw.text((20, 16), 'Camp Fire / AB2 / revision 1', font=font(28), fill='#f0d9ad')
    draw.text((20, 55), '64 px source cells, 32 px and 16 px reads; grey and dark grounds', font=font(16), fill='#ded5c5')
    for i, subject in enumerate(SUBJECTS):
        key = subject['key']
        x, y = 16 + (i % cols) * cw, 92 + (i // cols) * ch
        draw.rectangle((x, y, x + cw - 8, y + ch - 8), fill='#777970')
        draw.rectangle((x, y + 74, x + cw - 8, y + ch - 8), fill='#33362f')
        label = key.replace('icon_', '').replace('cursor_', 'cursor ')
        draw.text((x + 5, y + 4), label, font=font(12), fill='#fff1d6')
        path = INBOX / key / (f'{key}_2x.png' if key.startswith('cursor_') else f'{key}.png')
        img = Image.open(path).convert('RGBA')
        for baseline in (y + 32, y + 94):
            cx, cy = x + 39, baseline + 22
            draw.polygon(((cx-32,cy),(cx,cy-16),(cx+32,cy),(cx,cy+16)), outline='#969b8b')
            for size, dx in ((64, 8), (32, 92), (16, 160)):
                small = img.resize((size, size), RESAMPLE)
                sheet.alpha_composite(small, (x + dx, baseline))
    save(sheet, INBOX / 'contact.png')
    strip = Image.new('RGBA', (16 * 26, 64), '#777970')
    draw = ImageDraw.Draw(strip)
    draw.rectangle((0, 32, strip.width, 64), fill='#33362f')
    for i, subject in enumerate(s for s in SUBJECTS if s['key'].startswith('icon_')):
        key = subject['key']
        img = Image.open(INBOX / key / f'{key}.png').resize((16,16), RESAMPLE)
        strip.alpha_composite(img, ((i % 26)*16, (i // 26)*16))
        strip.alpha_composite(img, ((i % 26)*16, 32+(i // 26)*16))
    save(strip, INBOX / 'readability-16.png')


if __name__ == '__main__':
    prompts = json.loads((HERE / 'prompts.json').read_text(encoding='utf-8'))
    for subject in SUBJECTS:
        key = subject['key']
        prompt_file = HERE / f'{key}.prompt.txt'
        if prompt_file.exists():
            prompts[key] = prompt_file.read_text(encoding='utf-8').strip()
        if not (HERE / f'{key}.png').exists():
            raise FileNotFoundError(key)
        if key.startswith('cursor_'):
            save(cell(subject, 32), INBOX / key / f'{key}.png')
            save(cell(subject, 64), INBOX / key / f'{key}_2x.png')
        else:
            save(cell(subject, 64), INBOX / key / f'{key}.png')
    attempts = dict(prompts)
    for correction in HERE.glob('*correction*.json'):
        prompts.update(json.loads(correction.read_text(encoding='utf-8')))
    delivery = dict(batch='AB2', revision=1, brief='BATCHES.md AB2 rev 1 (2026-11-20)',
                    keys=[s['key'] for s in SUBJECTS], tools=dict(imageGen='image_gen.imagegen', pillow='12.2.0'),
                    prompts=prompts, initialPrompts=attempts,
                    notes='Individual generated paintings; keyed and despilled, Lanczos scaled into RGBA sRGB cells. Cursors at 32 and 64 px use manifest hotspots. No installed assets modified. Candidate previews use an isolated snapshot.')
    (INBOX / 'delivery.json').write_text(json.dumps(delivery, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    sheets()
    print(f'Prepared {len(SUBJECTS)} keys, 62 frames; contact and 16px review strip.')
