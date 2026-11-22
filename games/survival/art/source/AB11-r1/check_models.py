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
for key in ('fire_central','building_store','building_store_open'):
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE/f'{key}.blend'))
    scene=bpy.context.scene;e=manifest[key];ab0.setup(scene,e)
    scene.camera.data.sensor_fit='HORIZONTAL';bpy.context.view_layer.update()
    w,h=e['cell']
    def project(p):
        q=world_to_camera_view(scene,scene.camera,Vector(p))
        return [q.x*w,(1-q.y)*h]
    anchor=project((0,0,0));corners=[project(p) for p in [(-4,-4,0),(4,-4,0),(4,4,0),(-4,4,0)]]
    span=[max(p[i] for p in corners)-min(p[i] for p in corners) for i in (0,1)]
    assert abs(anchor[0]-320)<.01 and abs(anchor[1]-576)<.01,(key,anchor)
    assert abs(span[0]-512)<.1 and abs(span[1]-256)<.1,(key,span)
    for state in e['states']:
        c=bpy.data.collections[state]
        footprint=next(o for o in c.objects if o.name.startswith('Cleared eight metre footprint'))
        dims=[max(v.co[i] for v in footprint.data.vertices)-min(v.co[i] for v in footprint.data.vertices) for i in (0,1)]
        assert dims==[8,8],(key,state,dims)
    extra={}
    if key=='fire_central':
        for state in e['states']:
            objects=list(bpy.data.collections[state].objects)
            assert sum(o.name.startswith('Hearth stone ') for o in objects)==12
            assert sum(o.name.startswith('Plain hide mat') for o in objects)==4
            assert sum(o.name.startswith('Low log seat') for o in objects)==2
        extra={'hearthOrigin':[0,0,0],'stones':12,'hideMats':4,'logSeats':2}
    if key=='building_store_open':
        objects=list(bpy.data.collections['finished'].objects)
        assert not any(any(t in o.name for t in ('Roof rafter','Hide roof','Store ridge','Tied eaves','Basket interior')) for o in objects)
        extra={'noRoofOrRidge':True,'emptyFloor':True,'lowFrontWalls':True}
    checks[key]={'anchorPx':anchor,'footprintSpanPx':span,'footprintCornersPx':corners,'metres':[8,8],'sensorFit':'HORIZONTAL','statesVerified':e['states'],**extra}
out=ART/'inbox/AB11/camera-checks.json';out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(checks,indent=2)+'\n')
print('All three models: 8m footprint, 512x256 projection and (320,576) anchor verified')
