"""Optional art-maintenance step. Requires Pillow; normal builds use checked-in WebP files."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'assets' / 'equipment'
target = root / 'runtime'
target.mkdir(exist_ok=True)
for source in sorted(root.glob('*.png')):
    output = target / (source.stem + '.webp')
    if output.exists() and output.stat().st_mtime >= source.stat().st_mtime:
        continue
    with Image.open(source) as image:
        image.thumbnail((512, 512), Image.Resampling.LANCZOS)
        image.save(output, 'WEBP', quality=88, method=6)
    print(f'{source.name}: {source.stat().st_size} -> {output.stat().st_size} bytes', flush=True)
