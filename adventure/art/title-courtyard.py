"""Export the approved title layers (Pillow); source drawings stay untouched."""
from pathlib import Path
from PIL import Image
from palette_png import save_palette_png

ROOT = Path(__file__).resolve().parent
source, output = ROOT / 'sources/title', ROOT / 'src/title'
output.mkdir(parents=True, exist_ok=True)
Image.open(source / 'ironhaven-courtyard.png').convert('RGB').resize(
    (640, 360), Image.Resampling.LANCZOS).resize((1280, 720), Image.Resampling.NEAREST).save(
    output / 'ironhaven-courtyard.webp', quality=78, method=6)

def cutout(image):
    image = image.convert('RGBA')
    # Remove low-alpha generation haze; retain a short antialiased silhouette edge.
    image.putalpha(image.getchannel('A').point(lambda a: max(0, min(255, (a - 190) * 4))))
    return image

gauntlet = cutout(Image.open(source / 'gauntlet.png'))
gauntlet = gauntlet.crop(gauntlet.getbbox())
save_palette_png(gauntlet.resize((160, round(gauntlet.height * 160 / gauntlet.width)), Image.Resampling.LANCZOS), output / 'title-gauntlet.png')

sheet = Image.open(source / 'ironhaven-flag-sheet.png')
result = Image.new('RGBA', (64 * 3, 110 * 2))
for index in range(6):
    x, y = index % 3 * 512, index // 3 * 512
    frame = cutout(sheet.crop((x + 140, y + 40, x + 390, y + 470)))
    result.paste(frame.resize((64, 110), Image.Resampling.LANCZOS), (index % 3 * 64, index // 3 * 110))
save_palette_png(result, output / 'ironhaven-flag.png')
print('Exported clean courtyard, separate gauntlet, and six-frame flag.')
