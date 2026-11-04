# Hover outlines for the things painted into each room (the shoe rack, the hearth, the kiln mouths...):
# each hotspot's silhouette is cut out of its room painting (OpenCV GrabCut, on the art's 2-pixel grid)
# and turned into a gold outline, packed one sheet per room:
#   art/src/outlines/<room background>.png + .json (frames by hotspot id; "place": world top-left)
# Things with a picture of their own (objects, props, people) are outlined live by the game instead.
#
#   npm run art:outlines        (needs Python 3 with opencv-python-headless and numpy; build-time only)
#
# Where the automatic cut misses, art/outlines.json gives a rough hand-traced hint that the cut
# snaps to the painted edges. Review: art/inbox/preview/outlines-<room>.png.
import json
import os
import subprocess
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, 'src', 'outlines')
PREVIEW = os.path.join(HERE, 'inbox', 'preview')
LINE = (160, 226, 255, 255)   # BGRA: the bright line (#ffe2a0)
GLOW = (96, 200, 255, 110)    # BGRA: the soft halo outside it (#ffc860)


def painted(room, h):
    o = h.get('outline') or {}
    if 'painted' in o: return bool(o['painted'])
    return h['id'] not in room['objects'] and not o.get('objects')


def cut_auto(small, poly, grow):
    H, W = small.shape[:2]
    pts = np.array([[p['x'], p['y']] for p in poly], np.int32)
    x, y, w, h = cv2.boundingRect(pts)
    pad = 20 + grow
    X0, Y0, X1, Y1 = max(0, x - pad), max(0, y - pad), min(W, x + w + pad), min(H, y + h + pad)
    crop = small[Y0:Y1, X0:X1]
    inside = np.zeros(crop.shape[:2], np.uint8)
    cv2.fillPoly(inside, [pts - [X0, Y0]], 1)
    near = cv2.dilate(inside, np.ones((2 * grow + 1, 2 * grow + 1), np.uint8))
    mask = np.full(crop.shape[:2], cv2.GC_BGD, np.uint8)
    mask[near == 1] = cv2.GC_PR_BGD
    mask[inside == 1] = cv2.GC_PR_FGD
    return crop, mask, inside, (X0, Y0)


def cut_hint(small, hint, band=2):
    H, W = small.shape[:2]
    polys = [np.array(p, np.int32) for p in hint]
    allpts = np.vstack(polys)
    x, y, w, h = cv2.boundingRect(allpts)
    pad = 12
    X0, Y0, X1, Y1 = max(0, x - pad), max(0, y - pad), min(W, x + w + pad), min(H, y + h + pad)
    crop = small[Y0:Y1, X0:X1]
    traced = np.zeros(crop.shape[:2], np.uint8)
    cv2.fillPoly(traced, [p - [X0, Y0] for p in polys], 1)
    k = np.ones((2 * band + 1, 2 * band + 1), np.uint8)
    core, reach = cv2.erode(traced, k), cv2.dilate(traced, k)
    mask = np.full(crop.shape[:2], cv2.GC_BGD, np.uint8)
    mask[reach == 1] = cv2.GC_PR_BGD
    mask[traced == 1] = cv2.GC_PR_FGD
    mask[core == 1] = cv2.GC_FGD
    return crop, mask, traced, (X0, Y0)


