"""Save small opaque/transparent game sprites using the existing master palette."""
import json
from pathlib import Path
from PIL import Image

def save_palette_png(image, path):
    colours = json.loads((Path(__file__).parent / 'style/palette.json').read_text())['colours']
    triples = [tuple(bytes.fromhex(colour.lstrip('#'))) for colour in colours]
    palette = Image.new('P', (1, 1))
    palette.putpalette([channel for colour in (triples + [triples[-1]] * (256 - len(triples))) for channel in colour])
    rgba = image.convert('RGBA')
    result = rgba.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE).convert('RGBA')
    result.putalpha(rgba.getchannel('A').point(lambda alpha: 255 if alpha >= 128 else 0))
    result.save(path)
