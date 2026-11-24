"""Verify every candidate against the isolated installation and packed pixels."""

import hashlib
import json
import sys
from collections import Counter
from pathlib import Path

from PIL import Image


BATCH = Path(__file__).resolve().parent
ART = Path(sys.argv[1]) / "art"
MANIFEST = json.loads((ART / "manifest.json").read_text())["ui"]
ATLAS = Image.open(ART / "atlas/ui.png").convert("RGBA")
FRAMES = json.loads((ART / "atlas/ui.json").read_text())["frames"]
PALETTE = set(json.loads((ART / "palette.json").read_text()))
EXPECTED = {"icon_bar": 16, "icon_hud": 8, "cursor": 5}
APPROVED = json.loads((BATCH.parent / "A9-sample-r1" / "pack-checks.json").read_text())

checks = {}
groups = Counter()
for candidate in sorted((BATCH / "candidate" / "ui").glob("*.png")):
    name = candidate.stem
    item = MANIFEST["items"][name]
    group = item["group"]
    assert group in EXPECTED and item["status"] == "final", name
    image = Image.open(candidate).convert("RGBA")
    assert image.size == tuple(item["size"]), name
    assert image.getchannel("A").getextrema() == (0, 255), name
    assert all(a == 0 or (a == 255 and f"#{r:02x}{g:02x}{b:02x}" in PALETTE)
               for r, g, b, a in image.get_flattened_data()), name
    data = candidate.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    assert (ART / "frames" / "ui" / candidate.name).read_bytes() == data, name
    if name in APPROVED:
        assert digest == APPROVED[name]["sha256"], name
    if group == "cursor":
        assert name not in FRAMES, name
        assert all(0 <= value < 32 for value in item["hotspot"]), name
    else:
        rect = FRAMES[name]["frame"]
        bounds = (rect["x"], rect["y"], rect["x"] + rect["w"], rect["y"] + rect["h"])
        assert ATLAS.crop(bounds).tobytes() == image.tobytes(), name
    checks[name] = {"size": list(image.size), "group": group, "sha256": digest}
    if group == "cursor":
        checks[name]["hotspot"] = item["hotspot"]
    else:
        checks[name]["matchesPackedPixels"] = True
    groups[group] += 1

assert groups == EXPECTED
(BATCH / "pack-checks.json").write_text(json.dumps(checks, indent=2) + "\n")
print(f"Verified {len(checks)} textures. All {len(APPROVED)} approved sample files match by SHA-256.")
