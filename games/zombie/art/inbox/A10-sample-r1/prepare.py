"""Convert the two A10 source portraits and stage an isolated game preview."""

import hashlib
import json
import shutil
import sys
from pathlib import Path

from PIL import Image


BATCH = Path(__file__).resolve().parent
ROOT = Path(sys.argv[1]).resolve()
if ROOT.name != "dead-woods-a10-sample-r1" or ROOT == BATCH.parents[2]:
    raise ValueError("Use the isolated A10 preview root")
ART = ROOT / "art"
MANIFEST = ART / "manifest.json"
KEYS = tuple(f"portrait_{who}_neutral" for who in ("fighter", "scout"))
PALETTE = json.loads((ART / "palette.json").read_text())


def stage():
    out = BATCH / "candidate" / "ui"
    out.mkdir(parents=True, exist_ok=True)
    palette = Image.new("P", (1, 1))
    palette.putpalette(b"".join(bytes.fromhex(color[1:]) for color in PALETTE))
    manifest = json.loads(MANIFEST.read_text())
    for name in KEYS:
        size = tuple(manifest["ui"]["items"][name]["size"])
        with Image.open(BATCH / f"source-{name}.png") as source:
            image = source.convert("RGB").resize(
                tuple(n // 2 for n in size), Image.Resampling.LANCZOS
            )
        image = image.quantize(palette=palette, dither=Image.Dither.NONE).convert("RGBA")
        candidate = out / f"{name}.png"
        image.resize(size, Image.Resampling.NEAREST).save(candidate)
        shutil.copyfile(candidate, ART / "inbox" / BATCH.name / "ui" / candidate.name)


def verify():
    atlas = Image.open(ART / "atlas" / "ui.png").convert("RGBA")
    frames = json.loads((ART / "atlas" / "ui.json").read_text())["frames"]
    manifest = json.loads(MANIFEST.read_text())
    standins = json.loads((ART / "frames" / "standins.json").read_text())
    checks = {}
    for name in KEYS:
        candidate = BATCH / "candidate" / "ui" / f"{name}.png"
        image = Image.open(candidate).convert("RGBA")
        item = manifest["ui"]["items"][name]
        assert image.size == tuple(item["size"])
        assert image.getchannel("A").getextrema() == (255, 255)
        assert all(f"#{r:02x}{g:02x}{b:02x}" in PALETTE
                   for r, g, b, _ in image.get_flattened_data())
        data = candidate.read_bytes()
        assert (ART / "frames" / "ui" / candidate.name).read_bytes() == data
        assert candidate.name not in standins.get("ui", [])
        rect = frames[name]["frame"]
        box = (rect["x"], rect["y"], rect["x"] + rect["w"], rect["y"] + rect["h"])
        assert atlas.crop(box).tobytes() == image.tobytes()
        checks[name] = {"size": image.size, "sha256": hashlib.sha256(data).hexdigest()}
        item["status"] = "final"
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    (BATCH / "pack-checks.json").write_text(json.dumps(checks, indent=2) + "\n")

    index = ROOT / "src" / "index.html"
    seed = """<script>
      if (new URLSearchParams(location.search).has('a10')) {
        localStorage.setItem('deadwoods.save', JSON.stringify({
          version: 2, stage: 'base1', food: 5, scrap: 4, ammo: 5, cassGun: false,
        }));
      }
    </script>
    """
    html = index.read_text()
    if seed not in html:
        index.write_text(html.replace('<script type="module"', seed + '<script type="module"'))


if __name__ == "__main__":
    {"stage": stage, "verify": verify}[sys.argv[2]]()
