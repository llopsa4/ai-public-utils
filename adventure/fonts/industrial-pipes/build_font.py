"""Original pipe lettering. Rebuild: pip install fonttools brotli shapely pillow; python build_font.py"""
from pathlib import Path
import math
import unicodedata as ud
from shapely.geometry import LineString, Point, Polygon
from shapely.ops import unary_union
from shapely.affinity import translate, scale
from shapely.geometry.polygon import orient
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.basePen import BasePen
from fontTools.svgLib.path import parse_path
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent

# Independently drawn skeletons; no third-party typeface is used.
PATHS = {
'A':'M40 0 L220 650 Q240 710 260 650 L440 0 M105 225 H375',
'B':'M70 0 V700 H270 Q450 700 450 530 Q450 365 270 365 H70 M270 365 Q470 365 470 180 Q470 0 270 0 H70',
'C':'M450 600 Q410 700 260 700 Q70 700 70 510 V190 Q70 0 260 0 Q410 0 450 100',
'D':'M70 0 V700 H240 Q460 700 460 480 V220 Q460 0 240 0 Z',
'E':'M440 700 H70 V0 H440 M70 350 H365',
'F':'M70 0 V700 H440 M70 365 H365',
'G':'M450 600 Q410 700 260 700 Q70 700 70 510 V190 Q70 0 260 0 Q460 0 460 180 V315 H280',
'H':'M70 0 V700 M450 0 V700 M70 350 H450',
'I':'M60 700 H300 M180 700 V0 M60 0 H300',
'J':'M90 700 H440 M360 700 V180 Q360 0 200 0 Q60 0 60 150',
'K':'M70 0 V700 M450 700 L70 320 M230 480 L470 0',
'L':'M70 700 V0 H430',
'M':'M65 0 V700 L290 280 L515 700 V0',
'N':'M70 0 V700 L450 0 V700',
'O':'M260 0 Q70 0 70 190 V510 Q70 700 260 700 Q450 700 450 510 V190 Q450 0 260 0 Z',
'P':'M70 0 V700 H270 Q450 700 450 510 Q450 320 270 320 H70',
'Q':'M260 0 Q70 0 70 190 V510 Q70 700 260 700 Q450 700 450 510 V190 Q450 0 260 0 Z M300 160 L490 -80',
'R':'M70 0 V700 H270 Q450 700 450 510 Q450 320 270 320 H70 M265 320 L470 0',
'S':'M440 605 Q410 700 260 700 Q70 700 70 530 Q70 390 260 350 Q450 310 450 170 Q450 0 260 0 Q100 0 60 95',
'T':'M40 700 H480 M260 700 V0',
'U':'M70 700 V190 Q70 0 260 0 Q450 0 450 190 V700',
'V':'M45 700 L240 25 Q260 -25 280 25 L475 700',
'W':'M45 700 L170 0 L310 430 L450 0 L575 700',
'X':'M60 700 L450 0 M450 700 L60 0',
'Y':'M50 700 L260 350 L470 700 M260 350 V0',
'Z':'M60 700 H450 L60 0 H450',
'a':'M370 370 Q330 490 210 490 Q65 490 65 340 V150 Q65 0 210 0 Q370 0 370 150 M370 490 V0',
'b':'M65 720 V0 M65 350 Q65 490 220 490 Q375 490 375 335 V155 Q375 0 220 0 Q65 0 65 140',
'c':'M365 420 Q320 490 215 490 Q65 490 65 335 V155 Q65 0 215 0 Q320 0 365 70',
'd':'M375 720 V0 M375 350 Q375 490 220 490 Q65 490 65 335 V155 Q65 0 220 0 Q375 0 375 140',
'e':'M65 250 H375 V335 Q375 490 220 490 Q65 490 65 335 V155 Q65 0 220 0 Q325 0 370 65',
'f':'M125 0 V560 Q125 720 270 720 H310 M40 490 H285',
'g':'M375 490 V-95 Q375 -230 220 -230 Q120 -230 75 -180 M375 350 Q375 490 220 490 Q65 490 65 335 V155 Q65 0 220 0 Q375 0 375 140',
'h':'M65 0 V720 M65 330 Q65 490 220 490 Q375 490 375 330 V0',
'i':'M95 0 V490 M95 675 V685',
'j':'M180 490 V-85 Q180 -230 55 -230 H30 M180 675 V685',
'k':'M65 0 V720 M365 490 L65 205 M185 320 L385 0',
'l':'M90 720 V95 Q90 0 180 0 H205',
'm':'M65 0 V490 M65 335 Q65 490 200 490 Q335 490 335 335 V0 M335 335 Q335 490 470 490 Q605 490 605 335 V0',
'n':'M65 0 V490 M65 330 Q65 490 220 490 Q375 490 375 330 V0',
'o':'M220 0 Q65 0 65 155 V335 Q65 490 220 490 Q375 490 375 335 V155 Q375 0 220 0 Z',
'p':'M65 -230 V490 M65 350 Q65 490 220 490 Q375 490 375 335 V155 Q375 0 220 0 Q65 0 65 140',
'q':'M375 -230 V490 M375 350 Q375 490 220 490 Q65 490 65 335 V155 Q65 0 220 0 Q375 0 375 140',
'r':'M65 0 V490 M65 315 Q65 490 220 490 Q285 490 325 440',
's':'M350 425 Q305 490 210 490 Q65 490 65 370 Q65 270 215 245 Q365 220 365 120 Q365 0 210 0 Q110 0 60 65',
't':'M135 670 V125 Q135 0 260 0 H305 M45 490 H300',
'u':'M65 490 V160 Q65 0 220 0 Q375 0 375 160 M375 490 V0',
'v':'M45 490 L210 0 L375 490',
'w':'M45 490 L160 0 L285 340 L410 0 L525 490',
'x':'M60 490 L370 0 M370 490 L60 0',
'y':'M45 490 L210 20 M375 490 L165 -140 Q130 -230 45 -230',
'z':'M60 490 H370 L60 0 H370',
'0':'M260 0 Q80 0 80 190 V510 Q80 700 260 700 Q440 700 440 510 V190 Q440 0 260 0 Z M140 100 L380 600',
'1':'M90 550 L260 700 V0 M95 0 H425',
'2':'M65 550 Q65 700 255 700 Q445 700 445 535 Q445 420 285 310 L70 100 V0 H450',
'3':'M70 610 Q120 700 265 700 Q440 700 440 535 Q440 365 265 365 H210 M265 365 Q450 365 450 185 Q450 0 260 0 Q110 0 60 95',
'4':'M360 0 V700 L55 215 H475',
'5':'M440 700 H90 V390 H260 Q450 390 450 195 Q450 0 260 0 Q115 0 65 90',
'6':'M430 625 Q385 700 260 700 Q75 700 75 480 V180 Q75 0 260 0 Q445 0 445 185 Q445 375 260 375 Q75 375 75 185',
'7':'M60 700 H450 L165 0 M175 310 H380',
'8':'M260 365 Q90 365 90 535 Q90 700 260 700 Q430 700 430 535 Q430 365 260 365 Q60 365 60 185 Q60 0 260 0 Q460 0 460 185 Q460 365 260 365 Z',
'9':'M90 75 Q135 0 260 0 Q445 0 445 220 V520 Q445 700 260 700 Q75 700 75 515 Q75 325 260 325 Q445 325 445 515',
'.':'M90 0 V8', ',':'M110 10 L65 -110', ':':'M90 0 V8 M90 400 V408', ';':'M110 10 L65 -110 M110 400 V408',
'!':'M95 700 V230 M95 0 V8', '?':'M60 565 Q60 700 220 700 Q380 700 380 550 Q380 450 220 365 V230 M220 0 V8',
'-':'M55 270 H300', '_':'M35 -130 H430', '+':'M55 300 H425 M240 115 V485', '=':'M55 195 H425 M55 405 H425',
'/':'M50 -70 L360 740', '\\':'M50 740 L360 -70', '|':'M95 -100 V780',
'(':'M240 740 Q65 590 65 350 Q65 110 240 -40', ')':'M65 740 Q240 590 240 350 Q240 110 65 -40',
'[':'M240 740 H70 V-40 H240', ']':'M70 740 H240 V-40 H70',
'{':'M260 740 Q120 740 120 600 V460 Q120 350 50 350 Q120 350 120 240 V100 Q120 -40 260 -40',
'}':'M50 740 Q190 740 190 600 V460 Q190 350 260 350 Q190 350 190 240 V100 Q190 -40 50 -40',
'<':'M350 550 L65 300 L350 50', '>':'M65 550 L350 300 L65 50',
'"':'M80 700 V520 M230 700 V520', "'":'M90 700 V520', '`':'M70 730 L175 625',
'~':'M50 290 Q125 410 225 310 Q325 210 400 330', '^':'M55 530 L220 700 L385 530',
'*':'M230 600 V200 M55 500 L405 300 M55 300 L405 500',
'#':'M180 720 L90 -20 M390 720 L300 -20 M50 480 H450 M30 220 H430',
'%':'M60 0 L460 700 M145 700 Q60 700 60 600 Q60 500 145 500 Q230 500 230 600 Q230 700 145 700 Z M375 200 Q290 200 290 100 Q290 0 375 0 Q460 0 460 100 Q460 200 375 200 Z',
'&':'M450 0 L130 420 Q65 500 65 565 Q65 700 210 700 Q350 700 350 575 Q350 485 190 360 Q50 250 50 160 Q50 0 220 0 Q390 0 440 310',
'@':'M460 80 Q390 0 240 0 Q30 0 30 260 V450 Q30 700 290 700 Q550 700 550 450 V260 Q550 150 455 150 Q370 150 370 260 V480 M370 365 Q370 480 260 480 Q150 480 150 365 V265 Q150 150 260 150 Q370 150 370 265',
'$':'M420 600 Q380 680 250 680 Q80 680 80 520 Q80 390 250 350 Q420 310 420 180 Q420 20 250 20 Q115 20 65 105 M250 790 V-90',
'€':'M440 610 Q390 700 260 700 Q90 700 90 500 V200 Q90 0 260 0 Q390 0 440 90 M40 430 H340 M40 270 H305',
'£':'M420 610 Q375 700 270 700 Q130 700 130 540 V165 Q130 60 70 0 H440 M50 340 H340',
'·':'M90 270 V278', '…':'M80 0 V8 M240 0 V8 M400 0 V8',
'–':'M40 270 H480', '—':'M40 270 H720', '‘':'M150 740 L80 620', '’':'M150 740 L80 620',
'“':'M150 740 L80 620 M300 740 L230 620', '”':'M150 740 L80 620 M300 740 L230 620',
'¡':'M95 490 V482 M95 260 V-210', '¿':'M220 490 V482 M220 260 V125 Q60 40 60 -50 Q60 -210 220 -210 Q380 -210 380 -75',
'«':'M215 470 L55 270 L215 70 M420 470 L260 270 L420 70', '»':'M55 470 L215 270 L55 70 M260 470 L420 270 L260 70',
'°':'M150 700 Q60 700 60 610 Q60 520 150 520 Q240 520 240 610 Q240 700 150 700 Z',
'×':'M65 490 L395 100 M395 490 L65 100', '÷':'M55 295 H425 M240 95 V103 M240 487 V495',
}

