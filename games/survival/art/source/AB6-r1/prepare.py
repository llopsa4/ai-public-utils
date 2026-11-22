"""Key and place generated AB6 paintings; no synthetic animation or warping."""
import json, math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, PngImagePlugin

HERE=Path(__file__).resolve().parent
ART=HERE.parents[1]
OUT=ART/'inbox/AB6'
JOBS=json.loads((HERE/'subjects.json').read_text())
MAN=json.loads((ART/'manifest.json').read_text())
L=Image.Resampling.LANCZOS
CAP={'fx_arrow':(58,10),'fx_arrow_stuck':(20,21),'ally_spirit':(65,108),
     'fx_storm':(360,180),'fx_hit':(52,40),'fx_dust':(44,24),
     'fx_sparkle':(76,88),'fx_flame':(78,124)}
OPACITY={'ally_spirit':[2/3]*6,'fx_storm':[.72]*8,
         'fx_hit':[.9,.8,.45,.1],'fx_dust':[.65,.55,.3,.08],
         'fx_sparkle':[.4,.9,1,.75,.4,.1]}

def save(im,p):
    p.parent.mkdir(parents=True,exist_ok=True)
    info=PngImagePlugin.PngInfo();info.add(b'sRGB',b'\0')
    im.convert('RGBA').save(p,pnginfo=info)

def keyed(p,size):
    im=Image.open(p).convert('RGB').resize(size,L)
    a=np.array(im).astype(float);r,g,b=a[:,:,0].copy(),a[:,:,1].copy(),a[:,:,2].copy()
    excess=g-np.maximum(r,b)
    alpha=np.clip(255-np.clip((excess-12)*2.8,0,255),0,255)
    a[:,:,1]=np.minimum(g,np.maximum(r,b)+5)
    rgba=np.dstack((np.clip(a,0,255),alpha)).astype('uint8');rgba[alpha<5]=0
    return Image.fromarray(rgba)

def bbox(im): return im.getchannel('A').point(lambda a:255 if a>12 else 0).getbbox()

def prepare(j):
    key=j['key'];e=MAN[key];cw,ch=e['cell']; ax,ay=[round(v*n) for v,n in zip(e['anchor'],e['cell'])]
    size=Image.open(HERE/f'{key}-00.png').size
    ims=[keyed(HERE/f'{key}-{i:02}.png',size) for i in range(j['frames'])]
    boxes=[bbox(im) for im in ims]; b=boxes[0]
    # All frames share one scale and the original painting's coordinate system.
    if key in ['fx_storm','fx_arrow']: root=((b[0]+b[2])/2,(b[1]+b[3])/2)
    elif key=='fx_sparkle': root=(size[0]*.5,size[1]*.75)
    elif key=='fx_arrow_stuck': root=((b[0]+b[2])/2-((b[2]-b[0])*.2),b[3]-1)
    else:
        a=np.array(ims[0]); strong=a[:,:,3]>190
        lo,hi=round(size[0]*.38),round(size[0]*.62)
        yy,xx=np.where(strong[:,lo:hi]); root=(size[0]*.5,float(yy.max()))
    union=(min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes))
    capw,caph=CAP[key]
    scale=min(capw/(union[2]-union[0]),caph/(union[3]-union[1]))
    for bound,limit in [(root[0]-union[0],ax-3),(union[2]-root[0],cw-3-ax),
                        (root[1]-union[1],ay-3),(union[3]-root[1],ch-3-ay)]:
        if bound>0: scale=min(scale,limit/bound)
    nw,nh=round(size[0]*scale),round(size[1]*scale)
    offset=(ax-round(root[0]*nw/size[0]),ay-round(root[1]*nh/size[1]))
    frames=[]
    for i,im in enumerate(ims):
        im=im.resize((nw,nh),L)
        if key in OPACITY:
            im.putalpha(im.getchannel('A').point(lambda a:round(a*OPACITY[key][i])))
        cell=Image.new('RGBA',(cw,ch)); cell.alpha_composite(im,offset)
        a=np.array(cell);a[:2]=0;a[-2:]=0;a[:,:2]=0;a[:,-2:]=0;cell=Image.fromarray(a)
        name=f'{j["anim"]}_{i:02}.png' if j.get('anim') else f'{key}.png'
        save(cell,OUT/key/name);frames.append(cell)
    return frames,dict(sourceSize=size,baseRoot=root,union=union,scale=scale,offset=offset,opacity=OPACITY.get(key,[1]*j['frames']))

def font(n):return ImageFont.truetype('C:/Windows/Fonts/georgia.ttf',n)

