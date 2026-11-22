"""Prepare AB7 title JPEG, unchanged AB1 emblem, and review contact sheet."""
import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps, PngImagePlugin

HERE = Path(__file__).resolve().parent
ART = HERE.parents[1]
INBOX = ART / 'inbox' / 'AB7'
LANCZOS = Image.Resampling.LANCZOS


def save_png(image, path):
    info = PngImagePlugin.PngInfo()
    info.add(b'sRGB', b'\0')
    image.convert('RGBA').save(path, pnginfo=info)


def font(size):
    return ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', size)


if __name__ == '__main__':
    INBOX.mkdir(parents=True, exist_ok=True)
    original = Image.open(HERE / 'title-original.png')
    title = ImageOps.fit(original.convert('RGB'), (2560, 1440), method=LANCZOS)
    title_path = INBOX / 'title.jpg'
    for quality in (94, 92, 90, 87, 84):
        title.save(title_path, quality=quality, subsampling=0, optimize=True, progressive=True)
        if title_path.stat().st_size <= 1_000_000:
            break
    assert title_path.stat().st_size <= 1_000_000
    delivered = Image.open(title_path)
    assert delivered.size == (2560,1440) and delivered.mode == 'RGB'
    emblem_source = ART / 'inbox/AB1/ui_emblem/ui_emblem.png'
    emblem_path = INBOX / 'ui_emblem/ui_emblem.png'
    emblem_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(emblem_source, emblem_path)
    assert emblem_source.read_bytes() == emblem_path.read_bytes()

    contact = Image.new('RGBA', (1280,1000), '#292b28')
    draw = ImageDraw.Draw(contact)
    draw.text((24,14), 'Camp Fire / AB7 / title picture and emblem / revision 1',font=font(26),fill='#f0d9ad')
    contact.alpha_composite(delivered.convert('RGBA').resize((1280,720),LANCZOS),(0,60))
    draw.text((24,794), 'AB1 emblem, unchanged',font=font(18),fill='#ded5c5')
    emblem = Image.open(emblem_path).convert('RGBA').resize((144,144),LANCZOS)
    for x,colour in ((24,'#777970'),(212,'#33362f')):
        draw.rectangle((x,826,x+168,988),fill=colour)
        draw.polygon(((x+52,908),(x+84,892),(x+116,908),(x+84,924)),outline='#969b8b')
        contact.alpha_composite(emblem,(x+12,834))
    draw.text((430,794), 'Quiet title area: top-centre 1200 x 300 px',font=font(18),fill='#ded5c5')
    quiet=delivered.crop((680,0,1880,300)).resize((600,150),LANCZOS).convert('RGBA')
    contact.alpha_composite(quiet,(430,832))
    save_png(contact,INBOX/'contact.png')

    checks=dict(titleSize=list(delivered.size),mode=delivered.mode,bytes=title_path.stat().st_size,
                quality=quality,sourceSize=list(original.size),emblemIdenticalToAB1=True,
                sha256=hashlib.sha256(title_path.read_bytes()).hexdigest())
    (INBOX/'checks.json').write_text(json.dumps(checks,indent=2)+'\n',encoding='utf-8')
    delivery=dict(batch='AB7',revision=1,brief='BATCHES.md AB7 rev 1 (2026-11-20)',keys=['ui_emblem'],
                  externalFiles={'title.jpg':checks},tools=dict(imageGen='image_gen.imagegen',pillow='12.2.0'),
                  prompts={'title':(HERE/'title.prompt.txt').read_text(encoding='utf-8').strip(),
                           'title_composition_edit':(HERE/'title-composition-edit.prompt.txt').read_text(encoding='utf-8').strip(),
                           'title_position_edit':(HERE/'title-position-edit.prompt.txt').read_text(encoding='utf-8').strip(),
                           'ui_emblem':'Reused byte-identically from AB1 revision 1; original generation prompt in its delivery.json.'},
                  notes='Title JPEG is delivered in the inbox, not installed as art/title.jpg. Two composition edits move the camp into the gap between existing menu panels; the initial and intermediate paintings are retained in source. The normal manifest validator checks the reused emblem; prepare.py separately checks exact 2560x1440 RGB JPEG dimensions and <=1 MB. Candidate menu previews use an isolated snapshot with the unchanged AB1 emblem. Both AB1 emblem and AB7 title require Claude review before installation.')
    (INBOX/'delivery.json').write_text(json.dumps(delivery,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(json.dumps(checks))