class Flatten(BasePen):
    def __init__(self):
        super().__init__(None)
        self.lines = []
        self.current = []
    def _moveTo(self, p):
        self._endPath()
        self.current = [p]
    def _lineTo(self, p): self.current.append(p)
    def _curveToOne(self, a, b, c):
        p = self.current[-1]
        for i in range(1, 25):
            t = i / 24
            self.current.append(tuple((1-t)**3*p[j]+3*(1-t)**2*t*a[j]+3*(1-t)*t*t*b[j]+t**3*c[j] for j in (0,1)))
    def _qCurveToOne(self, a, b):
        p = self.current[-1]
        for i in range(1, 19):
            t = i / 18
            self.current.append(tuple((1-t)**2*p[j]+2*(1-t)*t*a[j]+t*t*b[j] for j in (0,1)))
    def _closePath(self):
        if self.current: self.current.append(self.current[0])
        self._endPath()
    def _endPath(self):
        if len(self.current)>1: self.lines.append(LineString(self.current))
        self.current=[]

def tube(path, radius=32, collars=True, collar_radius=43):
    pen=Flatten()
    parse_path(path, pen)
    pen._endPath()
    bodies=[]
    for line in pen.lines:
        body=line.buffer(radius, quad_segs=8)
        cuffs=[]
        if collars and line.length>220:
            for d in (65, line.length-65):
                a=line.interpolate(max(0,d-2)); b=line.interpolate(min(line.length,d+2))
                angle=math.atan2(b.y-a.y,b.x-a.x)
                p=line.interpolate(d)
                tx,ty=math.cos(angle),math.sin(angle)
                nx,ny=-ty,tx
                corners=[(p.x+tx*u+nx*v,p.y+ty*u+ny*v) for u,v in [(-11,-collar_radius),(11,-collar_radius),(11,collar_radius),(-11,collar_radius)]]
                cuffs.append(Polygon(corners).buffer(3,quad_segs=2))
        # A recessed white seam gives the solid tube a cylindrical cross section.
        groove=translate(line,xoff=-7,yoff=7).buffer(4,quad_segs=4)
        body=body.difference(groove).union(unary_union(cuffs))
        bodies.append(body)
    return unary_union(bodies).buffer(0)