def panel(im,e,label):
    p=Image.new('RGBA',(200,400),'#343631');d=ImageDraw.Draw(p)
    d.text((6,4),label,font=font(12),fill='#eadbc0')
    small=im.resize((im.width//2,im.height//2),L)
    ax,ay=[round(v*n/2) for v,n in zip(e['anchor'],e['cell'])]
    for k,bg in enumerate(['#808080','#202322']):
        top=28+k*180;d.rectangle((0,top,199,top+179),fill=bg)
        x,y=100,top+130
        d.line([(x-32,y),(x,y-16),(x+32,y),(x,y+16),(x-32,y)],fill='#b6a579')
        p.alpha_composite(small,(x-ax,y-ay))
        d.line((x-2,y,x+2,y),fill='#dfbf7e');d.line((x,y-2,x,y+2),fill='#dfbf7e')
    return p

def main():
    OUT.mkdir(parents=True,exist_ok=True);allframes=[];placements={};metrics={}
    # One row per animation, with grey and dark bands at true half-size display.
    contact=Image.new('RGBA',(1600,40+len(JOBS)*400),'#292b28');d=ImageDraw.Draw(contact)
    d.text((14,10),'Camp Fire / AB6 r1 / effects at 1x display / grey + dark',font=font(20),fill='#eed9b5')
    for row,j in enumerate(JOBS):
        frames,placements[j['key']]=prepare(j);e=MAN[j['key']]
        strip=Image.new('RGBA',(200*len(frames),400),'#292b28')
        for i,im in enumerate(frames):
            cell=panel(im,e,f'{j["key"]} {i:02}')
            contact.alpha_composite(cell,(i*200,40+row*400));strip.alpha_composite(cell,(i*200,0))
        save(strip,OUT/f'review-{j["key"]}.png')
        allframes.extend(frames)
        if j.get('anim'):
            gif=[]
            for im in frames:
                board=panel(im,e,j['key']).convert('RGB');gif.append(board)
            if not j.get('loop'):gif.extend([gif[-1]]*4)
            # GIF time is in 10 ms units: alternate durations to preserve the mean rate.
            times=[round(i*100/j['fps'])*10 for i in range(len(gif)+1)]
            durations=[times[i+1]-times[i] for i in range(len(gif))]
            gif[0].save(OUT/f'animation-{j["key"]}.gif',save_all=True,append_images=gif[1:],duration=durations,loop=0,disposal=2)
            rgba=[np.array(im).astype(float)/255 for im in frames]
            prem=[np.concatenate((a[:,:,:3]*a[:,:,3:],a[:,:,3:]),axis=2) for a in rgba]
            diffs=[float(np.abs(prem[i]-prem[(i+1)%len(prem)]).mean()) for i in range(len(prem))]
            metrics[j['key']]=dict(adjacentMeanAbsoluteDifferences=diffs,loop=j['loop'],seamToMeanRatio=diffs[-1]/max(1e-9,sum(diffs[:-1])/len(diffs[:-1])))
    save(contact,OUT/'contact.png')
    (HERE/'placements.json').write_text(json.dumps(placements,indent=2)+'\n')
    (OUT/'loop-checks.json').write_text(json.dumps(metrics,indent=2)+'\n')
    prompts={p.name.removesuffix('.prompt.txt'):p.read_text().strip() for p in HERE.glob('*.prompt.txt')}
    delivery=dict(batch='AB6',revision=1,brief='BATCHES.md AB6 rev 1',keys=[j['key'] for j in JOBS],tools=dict(imageGen='image_gen.imagegen',processing='Python / Pillow / NumPy'),prompts=prompts,
        notes='Eight base paintings and thirty selected individual edits; one rejected storm-lighting edit is retained with its prompt. Every animation frame is image-generated from its base, never synthesized by code. Python only keys/despills, applies shared scale/placement, adjusts alpha and writes cells/contact/GIFs. Each key uses the same base coordinate system, scale and translation across all frames. Spirit source alpha multiplied by 2/3; renderer multiplies by .9, giving 60% maximum final opacity. Storm .72 opacity; one-shots have explicit fade schedules recorded in placements.json. Numerical loop checks are review aids, not proof of perceptual continuity. Game previews use AB3 ground and AB5 plants as review context only. Earlier building/people placeholders remain; the central fire placeholder includes its old static fire underneath the new sprite. No installed manifest or atlases changed.')
    (OUT/'delivery.json').write_text(json.dumps(delivery,indent=2)+'\n')
    print(f'Prepared {len(allframes)} frames across {len(JOBS)} keys.')

if __name__=='__main__':main()
