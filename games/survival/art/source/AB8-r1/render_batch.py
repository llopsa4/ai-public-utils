"""Use AB0 render.py camera/pass setup for all AB8 states and barricade masks.

Blender -b -P this file -- [key] [state] [mask]; optional filters aid iteration.
The AB0 script itself remains byte-identical; only its AB0-specific output loop is replaced here.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path
import bpy

HERE=Path(__file__).resolve().parent
SOURCE=HERE.parent
ART=SOURCE.parent
sys.path.insert(0,str(SOURCE))
import render as ab0

args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
manifest=json.loads((ART/'manifest.json').read_text(encoding='utf-8'))
for key in ('building_trap','building_fire_pit','building_barricade'):
    if args and args[0]!=key: continue
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE/f'{key}.blend'))
    scene=bpy.context.scene
    entry=manifest[key]
    ground=ab0.setup(scene,entry)
    states={name:bpy.data.collections[name] for name in entry['states']}
    for c in states.values(): c.hide_render=True
    out=ART/'inbox'/'AB8'/key;out.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='survival-ab8-') as folder:
        folder=Path(folder)
        empty=folder/'empty.png';ab0.render(scene,empty)
        for state,c in states.items():
            if len(args)>1 and args[1]!=state: continue
            c.hide_render=False
            masks=range(16) if key=='building_barricade' else [0]
            for mask in masks:
                if len(args)>2 and int(args[2])!=mask: continue
                if key=='building_barricade':
                    for sub in c.children: sub.hide_render=sub.name!=f'{state}_mask_{mask}'
                model,matte=folder/'model.png',folder/'matte.png'
                ground.hide_render=True;ab0.render(scene,model)
                ground.hide_render=False;ab0.render(scene,matte)
                index=str(mask) if key=='building_barricade' else '00'
                subprocess.run(['python',str(SOURCE/'finish_render.py'),str(model),str(matte),
                                str(empty),str(out/f'{state}_{index}.png'),*map(str,entry['cell'])],check=True)
                print(f'AB8 completed {key} {state} {mask}',flush=True)
            c.hide_render=True
