"""AB9 immutable review delivery, sheets, source hashes and loop previews."""
import hashlib
import json
import math
from pathlib import Path
from PIL import Image,ImageDraw,ImageChops
HERE=Path(__file__).resolve().parent
ART=HERE.parents[1]
OUT=ART/'inbox'/'AB9'
KEYS=['building_'+s for s in ['gathering_spot','hunting_lodge','drying_rack','horse_corral']]
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
for state in ('finished','winter'):
    ims=[Image.open(OUT/'building_drying_rack'/f'{state}_{i:02d}.png').convert('RGBA') for i in range(4)]
    preview=[]
    for im in ims:
        bg=Image.new('RGBA',(384,512),'#969691');bg.alpha_composite(im);preview.append(bg.convert('RGB'))
    preview[0].save(OUT/f'drying-{state}.gif',save_all=True,append_images=preview[1:],duration=250,loop=0,disposal=2)
    checks[f'loop/{state}']={'fps':4,'periodMs':1000,'adjacentMeanAbsoluteDifferences':[]}
    for a,b in zip(ims,ims[1:]+ims[:1]):
        diff=ImageChops.difference(a,b);hist=diff.histogram()
        checks[f'loop/{state}']['adjacentMeanAbsoluteDifferences'].append(sum((i%256)*v for i,v in enumerate(hist))/(384*512*4))
(OUT/'checks.json').write_text(json.dumps(checks,indent=2)+'\n')
sources=list(HERE.glob('*.py'))+list(HERE.glob('*.mjs'))+list(HERE.glob('*.png'))+list(HERE.glob('*.md'))
sources += [ART/'source'/f'{k}.blend' for k in KEYS]
sources += [ART/'source/textures'/n for n in ['wood_pole.png','hide_tanned.png','mat_woven.png']]
delivery={'batch':'AB9','revision':1,'brief':'BATCHES.md AB9 rev 1','keys':KEYS,'approvalAuthority':'claude',
 'tools':{'blender':'5.1.2','renderPy':hashlib.sha256((ART/'source/render.py').read_bytes()).hexdigest(),'imageGen':'image_gen.imagegen','post':'Pillow'},
 'prompts':prompts,'sourceSha256':{p.relative_to(ART).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources},
 'notes':'26 Blender frames: 5 states each, with four frames in both drying-rack finished and winter states. Four-metre square footprints and the manifest anchor are checked by camera projection. AB0 camera rotation, width-based ortho scale/shift, lighting, supersampling and shadow post reused. AB9 wrapper explicitly sets horizontal sensor fit: AUTO uses vertical fit in portrait cells, inflates the footprint by 512/384 and displaces the anchor. Shared render.py and prior art unchanged. AB0 hide/wood reused; new generated woven-mat material. Editable Blender state collections and strip sway actions retained. Empty corral: horses are runtime sprites. No tipi re-render. No installation.'}
(OUT/'delivery.json').write_text(json.dumps(delivery,indent=2)+'\n')
html='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AB9 camp buildings review</title>
<style>body{max-width:1200px;margin:32px auto;padding:0 20px;background:#242229;color:#eee5d0;font:16px/1.5 system-ui}a{color:#d9bc8c}img{max-width:100%;height:auto}section{margin:40px 0}</style>
<h1>AB9 revision 1 · camp buildings</h1><p>26 candidate Blender frames. Approval authority: Claude. No installation.</p>
<p><a href="delivery.json">Delivery and exact prompts</a> · <a href="checks.json">Frame measurements</a> · <a href="camera-checks.json">Footprint and anchor checks</a> · <a href="browser-checks.json">Browser assertions</a></p>
<p>Sheets show actual game display size, with a 2×2 footprint outline at each anchor. Game captures use paused debug state for stages and seasons; AB3 terrain and AB5 plants are review context.</p>
<section><h2>All frames</h2><a href="contact.png"><img src="contact.png" alt="All camp building frames with a dark-ground strip"></a></section>'''
for key in KEYS:html+=f'<section><h2>{key.removeprefix("building_").replace("_"," ")}</h2><img src="review-{key}.png" alt="All states on grey and dark grounds at actual display size"></section>'
html+='<section><h2>Drying strip sway · four frames at 4 fps</h2><img src="drying-finished.gif" alt="Summer drying rack sway"><img src="drying-winter.gif" alt="Winter drying rack sway"></section>'
for season in ('summer','winter'):
    for zoom in (.5,1,2):html+=f'<section><h2>{season} · zoom {zoom:g}</h2><img src="camp-{season}-{zoom:g}x-1280.png" alt="Camp building review in {season} at zoom {zoom:g}"><p><a href="camp-{season}-{zoom:g}x-2560.png">2560 × 1440 capture</a></p></section>'
(OUT/'review.html').write_text(html+'</html>\n',encoding='utf-8')
print('AB9 prepared:',len(frames),'frames')
