import { readFileSync, writeFileSync } from 'node:fs';
const review = 'art/inbox/A7-full-r1';
const { anims } = JSON.parse(readFileSync('src/data/anims.json', 'utf8'));
const { figures } = JSON.parse(readFileSync('art/manifest.json', 'utf8'));
const clips = Object.fromEntries(Object.entries(figures.keys.fighter.anims).map(([anim, count]) => {
  const frames = Object.fromEntries(['se', 'ne'].map(facing => [
    facing, Array.from({ length: count }, (_, n) => {
      const folder = review + '/candidate/fighter';
      return 'data:image/png;base64,' + readFileSync(`${folder}/${anim}_${facing}_${n}.png`).toString('base64');
    }),
  ]));
  return [anim, { ...anims[anim], count, frames }];
}));
writeFileSync(`${review}/full-preview.html`, `<!doctype html>
<html lang="en"><meta charset="utf-8"><title>Cass · Animation review</title>
<style>
body{margin:32px;background:#24272a;color:#d9d9cb;font:16px system-ui}
button,select,input{font:inherit;margin:8px;padding:6px}
figure{display:inline-block;margin:12px;text-align:center}canvas{display:block;background:#4b4f49;image-rendering:pixelated}
</style>
<h1>Cass · Animation review</h1>
<label>Animation <select id="anim">${Object.keys(clips).map(key => `<option>${key}</option>`).join('')}</select></label>
<button id="play">Pause</button><button id="replay">Replay</button><label>Frame <input id="frame" type="range" min="0" value="0"></label>
<output id="position"></output>
<div>${['SE', 'SW', 'NE', 'NW'].map(facing => `<figure><canvas width="192" height="192"></canvas><figcaption>${facing}</figcaption></figure>`).join('')}</div>
<p><a style="color:inherit" href="/?debug">Open the playable preview</a></p>
<script>
const clips = ${JSON.stringify(clips)};
const picker = document.querySelector('#anim');
const slider = document.querySelector('#frame');
const position = document.querySelector('#position');
const play = document.querySelector('#play');
const contexts = [...document.querySelectorAll('canvas')].map(canvas => canvas.getContext('2d'));
let playing = true, index = 0, start = performance.now();
const images = new Map();
for (const clip of Object.values(clips)) for (const url of Object.values(clip.frames).flat()) {
  const img = new Image();
  img.src = url;
  images.set(url, img);
}
picker.onchange = () => { index = 0; start = performance.now(); };
document.querySelector('#replay').onclick = () => {
  playing = true;
  index = 0;
  start = performance.now();
  play.textContent = 'Pause';
};
play.onclick = () => {
  playing = !playing;
  start = performance.now();
  play.textContent = playing ? 'Pause' : 'Play';
};
slider.oninput = () => { playing = false; index = +slider.value; play.textContent = 'Play'; };
function draw(now) {
  const clip = clips[picker.value];
  const step = Math.floor((now - start) * clip.fps / 1000);
  if (playing) index = clip.loop ? step % clip.count : Math.min(clip.count - 1, step);
  slider.max = clip.count - 1;
  slider.value = index;
  position.textContent = (index + 1) + ' / ' + clip.count;
  contexts.forEach((ctx, i) => {
    ctx.clearRect(0, 0, 192, 192);
    const image = images.get(clip.frames[i < 2 ? 'se' : 'ne'][index]);
    if (!image?.naturalWidth) return;
    ctx.save();
    if (i % 2) { ctx.translate(192, 0); ctx.scale(-1, 1); }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, 192, 192);
    ctx.restore();
  });
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
</script></html>`);

