"""A lettering study of 'the Rift'; does not alter the installable font."""
from pathlib import Path
from shapely.affinity import translate, scale
from shapely.ops import unary_union
from PIL import Image, ImageDraw
from build_font import tube

HERE=Path(__file__).resolve().parent

# Pointed shoulders, diagonal terminals and bracket feet echo medieval book hands.
# Round cross sections and coupling collars retain the industrial pipe construction.
paths={
 't':'M160 655 V100 Q160 25 245 0 L310 65 M50 465 L280 505 M115 650 L190 720',
 'h':'M80 0 V740 M80 345 L225 515 L365 395 V60 L415 10 M30 700 L80 750 L135 700 M25 0 H135',
 'e':'M370 105 L230 0 L75 115 V365 L225 510 L365 385 L75 225',
 'R':'M95 0 V700 M45 700 H270 L445 570 V435 L280 330 H95 M260 330 L455 10 L505 60 M35 0 H160 M70 700 L120 750',
 'i':'M100 460 V65 L155 10 M50 430 L100 480 L150 430 M100 635 L135 670 L100 705 L65 670 Z',
 'f':'M135 -140 V575 L285 725 L385 635 M45 440 L300 490 M85 -110 L135 -160 L185 -110',
}
shapes={c:tube(p,radius=35) for c,p in paths.items()}
word=[]; x=0
for c in 'the Rift':
    if c==' ':
        x+=180
        continue
    g=shapes[c]
    x0,_,x1,_=g.bounds
    word.append(translate(g,xoff=x-x0))
    x+=x1-x0+55
shape=scale(unary_union(word),xfact=.91,yfact=1,origin=(0,0))
x0,y0,x1,y1=shape.bounds
margin=140
width=x1-x0+margin*2; height=y1-y0+margin*2
shape=translate(shape,xoff=margin-x0,yoff=margin-y0)
polys=list(shape.geoms) if shape.geom_type=='MultiPolygon' else [shape]
commands=[]
for p in polys:
    for ring in [p.exterior,*p.interiors]:
        coords=list(ring.coords)
        commands.append('M'+' L'.join(f'{px:.2f},{height-py:.2f}' for px,py in coords)+' Z')
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.2f} {height:.2f}">
<title>the Rift — medieval industrial pipe lettering study</title>
<rect width="100%" height="100%" fill="#efe3c9"/>
<path fill="#45372d" fill-rule="evenodd" d="{' '.join(commands)}"/>
</svg>'''
(HERE/'the-Rift-medieval.svg').write_text(svg,encoding='utf-8')
factor=2
im=Image.new('RGB',(round(width*factor),round(height*factor)),'#efe3c9')
d=ImageDraw.Draw(im)
for p in polys:
    d.polygon([(round(px*factor),round((height-py)*factor)) for px,py in p.exterior.coords],fill='#45372d')
    for ring in p.interiors:
        d.polygon([(round(px*factor),round((height-py)*factor)) for px,py in ring.coords],fill='#efe3c9')
im.resize((1800,round(1800*height/width)),Image.Resampling.LANCZOS).save(HERE/'the-Rift-medieval.png')
print('Saved the-Rift-medieval.svg and the-Rift-medieval.png')
