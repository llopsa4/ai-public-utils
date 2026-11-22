"""Prepare the AB1 interface delivery and contact sheet from the source paintings."""
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps, PngImagePlugin

HERE = Path(__file__).resolve().parent
ART = HERE.parents[1]
INBOX = ART / "inbox" / "AB1"
AB0 = ART / "inbox" / "done" / "AB0-r1"
LANCZOS = Image.Resampling.LANCZOS


def save(img, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    png = PngImagePlugin.PngInfo()
    png.add(b"sRGB", b"\0")
    img.save(path, pnginfo=png)


def key_green(path):
    original = Image.open(path).convert("RGB")
    keyed = Image.new("RGBA", original.size)
    pixels = []
    for r, g, b in original.get_flattened_data():
        excess = g - max(r, b)
        alpha = 255 - max(0, min(255, round((excess - 15) * 2.5))) if g > 90 else 255
        pixels.append((r, min(g, max(r, b) + 13), b, alpha))
    keyed.putdata(pixels)
    return keyed.crop(keyed.getchannel("A").getbbox())


def sprites():
    for key in ("ui_panel", "ui_button"):
        shutil.copytree(AB0 / key, INBOX / key, dirs_exist_ok=True)

    frame = key_green(HERE / "bar.png").resize((64, 24), LANCZOS)
    save(frame, INBOX / "ui_bar_frame" / "ui_bar_frame.png")

    # Neutral grey so the game can tint the strip green, amber or red.
    shades = (202, 218, 229, 234, 234, 232, 230, 228, 227, 225, 223, 221, 217, 212, 205, 192)
    fill = Image.new("RGBA", (8, 16))
    for y, value in enumerate(shades):
        ImageDraw.Draw(fill).line((0, y, 7, y), fill=(value, value, value, 255))
    save(fill, INBOX / "ui_bar_fill" / "ui_bar_fill.png")

    badge = ImageOps.contain(key_green(HERE / "emblem.png"), (492, 492), LANCZOS)
    emblem = Image.new("RGBA", (512, 512))
    emblem.alpha_composite(badge, ((512 - badge.width) // 2, (512 - badge.height) // 2))
    save(emblem, INBOX / "ui_emblem" / "ui_emblem.png")


def font(size):
    return ImageFont.truetype("C:/Windows/Fonts/georgia.ttf", size)


def contact():
    sheet = Image.new("RGBA", (1056, 720), "#242422")
    draw = ImageDraw.Draw(sheet)
    draw.text((32, 24), "Camp Fire  /  AB1", fill="#f0d9ad", font=font(34))
    draw.text((32, 69), "Interface pieces · Revision 1", fill="#d2c7b3", font=font(18))
    assets = [
        ("Panel · approved in AB0", "ui_panel/ui_panel.png", (32, 112, 224, 393), 1.5),
        ("Normal", "ui_button/normal.png", (244, 112, 404, 238), 1.25),
        ("Hover", "ui_button/hover.png", (426, 112, 586, 238), 1.25),
        ("Pressed", "ui_button/pressed.png", (244, 266, 404, 393), 1.25),
        ("Disabled", "ui_button/disabled.png", (426, 266, 586, 393), 1.25),
        ("Menu emblem", "ui_emblem/ui_emblem.png", (606, 112, 1024, 654), 0.70),
        ("Wotakuye bar frame", "ui_bar_frame/ui_bar_frame.png", (32, 422, 586, 531), 3),
        ("Neutral fill strip", "ui_bar_fill/ui_bar_fill.png", (32, 545, 586, 654), 3),
    ]
    for label, rel, (x, y, right, bottom), scale in assets:
        draw.rectangle((x, y, right, bottom), fill="#62625a")
        draw.rectangle((x, (y + bottom) // 2, right, bottom), fill="#353732")
        draw.text((x + 10, y + 8), label, fill="#fff1d8", font=font(15))
        img = Image.open(INBOX / rel).convert("RGBA")
        img = img.resize((round(img.width * scale), round(img.height * scale)), LANCZOS)
        cx, cy = (x + right) // 2, (y + bottom + 20) // 2
        draw.polygon(((cx - 32, cy), (cx, cy - 16), (cx + 32, cy), (cx, cy + 16)), outline="#929484")
        sheet.alpha_composite(img, (cx - img.width // 2, cy - img.height // 2))
    draw.text((32, 675), "Button states preserved from AB0. The game tints the fill strip.", fill="#d2c7b3", font=font(16))
    save(sheet, INBOX / "contact.png")


if __name__ == "__main__":
    sprites()
    contact()
