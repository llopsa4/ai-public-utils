"""Build complete per-action review plates, loops, overview and hashed delivery."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageChops
import json,hashlib,shutil
HERE=Path(__file__).resolve().parent;SOURCE=HERE.parent;ART=SOURCE.parent;OUT=ART/'inbox/AB13'
OUT.mkdir(parents=True,exist_ok=True);(OUT/'person_man').mkdir(exist_ok=True)
for p in (ART/'inbox/AB12/person_man').glob('*_walk_*.png'):shutil.copy2(p,OUT/'person_man'/p.name)
M=json.loads((ART/'manifest.json').read_text())['person_man'];F=['s','sw','w','nw','n','ne','e','se'];C=['#e0905a','#7fa8d8']
def pic(anim,f,i,layer='base',tint=None):
    a=Image.open(OUT/f'person_man/{layer}_{anim}_{f}_{i:02}.png').convert('RGBA')
    if tint:
        b=pic(anim,f,i,'cloth');rgb=ImageChops.multiply(b.convert('RGB'),Image.new('RGB',b.size,tint));b=Image.merge('RGBA',(*rgb.split(),b.getchannel('A')));a=Image.alpha_composite(a,b)
    return a
allrows=[];html=[];summary=Image.new('RGB',(1536,len(M['anims'])*112),'#777777');sd=ImageDraw.Draw(summary)
for ai,(anim,spec) in enumerate(M['anims'].items()):
    n=spec['frames'];sheet=Image.new('RGB',(1536,16*92),'#777777');d=ImageDraw.Draw(sheet)
    for row,f in enumerate(F):
        for li,layer in enumerate(['base','cloth']):
            y=(row*2+li)*92
            for bgcol,bg in enumerate(['#777777','#292630']):
                for i in range(n):
                    x=bgcol*768+i*96;d.rectangle((x,y,x+95,y+91),fill=bg)
                    d.line([(x+48,y+48),(x+80,y+64),(x+48,y+80),(x+16,y+64),(x+48,y+48)],fill='#a69a80')
                    im=pic(anim,f,i,layer).resize((96,80),Image.Resampling.LANCZOS);sheet.paste(im,(x,y),im);d.text((x+2,y+81),f'{f} {layer} {i}',fill='white')
    sheet.save(OUT/f'contact-{anim}.png');allrows.append(sheet)
    for scale in [1,2]:
        frames=[]
        for i in range(n):
            im=Image.new('RGB',(768*scale,204*scale),'#777777');dd=ImageDraw.Draw(im)
            for row,tint in enumerate(C):
                for col,f in enumerate(F):
                    a=pic(anim,f,i,tint=tint).resize((96*scale,80*scale),Image.Resampling.LANCZOS);im.paste(a,(col*96*scale,(24+row*88)*scale),a);dd.text(((col*96+3)*scale,(10+row*88)*scale),f'{f} {tint}',fill='white')
            frames.append(im)
        durations=[round((i+1)*100/spec['fps'])*10-round(i*100/spec['fps'])*10 for i in range(n)]
        if not spec['loop']:durations[-1]=900
        frames[0].save(OUT/f'{anim}-{scale}x.gif',save_all=True,append_images=frames[1:],duration=durations,loop=0,disposal=2)
    sd.text((8,ai*112+2),f"{anim} · {n} frames @ {spec['fps']} fps",fill='white')
    for row,tint in enumerate(C):
        for col,f in enumerate(F):
            a=pic(anim,f,min(n-1,3),tint=tint).resize((96,80));summary.paste(a,(row*768+col*96,ai*112+24),a)
    html.append(f'<section><h2>{anim}</h2><img src="{anim}-1x.gif" alt="{anim} in eight facings and two family colours"><p><a href="{anim}-2x.gif">Zoom 2 loop</a> · <a href="contact-{anim}.png">Every base and cloth frame on grey and dark</a></p></section>')
contact=Image.new('RGB',(1536,len(allrows)*1472))
for i,a in enumerate(allrows):contact.paste(a,(0,i*1472))
contact.save(OUT/'contact.png');summary.save(OUT/'overview.png')
sources=[p for p in HERE.iterdir() if p.suffix in ['.py','.mjs','.md','.blend','.json']]+[SOURCE/'AB12-r1/human_rig.blend',SOURCE/'AB12-r1/finish.py',SOURCE/'person_man.blend',SOURCE/'human_rig.blend',SOURCE/'render.py']
sources+=list((HERE/'raw').glob('*/camera-checks.json'))
sources += [SOURCE/p for p in ['AB0-r1/hide.png','textures/wood_pole.png','textures/stone_painted.png','textures/mat_woven.png']]
sources += [SOURCE/'AB12-r1/concept_person_man.png']
prompts=json.loads((ART/'inbox/AB12/delivery.json').read_text())['prompts']
prompts={k:v for k,v in prompts.items() if k in ['person_man/concept','hide','wood']}
for batch,prop in [('AB8','stone_painted'),('AB9','mat_woven')]:prompts[prop]=json.loads((ART/'inbox'/batch/'delivery.json').read_text())['prompts'][prop]
delivery=dict(batch='AB13',revision=1,brief='BATCHES.md AB13 rev 1',keys=['person_man'],approvalAuthority='Claude',
 tools=dict(blender='5.1.2',renderPy=hashlib.sha256((SOURCE/'render.py').read_bytes()).hexdigest(),imageGen='Retained approved AB0 concept and painted textures; no new image generation'),
 prompts=prompts,
 sources={str(p.relative_to(ART)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sources},
 notes='Complete 88-frame action set x eight facings x base/cloth = 1408 PNGs. Walk frames copied byte-for-byte from user-approved AB12. The approved body meshes are unchanged; wrist IK, separate plain tools and actions added in a new model. Fixed orthographic camera, light, EEVEE 64 samples and 2x supersampling. Contact-sheet render freezes poses at ground-plane offsets, then crops exact cells. Generated texture coordinates retained per source object. Candidates only; no installation. Fish and dance remain art previews because those activities are future gameplay.')
(OUT/'delivery.json').write_text(json.dumps(delivery,indent=2)+'\n',encoding='utf-8')
(OUT/'review.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>AB13 man actions</title><style>body{margin:32px;background:#242229;color:#eee;font:18px system-ui}main{max-width:1540px;margin:auto}img{max-width:100%;height:auto}a{color:#d9bc8c}section{margin:40px 0}</style><main><h1>AB13 · Man action library</h1><p>Approval authority: Claude. Candidate only. Uses the AB12 figure approved by the user on 22 November 2026. Both family colours, eight directions, all fifteen animations. Walk is unchanged. Death repeats here after a held final pose for review; the game plays it once.</p><p><a href="overview.png">Action overview</a> · <a href="contact.png">All 1,408 frames</a> · <a href="delivery.json">Provenance</a> · <a href="browser-checks.json">Game checks</a></p>'+''.join(html)+'<h2>Game previews</h2><img src="camp-actions-2x-1280.png" alt="Man action candidates in game"><p>Each action is also captured separately at zoom 0.5, 1 and 2 on both screen sizes. Fish and dance are previewed directly through the renderer; gameplay for those activities comes later.</p></main>',encoding='utf-8')
print('Prepared AB13 review and complete delivery.')
