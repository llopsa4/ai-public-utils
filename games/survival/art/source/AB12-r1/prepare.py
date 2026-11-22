"""Review sheets, true-size loops, delivery provenance. Run after all renders."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageChops
import json,hashlib
HERE=Path(__file__).resolve().parent;ART=HERE.parents[1];OUT=ART/'inbox/AB12'
FACINGS=['s','sw','w','nw','n','ne','e','se'];COLORS=['#e0905a','#7fa8d8']
def frame(f,i,tint=None):
    a=Image.open(OUT/f'person_man/base_walk_{f}_{i:02}.png').convert('RGBA')
    if tint:
        b=Image.open(OUT/f'person_man/cloth_walk_{f}_{i:02}.png').convert('RGBA')
        rgb=ImageChops.multiply(b.convert('RGB'),Image.new('RGB',b.size,tint));b=Image.merge('RGBA',(*rgb.split(),b.getchannel('A')))
        a=Image.alpha_composite(a,b)
    return a
sheet=Image.new('RGB',(1536,16*92),'#777777');d=ImageDraw.Draw(sheet)
for fidx,f in enumerate(FACINGS):
    for layer in ['base','cloth']:
        row=fidx*2+(layer=='cloth')
        for ground,bg in enumerate(['#777777','#292630']):
            for i in range(8):
                x=ground*768+i*96;y=row*92
                d.rectangle((x,y,x+95,y+91),fill=bg)
                # 64x32 world tile, same ground anchor as the cell at actual display size.
                d.line([(x+48,y+64-16),(x+80,y+64),(x+48,y+80),(x+16,y+64),(x+48,y+48)],fill='#a69a80')
                im=Image.open(OUT/f'person_man/{layer}_walk_{f}_{i:02}.png').resize((96,80),Image.Resampling.LANCZOS)
                sheet.paste(im,(x,y),im);d.text((x+2,y+81),f'{f} {layer} {i}',fill='white')
sheet.save(OUT/'contact.png')
for scale in [1,2]:
    frames=[]
    for i in range(8):
        im=Image.new('RGB',(768*scale,204*scale),'#777777');dd=ImageDraw.Draw(im)
        for row,tint in enumerate(COLORS):
            for col,f in enumerate(FACINGS):
                pic=frame(f,i,tint).resize((96*scale,80*scale),Image.Resampling.LANCZOS)
                im.paste(pic,(col*96*scale,(24+row*88)*scale),pic)
                dd.text(((col*96+3)*scale,(10+row*88)*scale),f'{f} {tint}',fill='white')
        frames.append(im)
    frames[0].save(OUT/f'walk-{scale}x.gif',save_all=True,append_images=frames[1:],duration=[80,90,80,80,90,80,80,90],loop=0,disposal=2)
    frames[0].save(OUT/f'family-colours-{scale}x.png')
source_files=[HERE/'build.py',HERE/'render_figures.py',HERE/'finish.py',HERE/'human_rig.blend',HERE/'concept_person_man.png',ART/'source/render.py',ART/'source/finish_render.py',ART/'source/AB0-r1/hide.png']
source_files += [HERE/p for p in ['prepare.py','preview.mjs','check_rig.py','README.md','rig-checks.json','projection-checks.json']]
source_files += [ART/'source/human_rig.blend']
delivery=dict(batch='AB12',revision=1,brief='BATCHES.md AB12 rev 1',keys=['person_man'],approvalAuthority='user',
 tools=dict(blender='5.1',renderPy=hashlib.sha256((ART/'source/render.py').read_bytes()).hexdigest(),imageGen='AB0 concept and painted hide reused; no new generation'),
 prompts=json.loads((ART/'inbox/done/AB0-r1/delivery.json').read_text())['prompts'],
 sources={str(p.relative_to(ART)):hashlib.sha256(p.read_bytes()).hexdigest() for p in source_files},
 notes='128 walk PNGs only. AB0 approved concept and painted hide reused. Shared rig and packed materials; target-driven two-bone legs and keyed arm swing. Figure renderer extension uses horizontal sensor fit. Base includes neutral shirt and shadow; cloth is greyscale with noncloth holdouts. Isolated walk-only game preview; no installed assets or runtime code changed. AB13 adds the other actions. No approval or installation implied.')
(OUT/'delivery.json').write_text(json.dumps(delivery,indent=2)+'\n')
(OUT/'review.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>AB12 human rig review</title><style>body{margin:32px;background:#242229;color:#eee;font:18px system-ui}main{max-width:1200px;margin:auto}img{max-width:100%;height:auto}a{color:#d9bc8c}figure{margin:24px 0}p{max-width:850px}</style><main><h1>AB12 · Human rig and walking</h1><p>Approval authority: user. Candidate only. Eight directions, Cottonwood orange and Kingfisher blue. The first loop is the normal game display size at zoom 1; the second doubles it. The remaining men’s actions belong to AB13.</p><figure><img src="walk-1x.gif" alt="Walking man in eight directions and both family colours at normal display size"><figcaption>Normal display size · 12 frames per second</figcaption></figure><figure><img src="walk-2x.gif" alt="The same walking cycles enlarged two times"><figcaption>Zoom 2</figcaption></figure><p><a href="contact.png">All base and cloth frames on grey and dark grounds</a> · <a href="delivery.json">Delivery, source hashes and retained AB0 prompts</a> · <a href="../../source/AB12-r1/concept_person_man.png">Approved AB0 concept</a></p><h2>In-game previews</h2><p>Candidate atlas loaded in a private game copy. Walking is driven through the normal people renderer. Other ages, women and remaining animations are outside this batch.</p><figure><img src="camp-1x-1280.png" alt="Walking men in both family colours in the game at zoom one"></figure><figure><img src="camp-2x-1280.png" alt="Walking men in both family colours in the game at zoom two"></figure><p><a href="browser-checks.json">Browser checks</a> · <a href="../../source/AB12-r1/README.md">Reproduction and limitations</a></p></main></html>''',encoding='utf-8')
print('AB12 review prepared.')
