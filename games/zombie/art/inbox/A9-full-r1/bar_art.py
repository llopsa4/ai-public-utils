"""Paint the remaining action symbols at their 48 px display size."""

from PIL import Image, ImageDraw


def action_icon(name):
    image = Image.new("RGBA", (48, 48))
    draw = ImageDraw.Draw(image)
    ink = "#24272a"
    dark, slate, mid, light, pale = "#363b3f", "#4b5358", "#646e73", "#a1adb0", "#c0c8c4"
    earth, dark_wood, wood, tan, bright = "#302724", "#45362d", "#785c46", "#ae8b66", "#e0c7a1"

    def poly(points, fill, outline=ink):
        draw.polygon(points, fill=fill, outline=outline)

    def line(points, fill, width=1):
        draw.line(points, fill=fill, width=width)

    if name == "cook":
        # A steel camp pot above an ochre fire, silhouetted as two separate shapes.
        poly([(14,33),(16,30),(18,35),(20,35),(22,31),(23,27),(26,31),(27,34),
              (30,29),(31,33),(34,35),(33,39),(29,42),(18,41),(14,38)], "#957456")
        poly([(17,38),(21,35),(22,37),(25,31),(26,37),(30,34),(31,37),(29,40),
              (23,41)], "#c7b77d", None)
        line([(17,42),(31,42)], dark_wood)
        poly([(7,19),(10,16),(15,17),(33,17),(38,16),(41,18),(40,22),(35,24),
              (13,24),(8,23)], slate)
        line([(9,18),(13,18)], light)
        line([(36,18),(39,18),(39,20)], light)
        poly([(12,16),(16,11),(20,10),(21,7),(26,7),(28,10),(34,12),(37,17),
              (35,24),(31,30),(27,32),(20,32),(15,29),(12,24)], dark)
        poly([(13,18),(20,20),(33,19),(34,22),(31,28),(27,30),(19,30),(15,27)], slate, None)
        poly([(14,20),(17,21),(18,27),(16,27)], mid, None)
        poly([(13,16),(17,12),(22,11),(29,11),(34,14),(36,17),(29,19),(19,19)], mid)
        line([(15,16),(20,13),(24,13)], pale)
        line([(22,8),(26,8)], light)
        line([(21,20),(33,19)], light)
        draw.point((16,23), fill=light)
        draw.point((21,27), fill=mid)
    elif name == "spike":
        poly([(7,30),(13,25),(25,22),(39,27),(43,32),(37,38),(26,42),(13,39),(6,35)], dark_wood)
        poly([(9,30),(16,27),(27,25),(38,29),(38,34),(29,38),(17,37),(12,34)], earth)
        line([(8,34),(13,37),(20,38)], wood)
        line([(28,39),(39,34)], wood)
        for outer, inner, edge in [
            ([(13,34),(12,25),(10,15),(12,10),(17,15),(19,25),(18,34)],
             [(13,17),(15,15),(17,25),(17,32),(15,31)], [(12,13),(14,18),(15,25)]),
            ([(23,37),(21,28),(22,15),(24,6),(28,11),(30,20),(28,35)],
             [(24,13),(26,11),(28,20),(26,34),(24,35)], [(24,9),(24,15),(24,24)]),
            ([(30,35),(30,28),(33,18),(39,12),(40,18),(37,30),(34,35)],
             [(34,22),(38,16),(38,20),(35,31),(32,33)], [(38,14),(35,20),(33,27)]),
        ]:
            poly(outer, wood)
            poly(inner, tan, None)
            line(edge, bright)
        line([(15,37),(22,39),(30,38)], "#957456")
        draw.point((10,34), fill=tan)
        draw.point((38,34), fill=tan)
    elif name == "can":
        line([(8,10),(15,10),(22,12),(29,11),(39,7)], ink, 3)
        line([(8,10),(15,10),(22,12),(29,11),(39,7)], tan)
        for x, y, shift in [(9,19,-2), (20,21,1), (31,16,2)]:
            top = (x+4, y)
            line([(x+3,10),(x+4,y-3),top], dark_wood, 3)
            line([(x+3,10),(x+4,y-3),top], bright)
            poly([(x,y),(x+2,y-2),(x+8,y-2),(x+10,y),(x+10+shift,y+13),
                  (x+7+shift,y+15),(x+2+shift,y+15),(x+shift,y+13)], slate)
            poly([(x+1,y+2),(x+4,y+3),(x+7,y+2),(x+7+shift,y+12),
                  (x+4+shift,y+13),(x+1+shift,y+12)], mid, None)
            line([(x+1,y),(x+3,y-1),(x+7,y-1),(x+9,y)], pale)
            line([(x+2,y+5),(x+3+shift,y+11)], light)
            line([(x+1+shift,y+13),(x+6+shift,y+14),(x+9+shift,y+12)], light)
        line([(9,13),(8,11),(7,9)], bright)
        line([(38,8),(40,8),(42,10)], tan)
    else:
        raise ValueError(f"Unknown action icon {name}")

    return image.resize((96,96), Image.Resampling.NEAREST)
