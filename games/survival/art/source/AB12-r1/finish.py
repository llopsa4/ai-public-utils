"""Downsample base/shadow and occluded greyscale cloth using identical filters."""
import sys
from pathlib import Path
from PIL import Image,ImageChops,PngImagePlugin
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from finish_render import finish
base,shadow,empty,mask,out,prefix,w,h=sys.argv[1:];w,h=int(w),int(h);out=Path(out)
finish(base,shadow,empty,str(out/f'base_{prefix}.png'),w,h)
cloth=Image.open(mask).convert('RGBA').resize((w,h),Image.Resampling.LANCZOS)
gray=cloth.convert('L');cloth=Image.merge('RGBA',(gray,gray,gray,cloth.getchannel('A')))
# Filter ringing must not create cloth outside the full figure's coverage.
a=Image.open(out/f'base_{prefix}.png').getchannel('A');cloth.putalpha(ImageChops.darker(cloth.getchannel('A'),a))
info=PngImagePlugin.PngInfo();info.add(b'sRGB',b'\0');cloth.save(out/f'cloth_{prefix}.png',pnginfo=info)
