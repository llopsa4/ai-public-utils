import { readFileSync, writeFileSync } from 'node:fs';
const dir='art/inbox/A2-review';
const url=p=>'data:image/png;base64,'+readFileSync(p).toString('base64');
const assets={sheet:url(`${dir}/sheet.png`),se:url('art/frames/fighter/idle_se_0.png'),ne:url('art/frames/fighter/idle_ne_0.png')};
writeFileSync(`${dir}/preview.html`, `<!doctype html><html lang="en"><meta charset="utf-8"><title>Cass walk/run preview</title>
<style>body{background:#24272a;color:#d9d9cb;font:16px system-ui;margin:32px}button,select,input{font:inherit;margin:8px;padding:8px}canvas{background:#4b4f49;image-rendering:pixelated;max-width:100%;height:auto}p{max-width:850px;line-height:1.5}</style>
<h1>Cass · walk/run candidate</h1><p>Approved idle at left. Candidate SE, SW (mirrored), NE and NW (mirrored) follow. Walk: 8 fps. Run: 12 fps. All frames use the fixed (32,56) anchor. Preview only; installed game art is unchanged.</p>
<label>Animation <select id="anim"><option value="0">Walk</option><option value="2">Run</option></select></label><button id="play">Pause</button><label>Frame <input id="frame" type="range" min="0" max="3" value="0"></label><span id="num">0</span><p>Idle · SE · SW · NE · NW</p><canvas width="1280" height="300" aria-label="Animation comparison with approved idle"></canvas>
<p>Review the silhouette, alternating gait, ground contact and mirrored equipment. This is the permitted walk/run-first subset: 16 of the 74 A2 frames. Remaining animations and the final in-game approval are still pending.</p>
<script>
const assets=${JSON.stringify(assets)};const images={};let playing=true,manual=0,start=performance.now();
Promise.all(Object.entries(assets).map(([k,v])=>new Promise(resolve=>{const i=new Image;i.onload=()=>{images[k]=i;resolve()};i.src=v}))).then(()=>requestAnimationFrame(draw));
const c=document.querySelector('canvas'),ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
document.querySelector('#play').onclick=()=>{playing=!playing;document.querySelector('#play').textContent=playing?'Pause':'Play'};
document.querySelector('#frame').oninput=e=>{manual=+e.target.value;playing=false;document.querySelector('#play').textContent='Play'};
function draw(now){const row=+document.querySelector('#anim').value,fps=row?12:8,n=playing?Math.floor((now-start)/1000*fps)%4:manual;document.querySelector('#num').textContent=n;document.querySelector('#frame').value=n;ctx.fillStyle='#4b4f49';ctx.fillRect(0,0,c.width,c.height);
for(let i=0;i<5;i++){ctx.save();ctx.translate(i*256,16);if(i===2||i===4){ctx.translate(256,0);ctx.scale(-1,1)}if(i===0)ctx.drawImage(images.se,0,0,64,64,0,0,256,256);else ctx.drawImage(images.sheet,n*64,(row+(i>=3?1:0))*64,64,64,0,0,256,256);ctx.restore();ctx.fillStyle='#a4ab82';ctx.fillRect(i*256+120,240,16,1)}requestAnimationFrame(draw)}
</script></html>`);
console.log('Wrote self-contained preview.html');
