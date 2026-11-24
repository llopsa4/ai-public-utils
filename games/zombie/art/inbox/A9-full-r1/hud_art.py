"""Hand-placed native-size pixels for counters that have to read at 24 px."""

from PIL import Image, ImageDraw


def hud_icon(name):
    image = Image.new("RGBA", (24, 24))
    draw = ImageDraw.Draw(image)
    ink = "#24272a"
    slate, gray, light, pale = "#4b5358", "#818d91", "#a1adb0", "#d9d9cb"
    dark_wood, wood, tan, cream = "#45362d", "#785c46", "#ae8b66", "#e0c7a1"
    dark_green, green, moss = "#3b4433", "#697653", "#a4ab82"
    rust, red, warm = "#704143", "#ad6c61", "#c88b76"

    def poly(points, fill, outline=ink):
        draw.polygon(points, fill=fill, outline=outline)

    def line(points, fill, width=1):
        draw.line(points, fill=fill, width=width)

    if name == "food":
        poly([(4,6), (7,4), (17,4), (20,6), (20,17), (17,19), (7,19), (4,17)], green)
        draw.ellipse((4,4,20,10), fill=slate, outline=ink)
        draw.ellipse((6,5,18,8), fill=light)
        line([(8,5), (15,5)], pale)
        poly([(6,10), (9,12), (17,12), (19,10), (19,15), (16,17), (8,17), (6,15)], dark_green, None)
        line([(7,11), (7,15), (9,16)], moss)
        line([(8,18), (16,18), (18,17)], light)
    elif name == "scrap":
        poly([(5,5), (13,4), (17,8), (13,17), (4,16), (3,12)], wood)
        line([(5,6), (12,5), (14,7)], tan)
        poly([(10,10), (18,7), (20,10), (18,14), (21,17), (18,20), (10,18), (8,14)], gray)
        line([(11,10), (17,8), (19,10)], pale)
        line([(10,13), (14,14), (17,12)], slate)
        line([(13,17), (17,18)], light)
    elif name == "ammo":
        for x, y in ((5, 3), (13, 7)):
            poly([(x+2,y), (x+4,y), (x+5,y+4), (x+6,y+5), (x+6,20), (x,20),
                  (x, y+5), (x+1,y+4)], wood)
            poly([(x+2,y+1), (x+4,y+1), (x+5,y+5), (x+1,y+5)], gray, None)
            line([(x+2,y+2), (x+2,y+4)], light)
            draw.rectangle((x+1,y+6,x+4,18), fill=tan)
            line([(x+1,y+7), (x+1,17)], cream)
            line([(x+1,19), (x+5,19)], cream)
    elif name == "hunger":
        poly([(9,3), (12,3), (12,7), (15,7), (19,9), (21,12), (20,16), (17,19),
              (13,20), (8,19), (6,20), (4,20), (4,17), (6,15), (10,15), (11,13),
              (10,11), (9,8)], tan)
        poly([(12,10), (15,9), (18,11), (19,13), (17,16), (14,17), (10,17),
              (13,14), (13,12)], dark_wood)
        line([(10,4), (10,7), (11,9)], cream)
        line([(16,9), (18,10)], cream)
        line([(13,19), (17,18)], wood)
    elif name == "zombie":
        poly([(8,4), (15,3), (19,6), (20,12), (18,15), (17,19), (14,21), (9,20),
              (5,15), (4,12), (5,7)], green)
        poly([(6,7), (8,5), (15,4), (18,6), (18,7), (13,7), (10,9), (6,9)], dark_green, None)
        poly([(6,10), (10,9), (9,12), (6,12)], ink, None)
        poly([(13,10), (17,9), (18,10), (16,12), (13,12)], ink, None)
        poly([(11,12), (12,14), (10,14)], dark_green, None)
        poly([(8,16), (12,15), (16,16), (15,19), (11,19), (8,18)], ink, None)
        line([(10,16), (13,16)], pale)
        line([(6,13), (7,15)], moss)
        line([(14,8), (17,8)], moss)
    elif name == "herd":
        draw.ellipse((3,3,21,21), fill=slate, outline=ink)
        draw.ellipse((5,5,19,19), fill=tan, outline=ink)
        draw.ellipse((7,6,17,17), fill=cream)
        line([(12,7), (12,12), (16,14)], ink, 2)
        line([(6,7), (8,5), (12,4)], light)
        draw.point((12,12), fill=rust)
    elif name == "crate":
        poly([(3,7), (13,3), (21,7), (21,17), (12,21), (3,17)], wood)
        poly([(3,7), (13,3), (21,7), (12,11)], tan)
        poly([(3,7), (12,11), (12,21), (3,17)], wood)
        poly([(12,11), (21,7), (21,17), (12,21)], dark_wood)
        poly([(4,15), (9,11), (11,12), (6,18), (4,17)], tan, None)
        line([(5,7), (12,10), (19,7)], cream)
        line([(14,18), (19,16), (19,10)], wood)
    elif name == "hp":
        poly([(12,7), (15,4), (18,4), (21,7), (21,11), (19,14), (12,21), (5,15),
              (3,12), (3,8), (6,4), (9,4)], rust)
        poly([(12,9), (15,5), (18,5), (20,8), (19,11), (12,18), (5,12), (4,9),
              (7,5), (9,5)], red, None)
        line([(5,9), (7,6), (9,6)], warm, 2)
        line([(12,18), (18,13), (20,10)], rust)
    else:
        raise ValueError(f"Unknown HUD icon {name}")
    return image.resize((48,48), Image.Resampling.NEAREST)
