"""Record exact image prompts and make AB8 review sheets from rendered frames."""
import hashlib
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw

HERE=Path(__file__).resolve().parent
ART=HERE.parents[1]
OUT=ART/'inbox'/'AB8'
OUT.mkdir(parents=True,exist_ok=True)
STYLE='Hand-painted semi-realistic HD isometric game art, like the best classic 2D castle city-builders: soft painterly shading, rich natural material texture, warm late-summer light from the upper left, soft shadow to the lower right, tallgrass prairie, lake and oak woodland palette, no outlines, no text.'
PROMPTS={
 'concept_trap':STYLE+'\nUse case: stylized-concept. Asset type: model reference sheet before Blender. Character/model sheet of a plain pit trap: a square of crossed sticks and grass over a hole, two marker stakes. Front, side and back views of the same small ground structure, plain flat light grey background, the same scale in every view. No people, no garments, no decoration. Believable wood and dry prairie grass, dark brown hole, never pure black. No feathers, no regalia, no text, no labels.',
 'concept_fire_pit':STYLE+'\nUse case: stylized-concept. Asset type: model reference sheet before Blender. Character/model sheet of a small stone fire pit: a low circular ring of irregular grey stones with charred wooden logs in the empty central hearth. Front, side and back views of the same small ground structure, plain flat light grey background, the same scale in every view. Unlit: no flame, no smoke, no embers, the game adds the flame separately. Stone colours #B8B0A2, #8F877A, #5E584F; wood #4E463C; darkest char is brown, never pure black. No people, no garments, no decoration, no feathers, no regalia, no text, no labels.',
 'concept_barricade':STYLE+'\nUse case: stylized-concept. Asset type: model reference sheet before Blender. Character/model sheet of a small plain barricade: a row of sharpened stakes angled outward, lashed to a ground pole. Front, side and back views of the same two-metre long section, plain flat light grey background, the same scale in every view. Pale weathered peeled wooden poles, pointed natural wood tips, plain dark hide lashings. Practical low defensive structure, believable materials, no ornaments. No people, no garments, no feathers, no regalia, no text, no labels, no pure black.',
 'stone_painted':STYLE+'\nSeamless square hand-painted texture of weathered grey field stone, flat even light, no shadows, no perspective, fills the whole square, tiles on every side. Fine mottled stone grain with subtle warm grey mineral variations in #B8B0A2, #8F877A, #5E584F. This is one continuous stone surface, no separate rocks, no joints, no mortar, no paving. 1024x1024.'}
KEYS=['building_trap','building_fire_pit','building_barricade']
STATES=['stage1','stage2','stage3','finished','winter']
delivery={'batch':'AB8','revision':1,'brief':'BATCHES.md AB8 rev 1','keys':KEYS,
 'tools':{'blender':'5.1.2','renderPy':hashlib.sha256((ART/'source/render.py').read_bytes()).hexdigest(),'imageGen':'image_gen.imagegen','post':'Pillow 12.2.0'},
 'prompts':PROMPTS,'approvalAuthority':'claude',
 'notes':'90 Blender frames. AB0 camera, lighting, 2x supersampling and shadow post reused via render_batch.py; AB0 render.py unchanged. Models have independent state collections and barricade mask subcollections. Pole wood reuses approved AB0 texture. New stone source is resized to 1024 square. Concepts are references, not frames. No baked flames. Tile +x maps to model +X, tile +y to -Y; connection poles reach the shared edge midpoint at 1 metre. No installation.'}
source_files=list(HERE.glob('*.py'))+list(HERE.glob('*.mjs'))+list(HERE.glob('*.png'))
source_files += [ART/'source'/f'{key}.blend' for key in KEYS]
source_files += [ART/'source/textures'/name for name in ['wood_pole.png','stone_painted.png']]
delivery['sourceSha256']={p.relative_to(ART).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in source_files}
(OUT/'delivery.json').write_text(json.dumps(delivery,indent=2)+'\n',encoding='utf-8')
(HERE/'prompts.json').write_text(json.dumps(PROMPTS,indent=2)+'\n',encoding='utf-8')

def tile(draw,x,y):
    draw.line([(x,y-16),(x+32,y),(x,y+16),(x-32,y),(x,y-16)],fill='#828278',width=1)

