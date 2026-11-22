"""Render the complete non-walk set with one persistent Blender scene."""
from pathlib import Path
import json,subprocess
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
anims=[a for a in json.loads((ROOT/'art/manifest.json').read_text())['person_man']['anims'] if a!='walk']
with (HERE/'render-all.log').open('w') as log:
    subprocess.run(['C:/Program Files/Blender Foundation/Blender 5.1/blender.exe','-b','--python-exit-code','1','-P',str(HERE/'render_remaining.py'),'--',*anims],cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,check=True)
print('Complete non-walk action set rendered; approved walk is copied by prepare.py.')