SHAPES={c:tube(p) for c,p in PATHS.items()}
# Dotless i avoids a dot underneath accents.
SHAPES['ı']=tube('M95 0 V490')
ACCENTS={
 '\u0300':'M-75 90 L45 10', '\u0301':'M-45 10 L75 90',
 '\u0302':'M-100 10 L0 95 L100 10', '\u0303':'M-115 35 Q-55 105 0 50 Q55 -5 115 65',
 '\u0308':'M-85 55 V60 M85 55 V60', '\u030a':'M0 5 Q-65 5 -65 70 Q-65 135 0 135 Q65 135 65 70 Q65 5 0 5 Z',
 '\u0304':'M-105 45 H105', '\u0306':'M-100 85 Q0 -30 100 85',
 '\u0307':'M0 55 V60', '\u030c':'M-100 95 L0 10 L100 95',
 '\u030b':'M-100 10 L-30 100 M35 10 L105 100',
 '\u0327':'M20 -75 L-35 -150 Q90 -150 60 -220 Q20 -265 -65 -225',
 '\u0328':'M80 -65 Q-65 -180 45 -220 H100',
}
for cp in range(0xc0,0x180):
    c=chr(cp); parts=ud.normalize('NFD',c)
    if len(parts)==2 and parts[0] in SHAPES and parts[1] in ACCENTS:
        base=SHAPES['ı' if parts[0]=='i' else parts[0]]
        mark=tube(ACCENTS[parts[1]],radius=22,collars=False)
        minx,miny,maxx,maxy=base.bounds
        y=0 if parts[1] in ('\u0327','\u0328') else maxy+65
        SHAPES[c]=base.union(translate(mark,xoff=(minx+maxx)/2,yoff=y))
