"""Build AB3's 80 ground tiles and deterministic seam-review fields."""
import json
import random
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, PngImagePlugin

HERE = Path(__file__).resolve().parent
ART = HERE.parents[1]
INBOX = ART / 'inbox' / 'AB3'
KEYS = ['tile_grass', 'tile_forest', 'tile_berry', 'tile_river', 'tile_ford']
SEASONS = ['spring', 'summer', 'autumn', 'winter']
WATER = {'spring': '#578697', 'summer': '#4F8094', 'autumn': '#4B7889', 'winter': '#365968'}
LANCZOS = Image.Resampling.LANCZOS
YY, XX = np.mgrid[:64, :128]
EDGE = (63.5 - np.abs(XX - 63.5) - 2 * np.abs(YY - 31.5)) / np.sqrt(5)


def save(img, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    info = PngImagePlugin.PngInfo()
    info.add(b'sRGB', b'\0')
    img.convert('RGBA').save(path, pnginfo=info)


def periodic(img):
    a = np.asarray(img.convert('RGB').resize((512,512), LANCZOS)).astype(float).copy()
    # Equal opposing samples, feathered into the image; no pasted repeated strips.
    for axis in (1, 0):
        for i in range(48):
            weight = (1 - i / 48) ** 2
            if axis == 1:
                left, right = a[:,i].copy(), a[:,-1-i].copy()
                avg = (left + right) / 2
                a[:,i] = left * (1-weight) + avg * weight
                a[:,-1-i] = right * (1-weight) + avg * weight
            else:
                top, bottom = a[i].copy(), a[-1-i].copy()
                avg = (top + bottom) / 2
                a[i] = top * (1-weight) + avg * weight
                a[-1-i] = bottom * (1-weight) + avg * weight
    return Image.fromarray(np.uint8(np.clip(a, 0, 255)))


def diamond(square):
    padded = Image.new('RGB', (1536,1536))
    for y in range(3):
        for x in range(3):
            padded.paste(square, (x*512,y*512))
    rotated = padded.rotate(45, expand=True, resample=Image.Resampling.BICUBIC)
    mid = rotated.width // 2
    img = rotated.crop((mid-362,mid-362,mid+362,mid+362)).resize((128,64), LANCZOS).convert('RGBA')
    mask = Image.new('L',(512,256))
    ImageDraw.Draw(mask).polygon(((254,0),(258,0),(511,126),(511,130),(258,255),(254,255),(0,130),(0,126)), fill=255)
    img.putalpha(mask.resize((128,64),LANCZOS))
    return img


def sprites():
    for key in KEYS:
        for season in SEASONS:
            if key == 'tile_grass' and season == 'summer':
                for n in range(4):
                    dest = INBOX / key / f'{season}_{n}.png'
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copyfile(ART/'inbox/done/AB0-r1'/key/f'{season}_{n}.png', dest)
                continue
            square = periodic(Image.open(HERE / f'{key}-{season}.png'))
            if key not in ('tile_river','tile_ford'):
                # Remove broad source lighting variation while preserving the painted grain.
                values = np.asarray(square).astype(float)
                low = np.asarray(square.filter(ImageFilter.GaussianBlur(24))).astype(float)
                values = values-low+values.mean(axis=(0,1))
                square = periodic(Image.fromarray(np.uint8(np.clip(values,0,255))))
            if key in ('tile_river','tile_ford'):
                # Match the shared edge's average so the mandatory band does not draw a dark grid.
                values = np.asarray(square).astype(float)
                centre = np.array(tuple(bytes.fromhex(WATER[season][1:])))
                strength = 0.5 if key == 'tile_ford' else 0.75
                values = centre + (values-values.mean(axis=(0,1))) * strength
                square = Image.fromarray(np.uint8(np.clip(values,0,255)))
            base = diamond(square)
            # Variants change interior detail placement; the entire 8px edge band is invariant.
            inner = np.uint8(np.clip((EDGE-8)/4,0,1)*255)
            inner_mask = Image.fromarray(inner)
            for n in range(4):
                variant = diamond(square.rotate(90*n))
                img = Image.composite(variant, base, inner_mask)
                if key in ('tile_river','tile_ford'):
                    rgba = np.asarray(img).copy()
                    colour = tuple(bytes.fromhex(WATER[season][1:]))
                    blend = np.clip((EDGE-4)/3,0,1)[:,:,None]
                    rgba[:,:,:3] = np.uint8(rgba[:,:,:3]*blend + np.array(colour)*(1-blend))
                    img = Image.fromarray(rgba)
                save(img, INBOX/key/f'{season}_{n}.png')


def field(keys, season):
    sheet = Image.new('RGBA',(768,384),'#383b32')
    rng = random.Random(3103)
    for y in range(12):
        for x in range(12):
            key = keys[(x+y)//6 % len(keys)]
            tile = Image.open(INBOX/key/f'{season}_{rng.randrange(4)}.png').resize((64,32),LANCZOS)
            sheet.alpha_composite(tile, ((x-y)*32+352,(x+y)*16))
    return sheet


def proofs():
    font = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf',18)
    contact = Image.new('RGBA',(1280,1080),'#292b28')
    draw = ImageDraw.Draw(contact)
    draw.text((20,14),'Camp Fire / AB3 / seasonal ground / revision 1',font=font,fill='#f0d9ad')
    for j, season in enumerate(SEASONS):
        draw.text((20+j*320,48),season.title(),font=font,fill='#f0d9ad')
        for i,key in enumerate(KEYS):
            proof = field([key],season)
            save(proof,INBOX/f'field-{key}-{season}.png')
            contact.alpha_composite(proof.resize((304,152),LANCZOS),(8+j*320,92+i*194))
            draw.text((12+j*320,74+i*194),key,font=font,fill='#ded5c5')
        save(field(['tile_river','tile_ford'],season),INBOX/f'field-water-joins-{season}.png')
    save(contact,INBOX/'contact.png')


def checks():
    for key in KEYS:
        for season in SEASONS:
            imgs=[np.asarray(Image.open(INBOX/key/f'{season}_{n}.png')) for n in range(4)]
            if not (key == 'tile_grass' and season == 'summer'):
                edge = EDGE <= 8
                for img in imgs[1:]:
                    assert np.array_equal(img[edge],imgs[0][edge]), (key,season,'variant edge')
            if key in ('tile_river','tile_ford'):
                colour=np.array(tuple(bytes.fromhex(WATER[season][1:])))
                for img in imgs:
                    assert np.all(img[:,:,:3][EDGE<=4] == colour), (key,season,'water join')
    for n in range(4):
        assert (INBOX/'tile_grass'/f'summer_{n}.png').read_bytes() == (ART/'inbox/done/AB0-r1/tile_grass'/f'summer_{n}.png').read_bytes()
    print('80 frames; invariant variant edges, common water bands and byte-identical AB0 summer grass verified.')


if __name__ == '__main__':
    sprites()
    proofs()
    prompts=json.loads((HERE/'base-prompts.json').read_text(encoding='utf-8'))
    prompts['tile_grass/summer']='Reused approved AB0 revision 1 source and four delivered summer tiles byte-for-byte; original prompt in AB0 delivery.json.'
    for p in HERE.glob('*.prompt.txt'):
        prompts[p.name.removesuffix('.prompt.txt')]=p.read_text(encoding='utf-8').strip()
    delivery=dict(batch='AB3',revision=1,brief='BATCHES.md AB3 rev 1 (2026-11-20)',keys=KEYS,
                  tools=dict(imageGen='image_gen.imagegen',pillow='12.2.0'),prompts=prompts,
                  notes='Summer texture per type; spring/autumn/winter are edits of its summer source. Four summer grass frames reused byte-identically from AB0. Opposite source edges feathered to periodic samples. Broad source lighting variation flattened on new land tiles while retaining the painted grain. Variant changes stay inside the 8px diamond edge band. River/ford average colour matched to their common 4px season-specific water band. Candidate previews are isolated; no installed art changed. Trees and other unmade art remain existing placeholders, including green trees in winter.')
    (INBOX/'delivery.json').write_text(json.dumps(delivery,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    checks()
