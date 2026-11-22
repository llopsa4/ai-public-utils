"""Compose fixed-grid 1x/2x join inspection plates, no runtime modifications."""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw
HERE=Path(__file__).resolve().parent
OUT=HERE.parents[1]/'inbox/AB8'
shapes={'L':[(x,0) for x in range(5)]+[(4,y) for y in range(1,5)],
        'T':[(x,0) for x in range(5)]+[(2,y) for y in range(1,5)],
        'cross':[(x,2) for x in range(5)]+[(2,y) for y in (0,1,3,4)]}
checks=[]
for state in (sys.argv[1:] or ['stage1','stage2','stage3','finished','winter']):
    plate=Image.new('RGBA',(1200,380),'#969691')
    draw=ImageDraw.Draw(plate)
    for number,(name,tiles) in enumerate(shapes.items()):
        positions=set(tiles);start=200+400*number
        draw.text((start-180,12),f'{name}: {state}',fill='#251e18')
        for x,y in sorted(tiles,key=lambda t:t[0]+t[1]):
            mask=sum(bit for bit,dx,dy in [(1,0,-1),(2,1,0),(4,0,1),(8,-1,0)] if (x+dx,y+dy) in positions)
            im=Image.open(OUT/'building_barricade'/f'{state}_{mask}.png').convert('RGBA')
            px=start+(x-y)*64;py=100+(x+y)*32
            draw.line([(px,py-32),(px+64,py),(px,py+32),(px-64,py),(px,py-32)],fill='#77776c')
            plate.alpha_composite(im,(px-128,py-160))
            checks.append({'shape':name,'state':state,'tile':[x,y],'mask':mask,'anchor':[px,py]})
    plate.convert('RGB').save(OUT/f'joins-{state}-2x.png')
    plate.resize((600,190),Image.Resampling.LANCZOS).convert('RGB').save(OUT/f'joins-{state}-1x.png')
(OUT/'join-layout.json').write_text(json.dumps(checks,indent=2)+'\n',encoding='utf-8')
print('Composed L, T and cross for the requested states at 1x/2x.')