for c,base in [('Ø','O'),('ø','o'),('Ł','L'),('ł','l')]:
    g=SHAPES[base]; x0,y0,x1,y1=g.bounds
    SHAPES[c]=g.union(tube(f'M{x0} {y0+60} L{x1} {y1-60}'))
SHAPES['ß']=tube('M65 0 V525 Q65 720 230 720 Q390 720 390 555 Q390 440 255 380 Q430 330 430 170 Q430 0 280 0 H230')
for c,a,b in [('Æ','A','E'),('æ','a','e'),('Œ','O','E'),('œ','o','e')]:
    ga,gb=SHAPES[a],SHAPES[b]
    dx=ga.bounds[2]-gb.bounds[0]+45
    SHAPES[c]=scale(ga.union(translate(gb,xoff=dx)),xfact=.85,yfact=1,origin=(0,0))

def glyph(shape):
    pen=TTGlyphPen(None)
    if shape is not None and not shape.is_empty:
        polys=[shape] if shape.geom_type=='Polygon' else list(shape.geoms)
        for poly in polys:
            if poly.geom_type!='Polygon': continue
            poly=orient(poly,sign=-1)
            for ring in [poly.exterior,*poly.interiors]:
                points=[]
                for x,y in list(ring.coords)[:-1]:
                    point=(round(x),round(y))
                    if not points or point!=points[-1]: points.append(point)
                if len(set(points))<3: continue
                pen.moveTo(points[0])
                for p in points[1:]: pen.lineTo(p)
                pen.closePath()
    return pen.glyph()

