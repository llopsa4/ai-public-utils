"""Rigged figure extension; preserves the AB0 building path in render.py."""
import bpy, math, sys, tempfile, subprocess, json
from pathlib import Path
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector
HERE=Path(__file__).resolve().parent
SOURCE=HERE.parent;ART=SOURCE.parent
sys.path.insert(0,str(SOURCE))
from render import setup, render
FACINGS=dict(zip(['s','sw','w','nw','n','ne','e','se'],[0,-45,-90,-135,180,135,90,45]))

def render_figures(key,entry,chosen):
    anims=chosen or [a for a in entry['anims'] if a != 'walk']
    scene=bpy.context.scene;rig=bpy.data.objects['Human rig']
    ground=setup(scene,entry);scene.camera.data.sensor_fit='HORIZONTAL'
    w,h=entry['cell'];out=ART/'inbox/AB13'/key;out.mkdir(parents=True,exist_ok=True)
    materials={o.name:list(o.data.materials) for o in scene.objects if o.type=='MESH' and o!=ground}
    hold=bpy.data.materials.new('Noncloth holdout');hold.use_nodes=True
    nodes=hold.node_tree.nodes;nodes.clear();shader=nodes.new('ShaderNodeHoldout');end=nodes.new('ShaderNodeOutputMaterial');hold.node_tree.links.new(shader.outputs[0],end.inputs['Surface'])
    checks=[]
    with tempfile.TemporaryDirectory(prefix='survival-figure-') as raw:
        raw=Path(raw)
        for o in materials:bpy.data.objects[o].hide_render=True
        empty=raw/'empty.png';render(scene,empty)
        for o in materials:bpy.data.objects[o].hide_render=False
        for anim in anims:
            registry=json.loads(rig['action_registry'])
            for o in scene.objects:
                if o.animation_data:o.animation_data.action=None
            for pb in rig.pose.bones:
                pb.location=(0,0,0);pb.rotation_euler=(0,0,0)
            for name,action in registry[anim].items():
                o=bpy.data.objects[name];o.animation_data_create();o.animation_data.action=bpy.data.actions[action]
            for side in ['L','R']:rig.pose.bones['forearm.'+side].constraints['AB13 wrist IK'].influence=0 if anim=='walk' else 1
            for name in materials:
                o=bpy.data.objects[name];o.hide_render=bool(o.get('animations')) and anim not in o['animations'].split(',')
            n=entry['anims'][anim]['frames']
            for facing,angle in FACINGS.items():
                rig.rotation_euler.z=math.radians(45+angle)
                for i in range(n):
                    frame=1+i*24/entry['anims'][anim]['fps'];scene.frame_set(int(frame),subframe=frame%1)
                    for name,mats in materials.items():
                        o=bpy.data.objects[name];o.data.materials.clear()
                        for m in mats:o.data.materials.append(m)
                    base=raw/'base.png';shadow=raw/'shadow.png';mask=raw/'cloth.png'
                    ground.hide_render=True;render(scene,base)
                    ground.hide_render=False;render(scene,shadow)
                    ground.hide_render=True
                    for name in materials:
                        o=bpy.data.objects[name]
                        if not o.get('cloth_pass'):
                            o.data.materials.clear();o.data.materials.append(hold)
                    render(scene,mask)
                    prefix=f'{anim}_{facing}_{i:02}'
                    subprocess.run(['python',str(SOURCE/'AB12-r1/finish.py'),str(base),str(shadow),str(empty),str(mask),str(out),prefix,str(w),str(h)],check=True)
                    p=world_to_camera_view(scene,scene.camera,Vector((0,0,0)))
                    # Camera screen axes, and the model's forward vector projected into them.
                    forward=rig.matrix_world.to_3x3()@Vector((0,-1,0))
                    origin=world_to_camera_view(scene,scene.camera,Vector((0,0,0)))
                    endp=world_to_camera_view(scene,scene.camera,forward)
                    checks.append(dict(facing=facing,frame=i,anchor=[p.x*w,(1-p.y)*h],forward_px=[(endp.x-origin.x)*w,-(endp.y-origin.y)*h]))
                    print('AB13 rendered '+prefix,flush=True)
    (HERE/'projection-checks.json').write_text(json.dumps(checks,indent=2))


if __name__=='__main__':
    key,*chosen=sys.argv[sys.argv.index('--')+1:]
    render_figures(key,json.loads((ART/'manifest.json').read_text())[key],chosen)
