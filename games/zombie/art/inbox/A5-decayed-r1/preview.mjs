import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const review = 'art/inbox/A5-decayed-r1';
const preview = readFileSync(join(review, 'local-preview-root.txt'), 'utf8');
const gallery = JSON.parse(readFileSync(join(review, 'gallery-data.json'), 'utf8'));
const { anims } = JSON.parse(readFileSync('src/data/anims.json', 'utf8'));
const clips = Object.fromEntries(['idle', 'shamble', 'reach', 'lurch', 'bite', 'death'].map(name => [
  name, { ...anims[name], frames: name === 'idle' ? 1 : name === 'bite' ? 3 : name === 'death' ? 4 : 6 },
]));
const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dead Woods · Decayed zombies</title>
<style>
body{margin:32px;background:#24272a;color:#d9d9cb;font:16px system-ui}a{color:inherit}
.controls{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
button,select,input{font:inherit}
.grid{display:grid;grid-template-columns:repeat(4,minmax(80px,128px));gap:10px;max-width:542px}
.grid > span{text-align:center}canvas{display:block;width:100%;background:#4b4f49;image-rendering:pixelated}
h2{margin-bottom:8px}output{min-width:40px}
</style></head>
<body><h1>Decayed zombies</h1>
<p>Work jacket drags a toe. Cardigan swings a stiff knee outward. Hoodie rolls onto the side of one foot.</p>
<div class="controls"><label>Animation <select id="anim">${Object.keys(clips).map(name => `<option${name === 'shamble' ? ' selected' : ''}>${name}</option>`).join('')}</select></label>
<button id="pause">Pause</button><button id="replay">Replay</button>
<label>Compare with fresh <input id="fresh" type="checkbox"></label>
<label>Frame <input id="frame" type="range" min="0" value="0"></label><output id="position"></output></div>
${['Work jacket', 'Cardigan', 'Hoodie'].map((label, body) => `<h2>${label}</h2><div class="grid">
${['SE','SW','NE','NW'].map(facing => `<span>${facing}</span>`).join('')}
${['SE','SW','NE','NW'].map(facing => `<canvas width="128" height="128" aria-label="${label}, ${facing}" data-body="${body}" data-facing="${facing}"></canvas>`).join('')}
</div>`).join('')}
<p><a href="./?debug">Play the game preview</a></p>
<script>
const clips = ${JSON.stringify(clips)};
const galleries = ${JSON.stringify(gallery)};
const fresh = document.querySelector('#fresh');
const images = new Map();
for (const body of Object.values(galleries)) for (const url of Object.values(body)) {
  const image = new Image();
  image.src = url;
  images.set(url, image);
}
const anim = document.querySelector('#anim');
const pause = document.querySelector('#pause');
const frame = document.querySelector('#frame');
const position = document.querySelector('#position');
const canvases = Array.from(document.querySelectorAll('canvas'), canvas => ({
  ctx: canvas.getContext('2d'), body: Number(canvas.dataset.body),
  facing: canvas.dataset.facing[0].toLowerCase() + 'e', flip: canvas.dataset.facing[1] === 'W'
}));
let playing = true, current = 0, since = performance.now();
function reset() { current = 0; since = performance.now(); }
anim.onchange = reset;
pause.onclick = () => {
  playing = !playing;
  since = performance.now() - 1000 * current / clips[anim.value].fps;
  pause.textContent = playing ? 'Pause' : 'Play';
};
document.querySelector('#replay').onclick = () => { playing = true; pause.textContent = 'Pause'; reset(); };
frame.oninput = () => { playing = false; pause.textContent = 'Play'; current = Number(frame.value); };
function draw(now) {
  const clip = clips[anim.value];
  if (playing) {
    const step = Math.floor(Math.max(0, now - since) / 1000 * clip.fps);
    current = clip.loop ? step % clip.frames : Math.min(step, clip.frames - 1);
  }
  frame.max = clip.frames - 1;
  frame.value = current;
  position.textContent = (current + 1) + ' / ' + clip.frames;
  for (const { ctx, body, facing, flip } of canvases) {
    ctx.clearRect(0, 0, 128, 128);
    const key = 'zombie_' + (fresh.checked ? 'fresh' : 'decayed') + '_' + 'abc'[body];
    const image = images.get(galleries[key][anim.value + '_' + facing + '_' + current + '.png']);
    if (!image?.naturalWidth) continue;
    ctx.save();
    if (flip) { ctx.translate(128, 0); ctx.scale(-1, 1); }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0);
    ctx.restore();
  }
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
</script></body></html>`;
writeFileSync(join(review, 'full-preview.html'), html);
copyFileSync(join(review, 'full-preview.html'), join(preview, 'src/a5-decayed-review.html'));
