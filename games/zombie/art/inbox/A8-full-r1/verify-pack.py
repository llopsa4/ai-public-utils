"""Verify candidate PNGs, installed files and the packed UI atlas agree."""

import hashlib
import json
import sys
from pathlib import Path

from PIL import Image


BATCH = Path(__file__).resolve().parent
ART = Path(sys.argv[1]) / 'art'
atlas = Image.open(ART / 'atlas/ui.png').convert('RGBA')
frames = json.loads((ART / 'atlas/ui.json').read_text())['frames']
manifest = json.loads((ART / 'manifest.json').read_text())['ui']['items']
palette = set(json.loads((ART / 'palette.json').read_text()))
expected = {key for key, item in manifest.items() if item['group'] == 'kit'}
candidates = BATCH / 'candidate' / BATCH.name / 'ui'

records = {}
for file in sorted(candidates.glob('*.png')):
    frame = Image.open(file).convert('RGBA')
    assert tuple(manifest[file.stem]['size']) == frame.size, file.name
    rect = frames[file.stem]['frame']
    bounds = (rect['x'], rect['y'], rect['x'] + rect['w'], rect['y'] + rect['h'])
    assert atlas.crop(bounds).tobytes() == frame.tobytes(), file.name
    assert all(a == 0 or (a == 255 and f'#{r:02x}{g:02x}{b:02x}' in palette)
               for r, g, b, a in frame.get_flattened_data()), file.name
    digest = hashlib.sha256(file.read_bytes()).hexdigest()
    assert hashlib.sha256((ART / 'frames/ui' / file.name).read_bytes()).hexdigest() == digest, file.name
    records[file.stem] = {'size': list(frame.size), 'sha256': digest, 'matchesPackedPixels': True}

assert records.keys() == expected
(BATCH / sys.argv[2]).write_text(json.dumps(records, indent=2) + '\n')
print(f'Verified {len(records)} kit frames by size, palette, checksum and atlas pixels.')
