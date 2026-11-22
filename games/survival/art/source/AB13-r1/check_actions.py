import bpy,json,sys,math
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent;SOURCE=HERE.parent;ART=SOURCE.parent
rig=bpy.data.objects['Human rig'];scene=bpy.context.scene
registry=json.loads(rig['action_registry']);manifest=json.loads((ART/'manifest.json').read_text())['person_man']
rows=[]
for anim,spec in manifest['anims'].items():
    for o in scene.objects:
        if o.animation_data:o.animation_data.action=None
    for pb in rig.pose.bones:pb.location=(0,0,0);pb.rotation_euler=(0,0,0)
    for name,action in registry[anim].items():
        o=bpy.data.objects[name];o.animation_data_create();o.animation_data.action=bpy.data.actions[action]
    for side in ['L','R']:rig.pose.bones['forearm.'+side].constraints['AB13 wrist IK'].influence=0 if anim=='walk' else 1
    errs=[];foot=[]
    for i in range(spec['frames']):
        f=1+i*(16/spec['frames'] if anim=='walk' else 24/spec['fps']);scene.frame_set(int(f),subframe=f%1);bpy.context.view_layer.update()
        for side in ['L','R']:
            if anim!='walk':errs.append((rig.pose.bones['forearm.'+side].tail-bpy.data.objects['Wrist target.'+side].location).length)
            foot.append(list(rig.pose.bones['shin.'+side].tail))
    assert max(errs,default=0)<.005,(anim,max(errs))
    rows.append(dict(anim=anim,max_wrist_error=max(errs,default=0),foot_positions=foot))
(HERE/'action-checks.json').write_text(json.dumps(rows,indent=2))
print([(r['anim'],round(r['max_wrist_error'],3)) for r in rows])
