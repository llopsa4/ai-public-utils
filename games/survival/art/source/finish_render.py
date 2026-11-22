"""Extract a colored shadow from an EEVEE matte and downsample the sprite."""
import sys
from PIL import Image, ImageChops, ImageFilter, PngImagePlugin


def finish(model, shadow, empty, output, width, height):
    foreground = Image.open(model).convert("RGBA")
    lit = Image.open(empty).convert("L")
    shaded = Image.open(shadow).convert("L")
    difference = ImageChops.subtract(lit, shaded)
    alpha = difference.point(lambda p: min(102, round(p * 1.9)))
    # The matte also sees the object itself. Remove it here so light model edges
    # do not inherit a dark rim when the two passes are composited.
    alpha = ImageChops.multiply(alpha, ImageChops.invert(foreground.getchannel("A")))
    alpha = alpha.filter(ImageFilter.GaussianBlur(1.8))
    cast = Image.new("RGBA", foreground.size, (28, 26, 36, 0))
    cast.putalpha(alpha)
    result = Image.alpha_composite(cast, foreground).resize((width, height), Image.Resampling.LANCZOS)
    if result.getbbox() and any((result.crop(box).getbbox() for box in (
        (0, 0, width, 2), (0, height - 2, width, height), (0, 0, 2, height), (width - 2, 0, width, height),
    ))):
        raise ValueError(f"Render clipped the 2 px safety border: {output}")
    info = PngImagePlugin.PngInfo()
    info.add(b"sRGB", b"\0")
    result.save(output, pnginfo=info)


if __name__ == "__main__":
    finish(*sys.argv[1:5], *map(int, sys.argv[5:7]))
