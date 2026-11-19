"""Assemble the approved 3x2 flame sheet into the transparent menu GIF (requires Pillow)."""
from pathlib import Path
from PIL import Image, ImageOps
from palette_png import save_palette_png

ROOT = Path(__file__).resolve().parent
sheet = Image.open(ROOT / "sources/ui/menu-flame-sheet.png").convert("RGBA")
width, height = sheet.width // 3, sheet.height // 2
frames = []
for index in range(6):
    cell = sheet.crop(((index % 3) * width, (index // 3) * height,
                       (index % 3 + 1) * width, (index // 3 + 1) * height))
    # One shared crop/scale keeps the base planted as the flame changes shape.
    flame = ImageOps.contain(cell.crop((80, 24, 432, 480)), (60, 60), Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", (64, 64))
    frame.paste(flame, ((64 - flame.width) // 2, 62 - flame.height))
    frames.append(frame)

output = ROOT / "src/ui"
output.mkdir(parents=True, exist_ok=True)
save_palette_png(frames[0], output / "menu-flame-still.png")
# A shared palette avoids colour flicker. GIF uses binary alpha; reserve entry 255.
strip = Image.new("RGB", (64 * 6, 64))
for index, frame in enumerate(frames):
    strip.paste(frame.convert("RGB"), (64 * index, 0))
palette = strip.quantize(colors=255)
encoded = []
for frame in frames:
    image = frame.convert("RGB").quantize(palette=palette, dither=Image.Dither.NONE)
    image.paste(255, mask=frame.getchannel("A").point(lambda alpha: 255 if alpha < 112 else 0))
    encoded.append(image)
encoded[0].save(output / "menu-flame.gif", save_all=True, append_images=encoded[1:],
                duration=100, loop=0, transparency=255, background=255,
                disposal=2, optimize=False)
print("Wrote 6-frame menu-flame.gif and reduced-motion still (64x64).")
