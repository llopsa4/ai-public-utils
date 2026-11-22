"""Assemble captured browser frames into a review GIF and a local index."""
import json
from pathlib import Path
from PIL import Image
HERE=Path(__file__).resolve().parent
OUT=HERE.parents[1]/'inbox/AB6'
jobs=json.loads((HERE/'subjects.json').read_text())
frames=[Image.open(p).convert('RGB').resize((960,540),Image.Resampling.LANCZOS) for p in sorted(OUT.glob('loop-*.png'))]
assert len(frames)==24
frames[0].save(OUT/'game-loops.gif',save_all=True,append_images=frames[1:],duration=100,disposal=2)
cards=''.join(f'<figure><img src="animation-{j["key"]}.gif" width="200" height="400" alt="{j["key"]} animation on grey and dark grounds"><figcaption>{j["key"]} · {j["fps"]} fps · {"loop" if j["loop"] else "one-shot + pause"}</figcaption></figure>' for j in jobs if j.get('anim'))
html='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Survival · AB6 effects review</title>
<style>body{margin:32px auto;max-width:1280px;padding:0 20px;background:#202322;color:#eadbc0;font:17px/1.5 Georgia,serif}h1{font-weight:normal}a{color:#f0c86d}.grid{display:flex;flex-wrap:wrap;gap:12px}figure{margin:0;background:#343631;padding:6px}figcaption{font-size:13px}img{max-width:100%;height:auto}p{max-width:850px}</style>
<h1>Survival · AB6 revision 1</h1><p>38 frames for arrows, spirit, storm, hit dust, foot dust, completion glints and flame. Candidate art awaits Claude review. Each animated frame was generated as an edit of its base painting.</p>
<p><a href="contact.png">All frames and anchors</a> · <a href="delivery.json">Prompts and processing notes</a> · <a href="browser-checks.json">Browser checks</a> · <a href="loop-checks.json">Loop measurements</a></p>
<div class="grid">'''+cards+'''</div><h2>Game excerpt</h2><p>This 2.4-second excerpt plays once: the three animations have different periods, so the capture's endpoints do not form one shared loop. Reload to replay. The individual GIFs above loop at their own manifest rates. Captured through normal game renderers in a disposable copy. AB3 ground and AB5 plants are review context; people and other buildings retain existing placeholders. The central fire placeholder still includes its old static flame beneath the candidate sprite.</p><img src="game-loops.gif" width="960" height="540" alt="Storm, spirit and flame animating in the camp">
<p><a href="camp-1x-2560.png">Camp at 1x / 2560</a> · <a href="camp-2x-1280.png">Camp at 2x / 1280</a> · <a href="hunt-arrow-1280.png">Flying arrow</a> · <a href="hunt-stuck-1280.png">Stuck arrow</a> · <a href="completion-hit-dust-1280.png">Completion, hit and foot dust</a></p></html>'''
(OUT/'review.html').write_text(html,encoding='utf-8')
print('Saved game-loops.gif and review.html.')
