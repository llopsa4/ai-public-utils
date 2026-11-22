"""AB11 sheets at actual 1x game size, measurements, provenance and review page."""
import hashlib
import json
import math
from pathlib import Path
from PIL import Image,ImageDraw
HERE=Path(__file__).resolve().parent
ART=HERE.parents[1]
OUT=ART/'inbox/AB11'
KEYS=['fire_central','building_store','building_store_open']
manifest=json.loads((ART/'manifest.json').read_text())
checks={};frames=[]
def draw_cell(sheet,im,x,y,label):
    d=ImageDraw.Draw(sheet);ax,ay=x+168,y+288
    d.line([(ax,ay-64),(ax+128,ay),(ax,ay+64),(ax-128,ay),(ax,ay-64)],fill='#9e9a90',width=1)
    sheet.alpha_composite(im.resize((320,384),Image.Resampling.LANCZOS),(x+8,y))
    d.text((x+8,y+386),label,fill='#eee5d0' if sheet.getpixel((x+1,y+1))[0]<90 else '#30251b')
for key in KEYS:
    entries=[]
    for state in manifest[key]['states']:
        file=OUT/key/f'{state}_00.png';im=Image.open(file).convert('RGBA')
        entries.append((im,state));frames.append((im,key+' '+state))
        checks[f'{key}/{state}/00']={'cell':list(im.size),'alphaBounds':im.getchannel('A').getbbox(),'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}
    cols=min(5,len(entries));rows=math.ceil(len(entries)/cols)
    sheet=Image.new('RGBA',(cols*336,rows*410*2),(150,150,145,255))
    ImageDraw.Draw(sheet).rectangle((0,rows*410,sheet.width,sheet.height),fill='#302e35')
    for i,(im,label) in enumerate(entries):
        for ground in (0,1):draw_cell(sheet,im,(i%cols)*336,(i//cols+ground*rows)*410,label)
    sheet.convert('RGB').save(OUT/f'review-{key}.png')
cols=4;rows=math.ceil(len(frames)/cols)
sheet=Image.new('RGBA',(cols*336,(rows+1)*410),(150,150,145,255))
ImageDraw.Draw(sheet).rectangle((0,rows*410,sheet.width,sheet.height),fill='#302e35')
for i,(im,label) in enumerate(frames):draw_cell(sheet,im,(i%cols)*336,(i//cols)*410,label)
for i,key in enumerate(KEYS):draw_cell(sheet,Image.open(OUT/key/'finished_00.png').convert('RGBA'),i*336,rows*410,key)
sheet.convert('RGB').save(OUT/'contact.png')
(OUT/'checks.json').write_text(json.dumps(checks,indent=2)+'\n')
sources=list(HERE.glob('*.py'))+list(HERE.glob('*.mjs'))+list(HERE.glob('*.png'))+list(HERE.glob('*.md'))+[HERE/'prompts.json']
sources += [ART/'source'/f'{k}.blend' for k in KEYS]+[ART/'source/AB9-r1/build.py',ART/'source/finish_render.py']
sources += [ART/'source/textures'/n for n in ['wood_pole.png','hide_tanned.png','mat_woven.png']]
delivery={'batch':'AB11','revision':1,'brief':'BATCHES.md AB11 rev 1','keys':KEYS,'approvalAuthority':'claude',
 'tools':{'blender':'5.1.2','renderPy':hashlib.sha256((ART/'source/render.py').read_bytes()).hexdigest(),'imageGen':'image_gen.imagegen','post':'Pillow'},
 'prompts':json.loads((HERE/'prompts.json').read_text()),
 'sourceSha256':{p.relative_to(ART).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources},
 'notes':'Eight Blender frames, three packed editable models. AB0 renderer and shadow post, AB9 explicit horizontal sensor fit. All eight metre footprints and (320,576) anchors checked numerically. Store/open store share one geometry constructor: roof and overhead beams are removed, front walls lowered, eaves supplies omitted for an empty floor. Fixed items are outside the usable floor in the closed view only. Fire hearth is centred at runtime flame origin with exactly twelve stones, four mats, two log seats, drying poles, baskets and a plain everyday hand drum. Winter adds surface snow. Generated concept sheets and bark texture; AB0 painted hide/wood and AB9 mat reused. Bark source resized with Lanczos to 1024 square. No installation.'}
(OUT/'delivery.json').write_text(json.dumps(delivery,indent=2)+'\n')
html='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AB11 fire plaza and store review</title>
<style>body{max-width:1400px;margin:32px auto;padding:0 20px;background:#242229;color:#eee5d0;font:16px/1.5 system-ui}a{color:#d9bc8c}img{max-width:100%;height:auto}section{margin:40px 0}</style>
<h1>AB11 revision 1 · fire plaza and store</h1><p>Eight candidate Blender frames. Approval authority: Claude. No installation.</p>
<p><a href="delivery.json">Delivery and exact prompts</a> · <a href="checks.json">Frame measurements</a> · <a href="camera-checks.json">Footprint and anchor checks</a> · <a href="browser-checks.json">Browser assertions</a></p>
<p>Sheets show 1x display size with a 4×4 footprint at each anchor. Captures use paused debug state for construction and seasons. AB9 buildings, AB3 ground, AB5 plants and store props, and AB6 flame are isolated review context.</p>
<section><h2>All frames</h2><img src="contact.png" alt="All fire plaza and store frames plus dark-ground comparison"></section>'''
for key in KEYS:html+=f'<section><h2>{key.replace("_"," ")}</h2><img src="review-{key}.png" alt="Every state on grey and dark backgrounds"></section>'
for state in ('stage1','stage2','stage3','finished','fire'):
    html+=f'<section><h2>{state} close-ups</h2><p>'+' · '.join(f'<a href="{state}-{season}-{width}.png">{season} {width}</a>' for season in ('summer','winter') for width in (1280,2560))+'</p></section>'
for season in ('summer','winter'):
    for zoom in (.5,1,2):html+=f'<section><h2>{season} · zoom {zoom:g}</h2><img src="camp-{season}-{zoom:g}x-1280.png" alt="Camp in {season} at zoom {zoom:g}"><p><a href="camp-{season}-{zoom:g}x-2560.png">2560 × 1440</a></p></section>'
for label in ('empty','half','full'):
    html+=f'<section><h2>Open store · {label}</h2><img src="store-{label}-1280.png" alt="Open store {label} resource piles"><p><a href="store-{label}-2560.png">2560 × 1440</a></p></section>'
(OUT/'review.html').write_text(html+'</html>\n',encoding='utf-8')
print('AB11 prepared:',len(frames),'frames')
