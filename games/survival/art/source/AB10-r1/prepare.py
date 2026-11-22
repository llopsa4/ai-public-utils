"""AB10 immutable review delivery, sheets, source hashes and review previews."""
import hashlib
import json
import math
from pathlib import Path
from PIL import Image,ImageDraw,ImageChops
HERE=Path(__file__).resolve().parent
ART=HERE.parents[1]
OUT=ART/'inbox'/'AB10'
KEYS=['building_'+s for s in ['healers_lodge','scouts_lodge','lancers_lodge','archers_lodge','spirit_lodge']]
STATES=['stage1','stage2','stage3','finished','winter']
OUT.mkdir(parents=True,exist_ok=True)
manifest=json.loads((ART/'manifest.json').read_text())
prompts=json.loads((HERE/'prompts.json').read_text())
frames=[];checks={}
def draw_cell(sheet,im,x,y,label):
    d=ImageDraw.Draw(sheet);ax,ay=x+108,y+192
    d.line([(ax,ay-32),(ax+64,ay),(ax,ay+32),(ax-64,ay),(ax,ay-32)],fill='#8d8980',width=1)
    sheet.alpha_composite(im.resize((192,256),Image.Resampling.LANCZOS),(x+12,y))
    d.text((x+7,y+258),label,fill='#eee5d0' if sheet.getpixel((x+2,y+2))[0]<90 else '#30251b')
for key in KEYS:
    entries=[]
    for state in STATES:
        count=(manifest[key].get('anims') or {}).get(state,{}).get('frames',1)
        for i in range(count):
            file=OUT/key/f'{state}_{i:02d}.png'
            im=Image.open(file).convert('RGBA');entries.append((im,f'{state} {i:02d}'))
            checks[f'{key}/{state}/{i:02d}']={'cell':list(im.size),'alphaBounds':im.getchannel('A').getbbox(),'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}
    cols=5;rows=math.ceil(len(entries)/cols)
    review=Image.new('RGBA',(cols*216,rows*278*2),(150,150,145,255))
    ImageDraw.Draw(review).rectangle((0,rows*278,review.width,review.height),fill='#302e35')
    for i,(im,label) in enumerate(entries):
        for ground in (0,1):draw_cell(review,im,(i%cols)*216,(i//cols+ground*rows)*278,label)
        frames.append((im,key.removeprefix('building_')+' '+label))
    review.convert('RGB').save(OUT/f'review-{key}.png')
contact=Image.new('RGBA',(5*216,math.ceil(len(frames)/5)*278+278),(150,150,145,255))
ImageDraw.Draw(contact).rectangle((0,contact.height-278,contact.width,contact.height),fill='#302e35')
for i,(im,label) in enumerate(frames):draw_cell(contact,im,(i%5)*216,(i//5)*278,label)
for i,key in enumerate(KEYS):draw_cell(contact,Image.open(OUT/key/'finished_00.png').convert('RGBA'),i*216,contact.height-278,key.removeprefix('building_'))
contact.convert('RGB').save(OUT/'contact.png')
(OUT/'checks.json').write_text(json.dumps(checks,indent=2)+'\n')
sources=list(HERE.glob('*.py'))+list(HERE.glob('*.mjs'))+list(HERE.glob('*.png'))+list(HERE.glob('*.md'))
sources += [HERE/'prompts.json', ART/'source/AB9-r1/build.py', ART/'source/finish_render.py']
sources += [ART/'source'/f'{k}.blend' for k in KEYS]
sources += [ART/'source/textures'/n for n in ['wood_pole.png','hide_tanned.png','mat_woven.png']]
delivery={'batch':'AB10','revision':1,'brief':'BATCHES.md AB10 rev 1','keys':KEYS,'approvalAuthority':'claude',
 'tools':{'blender':'5.1.2','renderPy':hashlib.sha256((ART/'source/render.py').read_bytes()).hexdigest(),'imageGen':'image_gen.imagegen','post':'Pillow'},
 'prompts':prompts,'sourceSha256':{p.relative_to(ART).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources},
 'notes':'25 Blender frames: five lodges, five states each. Four metre footprints and the manifest anchor are checked numerically. Shared AB0 renderer, supersampling and shadow post, with AB9 horizontal sensor fit. AB9 helper definitions reused without its model-writing loop; all five models are separate packed Blender files. AB0 hide/wood and AB9 woven material reused. Pale spirit hide is desaturated from the painted hide material, with faint cool interior floor light. Dried generic herbs, plain pennant, three stone-point lances and bound unpainted straw target identify the lodges. No installation.'}

(OUT/'delivery.json').write_text(json.dumps(delivery,indent=2)+'\n')
html='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AB10 society lodges review</title>
<style>body{max-width:1200px;margin:32px auto;padding:0 20px;background:#242229;color:#eee5d0;font:16px/1.5 system-ui}a{color:#d9bc8c}img{max-width:100%;height:auto}section{margin:40px 0}</style>
<h1>AB10 revision 1 &middot; society lodges</h1><p>25 candidate Blender frames. Approval authority: Claude. No installation.</p>
<p><a href="delivery.json">Delivery and exact prompts</a> &middot; <a href="checks.json">Frame measurements</a> &middot; <a href="camera-checks.json">Footprint and anchor checks</a> &middot; <a href="browser-checks.json">Browser assertions</a></p>
<p>Sheets show actual game display size, with a 2&times;2 footprint outline at each anchor. Game captures use paused debug state for stages and seasons; AB9 camp buildings, AB3 terrain and AB5 plants are review context.</p>
<section><h2>All frames</h2><a href="contact.png"><img src="contact.png" alt="All society lodge frames with a dark-ground strip"></a></section>'''
for key in KEYS:
    suffix=key.removeprefix('building_')
    html+=f'<section><h2>{suffix.replace("_"," ")}</h2><img src="review-{key}.png" alt="All states on grey and dark grounds at actual display size"><p>'
    html+=' &middot; '.join(f'<a href="{suffix}-{season}-{width}.png">{season} {width}</a>' for season in ('summer','winter') for width in (1280,2560))
    html+='</p></section>'
for season in ('summer','winter'):
    for zoom in (.5,1,2):html+=f'<section><h2>{season} &middot; zoom {zoom:g}</h2><img src="camp-{season}-{zoom:g}x-1280.png" alt="Camp building review in {season} at zoom {zoom:g}"><p><a href="camp-{season}-{zoom:g}x-2560.png">2560 &times; 1440 capture</a></p></section>'
(OUT/'review.html').write_text(html+'</html>\n',encoding='utf-8')
print('AB10 prepared:',len(frames),'frames')
