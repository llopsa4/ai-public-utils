"""Second 'the Rift' direction: heavy, narrow blackletter with pipe fittings."""
from pathlib import Path
import sys
from shapely.geometry import Polygon
from shapely.affinity import translate
from shapely.ops import unary_union
from PIL import Image, ImageDraw
from build_font import tube

HERE = Path(__file__).resolve().parent
LIGHT = '--light' in sys.argv
STEM_SCALE = .58 if LIGHT else 1
OUTPUT = 'the-Rift-blackletter-light' if LIGHT else 'the-Rift-blackletter'

# Each letter is drawn from scratch. Thick uprights and thinner broken arches
# borrow the rhythm of a broad-nib manuscript, retaining pipe seams and collars.
strokes = {
    't': [('M125 630 V100 L195 30', 53),
          ('M35 455 H270 M195 30 L265 100 M125 630 L190 690', 25)],
    'h': [('M85 740 V80 L140 25 M330 385 V80 L380 25', 53),
          ('M85 345 L205 475 L330 385 M35 695 L85 740 L145 760 M140 25 L185 70', 26)],
    'e': [('M85 365 V115', 53),
          ('M85 365 L220 475 L335 350 L85 195 M85 115 L220 20 L335 105', 28)],
    'R': [('M130 690 V45 M430 565 V455', 57),
          ('M25 610 Q-10 755 140 730 L295 730 L430 615 V565 M430 455 L300 345 H130 M300 345 L405 100 Q445 -5 545 55 M55 10 L130 65 L205 10', 30),
          ('M230 675 V425', 15)],
    'i': [('M100 405 V85 L155 30', 53),
          ('M45 415 L100 465 L155 415 M155 30 L210 85 M75 615 L120 660', 26)],
    'f': [('M135 540 V-90 L80 -155', 53),
          ('M135 540 L260 710 Q325 745 380 680 M45 435 H285 M80 -155 L10 -105', 27)],
}

def letter(c):
    pieces = [tube(path, radius=width*STEM_SCALE, collars=width>=25,
                   collar_radius=width*STEM_SCALE+6 if LIGHT else 43)
              for path, width in strokes[c]]
    # Crisp beak terminals differ from the previous rounded arrowhead ornaments.
    if c in 'hi':
        x,y = (85,740) if c == 'h' else (100,465)
        pieces.append(Polygon([(x+dx*STEM_SCALE,y+dy*STEM_SCALE)
                               for dx,dy in [(-53,-48),(53,-48),(83,42),(-12,12)]]))
    return unary_union(pieces).buffer(0)

letters={c:letter(c) for c in strokes}
pieces=[]; cursor=0
for c in 'the Rift':
    if c == ' ':
        cursor += 145
        continue
    g=letters[c]; left,_,right,_=g.bounds
    pieces.append(translate(g,xoff=cursor-left))
    cursor += right-left+38
word=unary_union(pieces)
x0,y0,x1,y1=word.bounds
margin=125
width=x1-x0+2*margin; height=y1-y0+2*margin
word=translate(word,xoff=margin-x0,yoff=margin-y0)
polys=list(word.geoms) if word.geom_type=='MultiPolygon' else [word]
commands=[]
for p in polys:
    for ring in [p.exterior,*p.interiors]:
        commands.append('M'+' L'.join(f'{x:.2f},{height-y:.2f}' for x,y in ring.coords)+' Z')
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.2f} {height:.2f}">
<title>the Rift — blackletter pipe lettering study</title>
<rect width="100%" height="100%" fill="#efe3c9"/>
<path fill="#302d29" fill-rule="evenodd" d="{' '.join(commands)}"/>
</svg>'''
(HERE/f'{OUTPUT}.svg').write_text(svg,encoding='utf-8')
factor=2
im=Image.new('RGB',(round(width*factor),round(height*factor)),'#efe3c9')
d=ImageDraw.Draw(im)
for p in polys:
    d.polygon([(round(x*factor),round((height-y)*factor)) for x,y in p.exterior.coords],fill='#302d29')
    for ring in p.interiors:
        d.polygon([(round(x*factor),round((height-y)*factor)) for x,y in ring.coords],fill='#efe3c9')
im.resize((1800,round(1800*height/width)),Image.Resampling.LANCZOS).save(HERE/f'{OUTPUT}.png')
print(f'Saved {OUTPUT}.svg and {OUTPUT}.png')
