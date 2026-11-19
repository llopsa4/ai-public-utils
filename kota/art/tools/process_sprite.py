"""Turn Gemini images on a flat green background into game sprites (art/PIPELINE.md, step 3).

Usage (Python 3.12 + Pillow + numpy + scipy):
  python process_sprite.py single IN.jfif OUT.png [--canvas 256] [--fig 220]
  python process_sprite.py strip  IN.jfif OUT_PREFIX [--cells 4] [--canvas 256] [--fig 220]

single: key out the green, trim, scale so the figure is --fig px tall, centre it on a --canvas square
        with its feet near the bottom, save as a transparent PNG.
strip:  the image holds --cells poses in a row. Each cell is keyed; ALL frames share one scale (set by the
        tallest frame) so the character does not change size; each frame is aligned on the feet baseline and
        on the body centre (head and torso, so swinging arms and legs do not shift her sideways).
        Saves OUT_PREFIX_1.png ... OUT_PREFIX_N.png.
The background colour is read from the image border; nothing is hard-coded to #00FF00.
"""
import argparse
import sys

import numpy as np
from PIL import Image
from scipy import ndimage


def key_image(im):
    """Return an RGBA image: green removed (soft edge) and green spill taken out of the colours."""
    a = np.asarray(im.convert("RGB")).astype(float)
    edge = np.concatenate([a[:12].reshape(-1, 3), a[-12:].reshape(-1, 3), a[:, :12].reshape(-1, 3), a[:, -12:].reshape(-1, 3)])
    bg = np.median(edge, axis=0)
    bgd = bg[1] - max(bg[0], bg[2])                                   # how green the background is
    gd = a[:, :, 1] - np.maximum(a[:, :, 0], a[:, :, 2])              # green dominance of every pixel
    alpha = np.clip(1 - (gd - 0.25 * bgd) / (0.5 * bgd), 0, 1)
    solid = ndimage.binary_opening(alpha > 0.5, iterations=2)         # drop JPEG specks in the background
    keep = ndimage.binary_dilation(solid, iterations=3)
    alpha = np.where(keep, alpha, 0)
    out = a.copy()
    spill = np.maximum(0, out[:, :, 1] - np.maximum(out[:, :, 0], out[:, :, 2]))
    out[:, :, 1] -= spill * 0.9                                       # despill: no green fringe
    rgba = np.dstack([out, alpha * 255]).clip(0, 255).astype("uint8")
    return Image.fromarray(rgba, "RGBA")


def body_centre_x(img, bbox):
    """Horizontal centre of the upper 55% of the figure (head and torso), in image pixels."""
    x0, y0, x1, y1 = bbox
    top = np.asarray(img.crop((x0, y0, x1, y0 + int((y1 - y0) * 0.55))))[:, :, 3] > 128
    cols = np.where(top.any(axis=0))[0]
    return x0 + (cols.min() + cols.max()) / 2 if len(cols) else (x0 + x1) / 2


def place(frames, canvas, fig):
    """Scale all frames by one factor, align on feet baseline and body centre, return canvas-size images."""
    boxes = [f.getbbox() for f in frames]
    tallest = max(b[3] - b[1] for b in boxes)
    k = fig / tallest
    outs = []
    for f, b in zip(frames, boxes):
        cx = body_centre_x(f, b)
        crop = f.crop(b)
        w, h = max(1, round(crop.width * k)), max(1, round(crop.height * k))
        crop = crop.resize((w, h), Image.LANCZOS)
        c = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
        x = round(canvas / 2 - (cx - b[0]) * k)
        y = canvas - round((canvas - fig) * 0.35) - h                 # feet near the bottom, same line in every frame
        c.alpha_composite(crop, (x, y))
        outs.append(c)
    return outs


def main():
    p = argparse.ArgumentParser()
    p.add_argument("mode", choices=["single", "strip"])
    p.add_argument("src")
    p.add_argument("out")
    p.add_argument("--cells", type=int, default=4)
    p.add_argument("--canvas", type=int, default=256)
    p.add_argument("--fig", type=int, default=220)
    args = p.parse_args()
    im = Image.open(args.src).convert("RGB")
    if args.mode == "single":
        place([key_image(im)], args.canvas, args.fig)[0].save(args.out, optimize=True)
        print("saved", args.out)
        return
    w = im.width // args.cells
    frames = [key_image(im.crop((i * w, 0, (i + 1) * w, im.height))) for i in range(args.cells)]
    for i, f in enumerate(place(frames, args.canvas, args.fig), 1):
        path = f"{args.out}_{i}.png"
        f.save(path, optimize=True)
        print("saved", path)


if __name__ == "__main__":
    sys.exit(main())