def silhouette(small, poly, hint=None, grow=10):
    crop, mask, inside, origin = cut_hint(small, hint) if hint else cut_auto(small, poly, grow)
    bg, fg = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    try:
        cv2.grabCut(crop.copy(), mask, None, bg, fg, 8, cv2.GC_INIT_WITH_MASK)
    except cv2.error:
        pass  # a uniform patch: keep the trace as it is
    m = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 1, 0).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
    keep = np.zeros_like(m)
    big = max([stats[i, cv2.CC_STAT_AREA] for i in range(1, n)] or [0])
    for i in range(1, n):
        if (inside[lab == i]).any() and stats[i, cv2.CC_STAT_AREA] >= max(6, big * 0.08): keep[lab == i] = 1
    cnts, _ = cv2.findContours(keep, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    filled = np.zeros_like(keep)
    cv2.drawContours(filled, cnts, -1, 1, thickness=cv2.FILLED)
    if not filled.any(): filled = inside.copy()  # nothing found: fall back to the click area
    return filled, origin


def outline_image(mask):
    """A gold line one grid pixel outside the silhouette, a fainter halo one more out; at art scale."""
    m = np.pad(mask, 3)
    k = np.ones((3, 3), np.uint8)
    d1 = cv2.dilate(m, k)
    d2 = cv2.dilate(d1, k)
    img = np.zeros(m.shape + (4,), np.uint8)
    img[(d2 == 1) & (d1 == 0)] = GLOW
    img[(d1 == 1) & (m == 0)] = LINE
    return np.kron(img, np.ones((2, 2, 1), np.uint8)), 3


def pack(images):
    """Shelf-packs (id, image) pairs into one sheet; returns the sheet and each frame's rectangle."""
    width = max(1024, max(img.shape[1] for _, img in images))
    x = y = row = 0
    frames = {}
    for key, img in sorted(images, key=lambda kv: -kv[1].shape[0]):
        h, w = img.shape[:2]
        if x + w > width: x, y, row = 0, y + row + 2, 0
        frames[key] = (x, y, w, h)
        x, row = x + w + 2, max(row, h)
    sheet = np.zeros((max(1, y + row), width, 4), np.uint8)
    for key, img in images:
        fx, fy, w, h = frames[key]
        sheet[fy:fy + h, fx:fx + w] = img
    return sheet, frames


def main():
    rooms = json.loads(subprocess.run('npx tsx scripts/hotspots-json.ts', shell=True, cwd=ROOT, capture_output=True, text=True, check=True).stdout)
    hints = json.load(open(os.path.join(HERE, 'outlines.json'), encoding='utf-8'))
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(PREVIEW, exist_ok=True)
    only = set(sys.argv[1:])
    for room in rooms:
        if only and room['id'] not in only: continue
        if not room['image']: continue
        img = cv2.imread(os.path.join(HERE, 'src', room['image']))
        if img is None: continue
        small = img[::2, ::2]  # the 2-pixel grid: one pixel per world pixel
        images, place = [], {}
        review = (img * 0.4).astype(np.uint8)
        for h in room['hotspots']:
            if not painted(room, h): continue
            hint = (hints.get(room['id'], {}).get(h['id']) or {})
            mask, (ox, oy) = silhouette(small, h['polygon'], hint.get('hint'), hint.get('grow', 10))
            out, pad = outline_image(mask)
            images.append((h['id'], out))
            place[h['id']] = {'x': ox - pad, 'y': oy - pad}
            # Review: the thing at full brightness, its outline on top.
            big = np.kron(mask, np.ones((2, 2), np.uint8)).astype(bool)
            y0, x0 = oy * 2, ox * 2
            region = review[y0:y0 + big.shape[0], x0:x0 + big.shape[1]]
            src = img[y0:y0 + big.shape[0], x0:x0 + big.shape[1]]
            region[big[:region.shape[0], :region.shape[1]]] = src[big[:region.shape[0], :region.shape[1]]]
            ys, xs = np.nonzero(out[:, :, 3])
            ry, rx = ys + (oy - pad) * 2, xs + (ox - pad) * 2
            ok = (ry >= 0) & (rx >= 0) & (ry < review.shape[0]) & (rx < review.shape[1])
            review[ry[ok], rx[ok]] = out[ys[ok], xs[ok], :3]
        base = os.path.join(OUT, room['background'])
        if not images:
            for ext in ('.png', '.json'):
                if os.path.exists(base + ext): os.remove(base + ext)
            continue
        sheet, frames = pack(images)
        cv2.imwrite(base + '.png', sheet, [cv2.IMWRITE_PNG_COMPRESSION, 9])
        data = {
            'frames': {k: {'frame': {'x': x, 'y': y, 'w': w, 'h': h}} for k, (x, y, w, h) in frames.items()},
            'meta': {'image': os.path.basename(base) + '.png', 'size': {'w': int(sheet.shape[1]), 'h': int(sheet.shape[0])}, 'scale': '1'},
            'place': place,
        }
        with open(base + '.json', 'w', encoding='utf-8', newline='\n') as f: json.dump(data, f, indent=1)
        cv2.imwrite(os.path.join(PREVIEW, f"outlines-{room['id']}.png"), review)
        print(f"{room['id']}: {len(images)} outlines -> art/src/outlines/{room['background']}.png")


if __name__ == '__main__':
    main()
