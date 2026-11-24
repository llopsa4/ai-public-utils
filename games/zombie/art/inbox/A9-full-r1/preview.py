"""Configure the isolated A9 game and its complete review gallery."""

import html
import json
import shutil
import sys
from pathlib import Path


BATCH = Path(__file__).resolve().parent
ROOT = Path(sys.argv[1])
SOURCE = ROOT / "src"
CANDIDATE = BATCH / "candidate" / "ui"
PACKED = ROOT / "art" / "frames" / "ui"
MANIFEST = ROOT / "art" / "manifest.json"
DATA = json.loads(MANIFEST.read_text())
NAMES = [name for name, item in DATA["ui"]["items"].items()
         if item["group"] in {"icon_bar", "icon_hud", "cursor"}]
assert len(NAMES) == 29

for name in NAMES:
    file = f"{name}.png"
    assert (PACKED / file).read_bytes() == (CANDIDATE / file).read_bytes(), name
    DATA["ui"]["items"][name]["status"] = "final"
MANIFEST.write_text(json.dumps(DATA, indent=2) + "\n")

index = SOURCE / "index.html"
start = """<script>
  const stage = new URLSearchParams(location.search).get('a9');
  if (['base1', 'mission1'].includes(stage)) {
    localStorage.setItem('deadwoods.save', JSON.stringify({
      version: 2, stage, food: 5, scrap: 4, ammo: 5, cassGun: true,
    }));
  }
</script>
"""
source = index.read_text()
if start not in source:
    index.write_text(source.replace('<script type="module"', start + '<script type="module"'))

assets = SOURCE / "a9-art"
assets.mkdir(exist_ok=True)
for name in NAMES:
    shutil.copyfile(CANDIDATE / f"{name}.png", assets / f"{name}.png")
shutil.copyfile(ROOT / "art" / "frames" / "ui" / "kit_button_normal.png", assets / "button.png")

labels = {"freefire": "Free fire", "can": "Noise can", "spike": "Spike pit", "hp": "HP"}
sections = []
for group, title, size in (("icon_bar", "Action bar", 48), ("icon_hud", "HUD", 24), ("cursor", "Cursors", 32)):
    cards = []
    for name, item in DATA["ui"]["items"].items():
        if name not in NAMES or item["group"] != group:
            continue
        key = name.removeprefix(group + "_")
        label = html.escape(labels.get(key, key.capitalize()))
        style = ""
        if group == "cursor":
            x, y = item["hotspot"]
            style = f""" style='cursor: url("a9-art/{name}.png") {x} {y}, auto'"""
        cards.append(f'<li{style}><img src="a9-art/{name}.png" width="{size}" height="{size}" alt="">{label}</li>')
    sections.append(f'<section class="{group}"><h2>{title}</h2><ul>{"".join(cards)}</ul></section>')

(SOURCE / "a9-review.html").write_text("""<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dead Woods A9 review</title>
<style>
  :root { color-scheme: dark; font: 16px Georgia, serif; background: #181917; color: #e1d8c6; }
  body { max-width: 960px; margin: 32px auto; padding: 0 20px; }
  h1 { margin-bottom: .4em; }
  h2 { font-size: 1.2rem; margin-top: 1.5rem; }
  a { color: #e0c7a1; }
  ul { list-style: none; padding: 0; display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(94px, 1fr)); }
  li { min-height: 80px; display: grid; place-content: center; place-items: center; gap: 6px;
       background: #282622; border: 1px solid #514839; border-radius: 3px; }
  img { image-rendering: pixelated; display: block; }
  .icon_bar img { padding: 4px; background: url("a9-art/button.png") center / 100% 100%; }
</style>
<h1>Dead Woods A9 review</h1>
<p><a href="./?a9=base1">Play Base 1</a> · <a href="./?a9=mission1">Play Mission 1</a></p>
<p>Choose Continue, then press F1 for Fighter or F2 for Scout. Hover a cursor tile to try it.</p>
""" + "\n".join(sections), encoding="utf-8")
