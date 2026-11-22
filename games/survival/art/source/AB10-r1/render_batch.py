"""AB10 output loop using unchanged AB0 camera, lighting, matte and post."""
import json
import subprocess
import sys
import tempfile
import shutil
from pathlib import Path
import bpy
HERE=Path(__file__).resolve().parent
SOURCE=HERE.parent
ART=SOURCE.parent
sys.path.insert(0,str(SOURCE))
import render as ab0
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
manifest=json.loads((ART/'manifest.json').read_text())
for suffix in ('healers_lodge','scouts_lodge','lancers_lodge','archers_lodge','spirit_lodge'):
    key='building_'+suffix
    if args and args[0]!=key:continue
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE/f'{key}.blend'))
    scene=bpy.context.scene;entry=manifest[key];ground=ab0.setup(scene,entry)
    # AUTO fits the vertical sensor in a portrait cell, inflating the footprint
    # by 512/384 and moving the origin below its anchor. Explicit horizontal
    # fit makes AB0's width-based scale/shift formulas meet SPEC sections 2-3.
    scene.camera.data.sensor_fit='HORIZONTAL'
    states={s:bpy.data.collections[s] for s in entry['states']}
    for c in states.values():c.hide_render=True
    out=ART/'inbox'/'AB10'/key;out.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='survival-ab10-') as tmp:
        tmp=Path(tmp);empty=tmp/'empty.png';ab0.render(scene,empty)
        for state,c in states.items():
            if len(args)>1 and state not in args[1:]:continue
            c.hide_render=False
            n=entry.get('anims',{}).get(state,{}).get('frames',1) if entry.get('anims') else 1
            for index in range(n):
                if (out/f'{state}_{index:02d}.png').exists():
                    continue
                scene.frame_set(1+int(index*24/n))
                model,matte=tmp/'model.png',tmp/'matte.png'
                ground.hide_render=True;ab0.render(scene,model)
                ground.hide_render=False;ab0.render(scene,matte)
                try:
                    subprocess.run(['python',str(SOURCE/'finish_render.py'),str(model),str(matte),str(empty),str(out/f'{state}_{index:02d}.png'),*map(str,entry['cell'])],check=True)
                except subprocess.CalledProcessError:
                    debug=HERE/'render-diagnostic';debug.mkdir(exist_ok=True)
                    for p in (model,matte,empty):shutil.copyfile(p,debug/p.name)
                    raise
                print(f'AB10 completed {key} {state} {index}',flush=True)
            c.hide_render=True
