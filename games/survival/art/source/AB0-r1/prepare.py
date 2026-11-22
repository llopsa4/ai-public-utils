"""Prepare the review sprites and contact sheet from the original AB0 art."""
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps, PngImagePlugin

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent
INBOX = SOURCE.parent / "inbox" / "AB0"
RESAMPLE = Image.Resampling.LANCZOS


def save(img, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    metadata = PngImagePlugin.PngInfo()
    metadata.add(b"sRGB", b"\0")
    img.save(path, pnginfo=metadata)


def source(name):
    return Image.open(HERE / f"{name}.png")


def materials():
    for name, dest in [("hide", "hide_tanned"), ("wood", "wood_pole")]:
        save(source(name).convert("RGB").resize((1024, 1024), RESAMPLE),
             SOURCE / "textures" / f"{dest}.png")


def grass():
    square = source("grass").convert("RGB").resize((512, 512), RESAMPLE)
    # Use a common edge on all variants. Reposition interior grass details only.
    blend = Image.new("L", square.size)
    ImageDraw.Draw(blend).rectangle((138, 138, 374, 374), fill=255)
    blend = blend.filter(ImageFilter.GaussianBlur(20))
    rot = Image.Transpose.ROTATE_90
    for n in range(4):
        inner = square
        for _ in range(n):
            inner = inner.transpose(rot)
        painted = Image.composite(inner, square, blend)
        # Give the rotation neighboring pixels to sample instead of dark fill.
        padded = Image.new("RGB", (1536, 1536))
        for row in range(3):
            for col in range(3):
                padded.paste(painted, (col * 512, row * 512))
        rotated = padded.rotate(45, expand=True, resample=Image.Resampling.BICUBIC)
        midpoint = rotated.width // 2
        diamond = rotated.crop((midpoint - 362, midpoint - 362, midpoint + 362, midpoint + 362))
        diamond = diamond.resize((128, 64), RESAMPLE).convert("RGBA")
        # At game scale adjoining diamonds share their boundary samples.
        mask = Image.new("L", (128, 64))
        ImageDraw.Draw(mask).polygon(((63, 0), (64, 0), (127, 31), (127, 32),
                                     (64, 63), (63, 63), (0, 32), (0, 31)), fill=255)
        diamond.putalpha(mask)
        save(diamond, INBOX / "tile_grass" / f"summer_{n}.png")


def keyed(name):
    raw = source(name).convert("RGB")
    rgba = Image.new("RGBA", raw.size)
    data = []
    for r, g, b in raw.get_flattened_data():
        excess = g - max(r, b)
        alpha = 255 - max(0, min(255, round((excess - 15) * 2.5))) if g > 90 else 255
        data.append((r, min(g, max(r, b) + 13), b, alpha))
    rgba.putdata(data)
    return rgba.crop(rgba.getchannel("A").getbbox())


def centered(img, size, margin, stretch=False):
    target = tuple(v - margin * 2 for v in size)
    if stretch:
        img = img.resize(target, RESAMPLE)
    else:
        img = ImageOps.contain(img, target, RESAMPLE)
    canvas = Image.new("RGBA", size)
    canvas.alpha_composite(img, tuple((v - q) // 2 for v, q in zip(size, img.size)))
    return canvas


def buttons():
    normal = centered(keyed("button"), (96, 48), 2, stretch=True)
    alpha = normal.getchannel("A")
    for state in ("normal", "hover", "pressed", "disabled"):
        img = normal.copy()
        if state == "hover":
            img = Image.blend(normal, Image.new("RGBA", img.size, (246, 204, 117, 255)), 0.16)
            img.putalpha(alpha)
        if state == "pressed":
            dark = Image.blend(normal, Image.new("RGBA", img.size, (57, 38, 24, 255)), 0.23)
            dark.putalpha(alpha)
            img = centered(dark.crop(alpha.getbbox()), (96, 48), 4, stretch=True)
        if state == "disabled":
            img = ImageOps.colorize(ImageOps.grayscale(normal), "#493e32", "#dfd1b9").convert("RGBA")
            img.putalpha(alpha.point(lambda v: round(v * 0.6)))
        save(img, INBOX / "ui_button" / f"{state}.png")


def stills():
    grass()
    save(centered(keyed("panel"), (96, 96), 2, stretch=True), INBOX / "ui_panel" / "ui_panel.png")
    buttons()
    save(centered(keyed("food"), (64, 64), 7), INBOX / "icon_food" / "icon_food.png")
    shutil.copyfile(HERE / "tipi.png", SOURCE / "concept_tipi.png")


def font(size):
    return ImageFont.truetype("C:/Windows/Fonts/georgia.ttf", size)


def contact():
    sheet = Image.new("RGBA", (1260, 1170), "#242422")
    draw = ImageDraw.Draw(sheet)
    draw.text((36, 23), "Camp Fire  /  AB0", fill="#f0d9ad", font=font(33))
    draw.text((36, 68), "Art style samples · Revision 1", fill="#d2c7b3", font=font(18))
    tiles = [("Summer " + str(n + 1), f"tile_grass/summer_{n}.png") for n in range(4)]
    states = ("stage1", "stage2", "stage3", "finished", "winter")
    buildings = [(label, f"building_tipi/{key}_00.png") for label, key in
                 zip(("Footprint", "Frame", "Half covered", "Finished", "Winter"), states)]
    ui = [("Panel", "ui_panel/ui_panel.png"), ("Food", "icon_food/icon_food.png")]
    ui += [(f"Button · {n}", f"ui_button/{n}.png") for n in ("normal", "hover", "pressed", "disabled")]
    for y, h, assets in [(104, 145, tiles), (262, 334, buildings), (610, 145, ui)]:
        w = 1188 // len(assets)
        for i, (label, rel) in enumerate(assets):
            x = 36 + i * w
            draw.rectangle((x, y, x + w - 8, y + h), fill="#6b6c63")
            draw.rectangle((x, y + h * 0.54, x + w - 8, y + h), fill="#333731")
            draw.text((x + 10, y + 8), label, fill="#fff1d8", font=font(16))
            img = Image.open(INBOX / rel).convert("RGBA")
            is_building = rel.startswith("building")
            if is_building:
                img = img.resize((192, 256), RESAMPLE)
            center_x, anchor_y = x + (w - 8) // 2, y + (249 if is_building else 82)
            draw.polygon([(center_x - 32, anchor_y), (center_x, anchor_y - 16),
                          (center_x + 32, anchor_y), (center_x, anchor_y + 16)], outline="#9a9d84")
            sheet.alpha_composite(img, (center_x - img.width // 2,
                                       anchor_y - int(img.height * (0.75 if is_building else 0.5))))
    draw.text((36, 776), "Character concept · front / side / back", fill="#f0d9ad", font=font(22))
    concept = Image.open(INBOX / "concept" / "person_man.png").convert("RGBA")
    concept.thumbnail((1188, 342), RESAMPLE)
    sheet.alpha_composite(concept, ((sheet.width - concept.width) // 2, 812))
    save(sheet, INBOX / "contact.png")


if __name__ == "__main__":
    import sys
    for command in sys.argv[1:]:
        {"materials": materials, "stills": stills, "contact": contact}[command]()