def build():
    fb=FontBuilder(1000,isTTF=True)
    cmap={32:'space',160:'space'}
    normalized={}
    advances={'.notdef':(600,60),'space':(300,0)}
    for c,shape in sorted(SHAPES.items(),key=lambda item:ord(item[0])):
        name=f'uni{ord(c):04X}'; cmap[ord(c)]=name
        x0,_,x1,_=shape.bounds
        normalized[name]=translate(shape,xoff=60-x0)
        advances[name]=(round(x1-x0+120),60)
    order=['.notdef','space',*normalized]
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    missing=Polygon([(60,0),(540,0),(540,700),(60,700)]).difference(Polygon([(105,45),(495,45),(495,655),(105,655)]))
    fb.setupGlyf({'.notdef':glyph(missing),'space':glyph(None),**{n:glyph(g) for n,g in normalized.items()}})
    fb.setupHorizontalMetrics(advances)
    fb.setupHorizontalHeader(ascent=1080,descent=-340)
    fb.setupNameTable({'familyName':'Cinderpipe','styleName':'Regular','uniqueFontIdentifier':'Cinderpipe Regular 1.000','fullName':'Cinderpipe Regular','psName':'Cinderpipe-Regular','version':'Version 1.000','copyright':'Original Cinderpipe geometry, created for the adventure project, 2026.','description':'Industrial pipe display lettering with coupling collars and inset seams.'})
    fb.setupOS2(sTypoAscender=1080,sTypoDescender=-340,sTypoLineGap=0,usWinAscent=1100,usWinDescent=350,sxHeight=490,sCapHeight=700,fsType=0)
    fb.setupPost(); fb.setupMaxp()
    fb.save(HERE/'Cinderpipe-Regular.ttf')
    web=TTFont(HERE/'Cinderpipe-Regular.ttf'); web.flavor='woff2'; web.save(HERE/'Cinderpipe-Regular.woff2')
    print(f'Built {len(cmap)} mapped characters, {len(order)} glyphs.')
    preview()

def preview():
    im=Image.new('RGB',(1800,1580),'#141c20'); d=ImageDraw.Draw(im)
    ui=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',26)
    d.text((70,40),'CINDERPIPE / ORIGINAL INDUSTRIAL DISPLAY FONT',font=ui,fill='#aebcbb')
    for text,y,size in [('Cinderfold',125,172),('INDUSTRIAL PIPES',355,108),('ABCDEFGHIJKLM',555,82),('NOPQRSTUVWXYZ',680,82),('abcdefghijklm',825,88),('nopqrstuvwxyz',955,88),('0123456789',1100,93),('ÀÉÍÒÚ àéíòú Çç Ññ Üü ·',1240,66),('!? @ # % & () + = € £',1375,66)]:
        f=ImageFont.truetype(str(HERE/'Cinderpipe-Regular.ttf'),size)
        d.text((70,y),text,font=f,fill='#e3b979',anchor='lt')
    im.save(HERE/'specimen.png')

if __name__=='__main__': build()
