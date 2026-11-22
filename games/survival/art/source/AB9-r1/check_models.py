"""Numerically verify the camera anchor and four-metre footprints in source models."""
import json
import sys
from pathlib import Path
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
HERE=Path(__file__).resolve().parent
SOURCE=HERE.parent
ART=SOURCE.parent
sys.path.insert(0,str(SOURCE))
import render as ab0
manifest=json.loads((ART/'manifest.json').read_text())
checks={}
for suffix in ('gathering_spot','hunting_lodge','drying_rack','horse_corral'):
    key='building_'+suffix
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE/f'{key}.blend'))
    scene=bpy.context.scene;e=manifest[key];ab0.setup(scene,e)
    scene.camera.data.sensor_fit='HORIZONTAL';bpy.context.view_layer.update()
    w,h=e['cell']
    def project(p):
        q=world_to_camera_view(scene,scene.camera,Vector(p))
        return [q.x*w,(1-q.y)*h]
    anchor=project((0,0,0));corners=[project(p) for p in [(-2,-2,0),(2,-2,0),(2,2,0),(-2,2,0)]]
    span=[max(p[i] for p in corners)-min(p[i] for p in corners) for i in (0,1)]
    assert abs(anchor[0]-192)<.01 and abs(anchor[1]-384)<.01,(key,anchor)
    assert abs(span[0]-256)<.1 and abs(span[1]-128)<.1,(key,span)
    for state in e['states']:
        c=bpy.data.collections[state]
        footprint=next(o for o in c.objects if o.name.startswith('Cleared four metre footprint'))
        dims=[max(v.co[i] for v in footprint.data.vertices)-min(v.co[i] for v in footprint.data.vertices) for i in (0,1)]
        assert dims==[4,4],(key,state,dims)
    checks[key]={'anchorPx':anchor,'footprintSpanPx':span,'footprintCornersPx':corners,'metres':[4,4],'sensorFit':'HORIZONTAL','statesVerified':e['states']}
out=ART/'inbox/AB9/camera-checks.json';out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(checks,indent=2)+'\n')
print('All four models: 4m footprint, 256x128 projection and (192,384) anchor verified')
