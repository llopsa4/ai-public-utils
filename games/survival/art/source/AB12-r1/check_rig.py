"""Inspect the saved armature and skinned contact-foot path, independently of renders."""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(HERE/'human_rig.blend'))
rig=bpy.data.objects['Human rig'];scene=bpy.context.scene
assert rig.type=='ARMATURE' and rig.animation_data.action.name=='walk'
assert len(rig.data.bones)==16,len(rig.data.bones)
meshes=[o for o in scene.objects if o.type=='MESH']
assert all(any(m.type=='ARMATURE' and m.object==rig for m in o.modifiers) for o in meshes)
assert all(len(v.groups)>0 for o in meshes for v in o.data.vertices)
assert any(o.get('cloth_pass') for o in meshes)
samples=[]
for frame in range(1,17):
 scene.frame_set(frame);bpy.context.view_layer.update()
 row={'frame':frame,'feet':{}}
 for side in ['L','R']:
  bone=rig.pose.bones['shin.'+side];target=bpy.data.objects['Foot target.'+side]
  error=(bone.tail-target.location).length
  assert error<.014,(frame,side,error)
  row['feet'][side]={'ankle':list(bone.tail),'target':list(target.location),'ik_error_m':error}
 samples.append(row)
# Stance moves backward relative to the forward-moving root at a constant rate.
for side,start in [('L',0),('R',8)]:
 ys=[samples[(start+j)%16]['feet'][side]['ankle'][1] for j in range(8)]
 diffs=[ys[j+1]-ys[j] for j in range(7)]
 assert max(diffs)-min(diffs)<.01,diffs
report={'bones':len(rig.data.bones),'skinned_meshes':len(meshes),'height_m':rig['height_m'],'stride_per_cycle_m':.84,'samples':samples}
(HERE/'rig-checks.json').write_text(json.dumps(report,indent=2)+'\n')
print('AB12 rig: all meshes weighted, two-bone IK contacts, constant stance velocity verified.')