def cell(sheet,img,x,y,label):
    draw=ImageDraw.Draw(sheet)
    tile(draw,x+80,y+94)
    sheet.alpha_composite(img.resize((128,128),Image.Resampling.LANCZOS),(x+16,y+14))
    draw.text((x+6,y+145),label,fill='#eee5d0' if sheet.getpixel((x+2,y+2))[0]<90 else '#2b2118')

frames=[]
for key in KEYS:
    entries=[]
    for state in STATES:
        for mask in (range(16) if key=='building_barricade' else [0]):
            file=OUT/key/f'{state}_{mask if key=="building_barricade" else "00"}.png'
            if not file.exists(): continue
            entries.append((Image.open(file).convert('RGBA'),f'{state} / {mask}'))
    if not entries: continue
    cols=8 if len(entries)>5 else 5
    rows=math.ceil(len(entries)/cols)
    review=Image.new('RGBA',(cols*160,rows*165*2),(150,150,145,255))
    ImageDraw.Draw(review).rectangle((0,rows*165,review.width,review.height),fill='#302e35')
    for i,(im,label) in enumerate(entries):
        for ground in (0,1):cell(review,im,(i%cols)*160,(i//cols+ground*rows)*165,label)
        frames.append((im,key.replace('building_','')+' '+label))
    review.convert('RGB').save(OUT/f'review-{key}.png')
if frames:
    contact=Image.new('RGBA',(8*160,math.ceil(len(frames)/8)*165+165),(150,150,145,255))
    draw=ImageDraw.Draw(contact)
    draw.rectangle((0,contact.height-165,contact.width,contact.height),fill='#302e35')
    for i,(im,label) in enumerate(frames):cell(contact,im,(i%8)*160,(i//8)*165,label)
    for i,key in enumerate(KEYS):
        file=OUT/key/'finished_0.png' if key=='building_barricade' else OUT/key/'finished_00.png'
        if file.exists():cell(contact,Image.open(file).convert('RGBA'),i*160,contact.height-165,key)
    contact.convert('RGB').save(OUT/'contact.png')
print('Recorded AB8 prompts and review sheets for',len(frames),'frames.')
html='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AB8 revision 1 review</title><style>body{margin:32px auto;max-width:1400px;padding:0 20px;background:#242229;color:#eee5d0;font:16px/1.5 system-ui}a{color:#d9bc8c}img{max-width:100%;height:auto}section{margin:44px 0}h1,h2{font-family:Georgia,serif}small{display:block}</style>
<h1>AB8 revision 1 · small buildings</h1><p>Approval authority: Claude. 90 candidate Blender frames; no installation.</p>
<p>AB3 ground, AB5 plants and AB6 effects in game captures are review context. Existing people and larger building placeholders remain.
L and T barricades were created with real pointer drags; stage rows and winter use paused debug state.</p>
<p><a href="delivery.json">Delivery and exact prompts</a> · <a href="browser-checks.json">Browser assertions</a> · <a href="join-layout.json">Join layouts</a></p>
<section><h2>All frames at actual display size</h2><a href="contact.png"><img src="contact.png" alt="All 90 small building frames with a dark ground strip"></a></section>'''
for key in KEYS:
    html+=f'<section><h2>{key}</h2><a href="review-{key}.png"><img src="review-{key}.png" alt="{key}: all states on grey and dark grounds at display size"></a></section>'
for state in STATES:
    html+=f'<section><h2>Joined L, T and cross · {state}</h2><img src="joins-{state}-1x.png" alt="Joined {state} barricades at actual display size"><small><a href="joins-{state}-2x.png">Open source pixels</a></small></section>'
for season in ['summer','winter']:
    for zoom in [.5,1,2]:
        name=f'camp-{season}-{zoom:g}x-1280.png'
        html+=f'<section><h2>{season} · zoom {zoom:g}</h2><a href="{name}"><img src="{name}" alt="Camp in {season} at zoom {zoom:g}, with L and T barricades and construction stages"></a><small><a href="camp-{season}-{zoom:g}x-2560.png">2560 × 1440 capture</a></small></section>'
(OUT/'review.html').write_text(html+'</html>\n',encoding='utf-8')
