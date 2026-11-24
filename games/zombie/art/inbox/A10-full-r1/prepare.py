"""Prepare the A10 art delivery and verify its isolated packed atlas."""
import hashlib
import json
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw

BATCH = Path(__file__).resolve().parent
GAME = BATCH.parents[2]
OUT = BATCH / "candidate" / "ui"
SAMPLE = BATCH.parent / "A10-sample-r1" / "candidate" / "ui"
PALETTE = json.loads((GAME / "art" / "palette.json").read_text())
WHO = ("fighter", "scout")
MOODS = ("neutral", "afraid", "determined", "hurt")
KEYS = [f"portrait_{who}_{mood}" for who in WHO for mood in MOODS]
KEYS += [f"portrait_small_{who}_{mood}" for who in WHO for mood in ("neutral", "hurt")]


def small_head(who, hurt):
    """Draw original facial clusters on the 36 px squad card grid."""
    image = Image.new("RGB", (36, 36), PALETTE[0])
    draw = ImageDraw.Draw(image)

    def polygon(color, *points):
        draw.polygon(points, fill=PALETTE[color])

    def line(color, *points, width=1):
        draw.line(points, fill=PALETTE[color], width=width)

    cass = who == "fighter"
    skin, light = (20, 21) if not hurt else (21, 22)
    if cass:
        polygon(16, (7, 28), (10, 19), (9, 11), (12, 5), (18, 2), (24, 4),
                (28, 9), (27, 21), (24, 26), (25, 32), (14, 34), (7, 32))
        polygon(9, (1, 35), (4, 31), (12, 28), (23, 28), (31, 31), (35, 35))
        line(15, (8, 31), (10, 35), width=2)
        line(15, (27, 31), (25, 35), width=2)
        polygon(18, (14, 25), (22, 24), (23, 29), (19, 32), (14, 29))
        polygon(skin, (12, 14), (17, 10), (20, 8), (25, 14), (26, 19),
                (23, 24), (19, 27), (15, 25), (12, 21))
        polygon(light, (13, 15), (17, 12), (19, 10), (20, 13), (18, 17), (18, 22),
                (15, 23), (13, 20))
        polygon(17, (9, 15), (11, 8), (16, 4), (21, 4), (18, 7), (14, 9), (12, 14))
        line(18, (11, 10), (16, 6), (19, 5))
        line(17, (23, 6), (26, 9), (27, 13))
    else:
        polygon(1, (1, 35), (4, 31), (13, 27), (22, 27), (31, 30), (35, 35))
        polygon(2, (12, 27), (16, 29), (20, 29), (24, 26), (24, 32), (19, 35), (12, 33))
        line(3, (7, 31), (8, 35), width=2)
        line(3, (29, 31), (28, 35), width=2)
        polygon(18, (12, 13), (24, 12), (27, 17), (26, 22), (23, 27), (19, 29),
                (15, 28), (11, 23), (10, 18))
        polygon(skin, (12, 13), (24, 13), (25, 19), (23, 23), (20, 25),
                (16, 24), (12, 21))
        polygon(light, (13, 15), (18, 14), (18, 19), (19, 21), (16, 22), (13, 20))
        polygon(2, (8, 13), (10, 8), (14, 4), (22, 3), (26, 6), (29, 12),
                (28, 15), (11, 15))
        polygon(3, (9, 12), (11, 8), (15, 5), (21, 5), (16, 7), (13, 11))
        line(14, (10, 13), (17, 11), (24, 11), (28, 13))
        line(1, (11, 15), (23, 14), (29, 15))

    brow = 16 if cass else 17
    line(brow, (13, 16), (16, 16))
    line(brow, (21, 16), (24, 16))
    line(22, (13, 18), (16, 18))
    draw.point((15, 18), fill=PALETTE[brow])
    if hurt:
        line(brow, (21, 18), (22, 19), (24, 18))
        line(27, (23, 20), (24, 21), (23, 23))
        line(26, (16, 24), (19, 23), (21, 24))
    else:
        line(22, (21, 18), (24, 18))
        draw.point((22, 18), fill=PALETTE[brow])
        line(18, (16, 24), (20, 24))
    draw.point((19, 21), fill=PALETTE[19])
    return image.resize((72, 72), Image.Resampling.NEAREST).convert("RGBA")


def stage(root):
    palette = Image.new("P", (1, 1))
    palette.putpalette(b"".join(bytes.fromhex(color[1:]) for color in PALETTE))
    inbox = root / "art" / "inbox" / BATCH.name / "ui"
    inbox.mkdir(parents=True, exist_ok=True)
    for key in KEYS:
        name = f"{key}.png"
        target = OUT / name
        if key.startswith("portrait_small_"):
            _, _, who, mood = key.split("_")
            small_head(who, mood == "hurt").save(target)
        elif key.endswith("_neutral"):
            shutil.copyfile(SAMPLE / name, target)
        else:
            with Image.open(BATCH / f"source-{name}") as source:
                image = source.convert("RGB").resize((128, 128), Image.Resampling.LANCZOS)
            image = image.quantize(palette=palette, dither=Image.Dither.NONE).convert("RGBA")
            image.resize((256, 256), Image.Resampling.NEAREST).save(target)
        shutil.copyfile(target, inbox / name)


def verify(root):
    art = root / "art"
    manifest_path = art / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    packed = json.loads((art / "atlas" / "ui.json").read_text())["frames"]
    atlas = Image.open(art / "atlas" / "ui.png").convert("RGBA")
    standins = json.loads((art / "frames" / "standins.json").read_text())
    original = Image.open(GAME / "art" / "atlas" / "ui.png").convert("RGBA")
    original_frames = json.loads((GAME / "art" / "atlas" / "ui.json").read_text())["frames"]

    def crop(sheet, frame):
        rect = frame["frame"]
        x, y, w, h = (rect[name] for name in ("x", "y", "w", "h"))
        return sheet.crop((x, y, x + w, y + h)).tobytes()

    checks = {}
    for key in KEYS:
        path = OUT / f"{key}.png"
        image = Image.open(path).convert("RGBA")
        item = manifest["ui"]["items"][key]
        data = path.read_bytes()
        assert image.size == tuple(item["size"]), key
        assert image.getchannel("A").getextrema() == (255, 255), key
        assert all(f"#{r:02x}{g:02x}{b:02x}" in PALETTE
                   for r, g, b, _ in set(image.getdata())), key
        assert (art / "frames" / "ui" / path.name).read_bytes() == data, key
        assert path.name not in standins.get("ui", []), key
        assert crop(atlas, packed[key]) == image.tobytes(), key
        matched_sample = key.startswith("portrait_") and not key.startswith("portrait_small_") and key.endswith("_neutral")
        if matched_sample:
            assert data == (SAMPLE / path.name).read_bytes(), key
        checks[key] = {"size": image.size, "sha256": hashlib.sha256(data).hexdigest(),
                       "matches_approved_sample": matched_sample}
        item["status"] = "final"
    unaffected = sorted(set(original_frames) - set(KEYS))
    for key in unaffected:
        assert crop(original, original_frames[key]) == crop(atlas, packed[key]), key
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    evidence = {"portraits": checks, "unaffected_atlas_frames": unaffected}
    (BATCH / "pack-checks.json").write_text(json.dumps(evidence, indent=2) + "\n")


if __name__ == "__main__":
    root = Path(sys.argv[1]).resolve()
    if root == GAME or root.name != "dead-woods-a10-full-r1":
        raise ValueError("Use the isolated A10 full preview root")
    {"stage": stage, "verify": verify}[sys.argv[2]](root)

