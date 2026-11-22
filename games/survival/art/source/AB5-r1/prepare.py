"""Prepare grounded, season-aligned AB5 sprites and review sheets."""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps, PngImagePlugin

HERE = Path(__file__).resolve().parent
ART = HERE.parents[1]
INBOX = ART / 'inbox' / 'AB5'
JOBS = json.loads((HERE/'subjects.json').read_text(encoding='utf-8'))
MANIFEST = json.loads((ART/'manifest.json').read_text(encoding='utf-8'))
SEASONS = ['spring','summer','autumn','winter']
LANCZOS = Image.Resampling.LANCZOS


def font(size):
    return ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', size)


def save(img,path):
    path.parent.mkdir(parents=True,exist_ok=True)
    info=PngImagePlugin.PngInfo(); info.add(b'sRGB',b'\0')
    img.convert('RGBA').save(path,pnginfo=info)


def source_file(job,season='summer'):
    return HERE/f'{job["key"]}-{season if job["seasonal"] else "still"}-{job["n"]}.png'


def source_sheet():
    sheet=Image.new('RGBA',(1440,math.ceil(len(JOBS)/6)*290+60),'#292b28')
    draw=ImageDraw.Draw(sheet)
    draw.text((16,15),'AB5 summer source paintings',font=font(24),fill='#f0d9ad')
    for i,j in enumerate(JOBS):
        x,y=(i%6)*240,60+(i//6)*290
        draw.text((x+5,y),f'{j["key"]} {j["n"]}',font=font(13),fill='#ded5c5')
        p=source_file(j)
        if p.exists():
            img=ImageOps.contain(Image.open(p).convert('RGBA'),(230,260),LANCZOS)
            sheet.alpha_composite(img,(x+(240-img.width)//2,y+22))
    save(sheet,HERE/'summer-sources.png')


def key_out(path,bg):
    raw=Image.open(path).convert('RGB')
    a=np.asarray(raw).astype(float).copy()
    r,g,b=a[:,:,0].copy(),a[:,:,1].copy(),a[:,:,2].copy()
    magenta=bg=='#FF00FF'
    excess=np.minimum(r,b)-g if magenta else g-np.maximum(r,b)
    alpha=np.clip(255-np.clip((excess-12)*2.8,0,255),0,255)
    if magenta:
        spill=np.maximum(0,np.minimum(r,b)-g-10)
        a[:,:,0]-=spill; a[:,:,2]-=spill
    else:
        a[:,:,1]=np.minimum(g,np.maximum(r,b)+10)
    rgba=np.dstack((np.clip(a,0,255),alpha)).astype('uint8')
    rgba[alpha<5]=0
    # Recover soft cast shadows darkening the chroma backing; recolour them to STYLE's shadow.
    coloured_shadow=np.zeros(alpha.shape,dtype=bool)
    if magenta:
        shadow=(np.minimum(r,b)>g*2.5+30)&(np.abs(r-b)<np.maximum(r,b)*.15)
        yy=np.arange(raw.height)[:,None]
        shadow |= (np.minimum(r,b)-g>25)&(alpha<220)&(yy>raw.height*.65)
        coloured_shadow=(yy>raw.height*.65)&(b>r*1.08)&(b>g*1.12)&(g<190)
        density=(255-np.maximum(r,b))/255
    else:
        shadow=(g>np.maximum(r,b)*2.5+30)&(np.maximum(r,b)<g*.3)
        density=(255-g)/255
    shadow=((shadow&(alpha<220))|coloured_shadow)&(density>.015)
    rgba[shadow,:3]=(28,26,36)
    rgba[shadow,3]=np.uint8(np.clip(density[shadow],0,.4)*255)
    img=Image.fromarray(rgba)
    box=img.getchannel('A').point(lambda a:255 if a>10 else 0).getbbox()
    if not box: raise ValueError(f'Empty painting {path}')
    # Strong central contact pixels locate the root/base; faint cast shadow is excluded.
    strong=rgba[:,:,3]>190
    lo,hi=round(raw.width*.35),round(raw.width*.65)
    yy,xx=np.where(strong[:,lo:hi]); xx=xx+lo
    if not len(yy): raise ValueError(f'No central ground contact {path}')
    fy=int(yy.max())
    fx=round(float(xx[yy>=fy-2].mean()))
    return img,box,(fx,fy)


def sprites():
    entries=[]; placements={}
    for j in JOBS:
        key,n=j['key'],j['n']; e=MANIFEST[key]
        cw,ch=e['cell']; ax,ay=[round(a*b) for a,b in zip(e['anchor'],e['cell'])]
        ty=min(ay,ch-3)  # Bottom-edge item anchors still require a two-pixel empty border.
        seasons=(['summer'] if '--summer-only' in sys.argv else SEASONS) if j['seasonal'] else ['still']
        images={}
        limits=[]
        for season in seasons:
            img,box,foot=key_out(source_file(j,season),j['bg'])
            if j['kind']=='item':
                foot=(foot[0],box[3]-1)  # Include the baked contact shadow above a bottom-edge anchor.
            # Normalize occasional generation-size changes to the summer pixel coordinates.
            summer_size=Image.open(source_file(j)).size
            if img.size != summer_size:
                sx,sy=summer_size[0]/img.width,summer_size[1]/img.height
                img=img.resize(summer_size,LANCZOS)
                box=tuple(round(v*(sx if i%2==0 else sy)) for i,v in enumerate(box))
                foot=(round(foot[0]*sx),round(foot[1]*sy))
            l,t,r,b=box; fx,fy=foot
            limits.extend([(ax-3)/max(1,fx-l),(cw-ax-3)/max(1,r-fx),
                           (ty-3)/max(1,fy-t),(ch-ty-2)/max(1,b-fy)])
            images[season]=(img,box,foot)
        scale=min(limits)
        if j['kind']=='tuft':
            # Adults are about 67px at 2x; the bible makes these waist-to-shoulder height.
            height=max(foot[1]-box[1] for _,box,foot in images.values())
            scale=min(scale,[50,54,44][n]/max(1,height))
        # One shared scale across all four seasonal images of this variant.
        for season,(img,box,foot) in images.items():
            l,t,r,b=box; fx,fy=foot
            small=img.crop(box).resize((max(1,round((r-l)*scale)),max(1,round((b-t)*scale))),LANCZOS)
            x=ax-round((fx-l)*scale); y=ty-round((fy-t)*scale)
            frame=Image.new('RGBA',(cw,ch)); frame.alpha_composite(small,(x,y))
            values=np.asarray(frame).copy()
            values[:2]=0; values[-2:]=0; values[:,:2]=0; values[:,-2:]=0
            values[values[:,:,3]<4]=0
            frame=Image.fromarray(values)
            file=f'{season}_{n}.png' if j['seasonal'] else f'{key}.png'
            save(frame,INBOX/key/file)
            entries.append(dict(key=key,n=n,season=season,file=file,cell=[cw,ch],anchor=[ax,ay]))
            placements[f'{key}/{season}/{n}']=dict(scale=scale,sourceFoot=list(foot),sourceBox=list(box),offset=[x,y],manifestAnchor=[ax,ay],contactPixel=[ax,ty])
    (HERE/'placements.json').write_text(json.dumps(placements,indent=2)+'\n',encoding='utf-8')
    return entries


def panel(img,cell,anchor,label):
    cw,ch=cell; ax,ay=anchor
    p=Image.new('RGBA',(192,360),'#777970'); d=ImageDraw.Draw(p)
    d.rectangle((0,180,192,360),fill='#33362f')
    d.text((5,3),label,font=font(12),fill='#fff1d6')
    display=img.resize((cw//2,ch//2),LANCZOS)
    for baseline in (166,346):
        x=96-ax//2; y=baseline-ay//2
        d.polygon(((64,baseline),(96,baseline-16),(128,baseline),(96,baseline+16)),outline='#969b8b')
        p.alpha_composite(display,(x,y))
    return p


def sheets(entries):
    contact=Image.new('RGBA',(1536,math.ceil(len(entries)/8)*360+60),'#292b28')
    ImageDraw.Draw(contact).text((16,15),'Camp Fire / AB5 / revision 1 / 1x display on grey and dark ground',font=font(24),fill='#f0d9ad')
    for i,item in enumerate(entries):
        img=Image.open(INBOX/item['key']/item['file']).convert('RGBA')
        p=panel(img,item['cell'],item['anchor'],f'{item["key"]} {item["season"]} {item["n"]}')
        contact.alpha_composite(p,((i%8)*192,60+(i//8)*360))
    save(contact,INBOX/'contact.png')
    for key in dict.fromkeys(e['key'] for e in entries):
        subset=[e for e in entries if e['key']==key]
        sheet=Image.new('RGBA',(768,math.ceil(len(subset)/4)*360+40),'#292b28')
        ImageDraw.Draw(sheet).text((12,9),key,font=font(20),fill='#f0d9ad')
        for i,item in enumerate(subset):
            img=Image.open(INBOX/key/item['file']).convert('RGBA')
            sheet.alpha_composite(panel(img,item['cell'],item['anchor'],f'{item["season"]} / variant {item["n"]}'),((i%4)*192,40+(i//4)*360))
        save(sheet,INBOX/f'review-{key}.png')


def groves():
    sheet=Image.new('RGBA',(2560,1060),'#292b28')
    ImageDraw.Draw(sheet).text((16,12),'AB5 / fixed woodland and riverside layouts / 1x / AB3 ground candidates',font=font(24),fill='#f0d9ad')
    positions=[(1,1),(3,1),(5,1),(1,3),(3,3),(5,3),(1,5),(3,5),(5,5)]
    for row,kinds in enumerate([['tree_bur_oak','tree_basswood'],['tree_cottonwood','tree_willow']]):
        for col,season in enumerate(SEASONS):
            panel=Image.new('RGBA',(640,500),'#343a30')
            d=ImageDraw.Draw(panel)
            d.text((12,8),f'{"Woodland" if row==0 else "Riverside"} / {season}',font=font(20),fill='#ded5c5')
            def world(x,y): return ((x-y)*32+320,(x+y)*16+180)
            for y in range(8):
                for x in range(8):
                    key='tile_river' if row==1 and x>=6 else 'tile_grass'
                    tile=Image.open(ART/f'inbox/AB3/{key}/{season}_{(x*3+y)%4}.png').convert('RGBA').resize((64,32),LANCZOS)
                    wx,wy=world(x,y); panel.alpha_composite(tile,(wx-32,wy-16))
            objects=[(x,y,kinds[i%2],i%2) for i,(x,y) in enumerate(positions)]
            objects.extend([(2,6,'bush_chokecherry',0),(5,2,'bush_plum',1),(0,6,'tuft_grass',2),(5,6,'rock_boulder',1),(4,6,'stump_tree',0)])
            for x,y,key,n in sorted(objects,key=lambda q:q[0]+q[1]):
                e=MANIFEST[key]; cw,ch=e['cell']; ax,ay=e['anchor']
                img=Image.open(INBOX/key/f'{season}_{n}.png').convert('RGBA').resize((cw//2,ch//2),LANCZOS)
                wx,wy=world(x,y)
                panel.alpha_composite(img,(wx-round(ax*cw/2),wy-round(ay*ch/2)))
            sheet.alpha_composite(panel,(col*640,60+row*500))
    save(sheet,INBOX/'groves.png')


if __name__=='__main__':
    if '--sources' in sys.argv:
        source_sheet(); raise SystemExit(0)
    entries=sprites(); sheets(entries)
    if '--summer-only' not in sys.argv: groves()
    prompts={p.name.removesuffix('.prompt.txt'):p.read_text(encoding='utf-8').strip() for p in HERE.glob('*.prompt.txt')}
    delivery=dict(batch='AB5',revision=1,brief='BATCHES.md AB5 rev 1 (2026-11-20)',
                  keys=list(dict.fromkeys(j['key'] for j in JOBS)),
                  tools=dict(imageGen='image_gen.imagegen',pillow='12.2.0'),prompts=prompts,
                  notes='Each summer variant generated separately; spring/autumn/winter are edits of that exact summer source. Backgrounds keyed/despilled, cast shadows recoloured #1C1A24 at <=40% alpha, cells Lanczos-scaled. Shared scale for all seasons of each variant; root/base contacts align with manifest anchors. Bottom-edge store-item anchors keep their baked contact shadow at row 29, three pixels above anchor 32, to preserve the required two-pixel border. Source placements record the measured contacts and offsets. All contact images use actual 1x display size on grey/dark grounds. Groves and game previews use AB3 ground candidates only as isolated review context. No installed assets changed.')
    (INBOX/'delivery.json').write_text(json.dumps(delivery,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(f'Prepared {len(entries)} frames across {len(delivery["keys"])} keys.')
