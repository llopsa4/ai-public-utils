import sys,json,subprocess
from pathlib import Path
from PIL import Image,PngImagePlugin
HERE=Path(__file__).resolve().parent;SOURCE=HERE.parent;ART=SOURCE.parent
anim=sys.argv[1];raw=HERE/'raw'/anim;out=ART/'inbox/AB13/person_man';out.mkdir(parents=True,exist_ok=True)
images={k:Image.open(raw/(k+'.png')) for k in ['base','shadow','empty','cloth']}
crop=raw/'crop';crop.mkdir(exist_ok=True)
for p in json.loads((raw/'placements.json').read_text()):
    x,y,w,h=p['cell']
    for k,im in images.items():im.crop((2*x,2*y,2*(x+w),2*(y+h))).save(crop/(k+'.png'))
    prefix=f"{anim}_{p['facing']}_{p['frame']:02}"
    subprocess.run(['python',str(SOURCE/'AB12-r1/finish.py'),*[str(crop/(k+'.png')) for k in ['base','shadow','empty','cloth']],str(out),prefix,str(w),str(h)],check=True)
    if p.get('offset'):
        for layer in ['base','cloth']:
            file=out/f'{layer}_{prefix}.png';a=Image.open(file).convert('RGBA');full=Image.new('RGBA',(192,160));full.paste(a,tuple(p['offset']))
            info=PngImagePlugin.PngInfo();info.add(b'sRGB',b'\0');full.save(file,pnginfo=info)
print('Finished',anim,len(list(out.glob('*_'+anim+'_*.png'))),'PNGs')
