"""Reproducible shared human armature, painted materials and eight-sample walk."""
import bpy, math, sys, json, shutil
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent
SOURCE=HERE.parent
sys.path.insert(0,str(SOURCE))
from render import linear
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)

def material(name,color,texture=False,neutral=False):
    m=bpy.data.materials.new(name);m.use_nodes=True
    n=m.node_tree.nodes;p=n.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*linear(color),1)
    p.inputs['Roughness'].default_value=.92
    if texture:
        tex=n.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(SOURCE/'AB0-r1/hide.png'),check_existing=True)
        coord=n.new('ShaderNodeTexCoord');m.node_tree.links.new(coord.outputs['Generated'],tex.inputs['Vector'])
        tex.projection='BOX';tex.projection_blend=.3
        bw=n.new('ShaderNodeRGBToBW');m.node_tree.links.new(tex.outputs['Color'],bw.inputs[0])
        ramp=n.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].position=.12;ramp.color_ramp.elements[1].position=.85
        lo='6E6E6E' if neutral else color;hi='E6E6E6' if neutral else 'D9BC8C'
        ramp.color_ramp.elements[0].color=(*linear(lo),1);ramp.color_ramp.elements[1].color=(*linear(hi),1)
        m.node_tree.links.new(bw.outputs[0],ramp.inputs[0]);m.node_tree.links.new(ramp.outputs[0],p.inputs['Base Color'])
        noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=120;noise.inputs['Detail'].default_value=2
        bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.13;bump.inputs['Distance'].default_value=.008
        m.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs[0],p.inputs['Normal'])
    return m
skin=material('Skin A8704A','A8704A');hair=material('Hair 1E1A18','1E1A18')
cloth=material('CLOTH neutral painted hide','A8A8A8',True,True)
hide=material('Natural leggings','A97F52',True);leather=material('Moccasins and belt','6B4A2E')
beads=[material('Plain band '+c,c) for c in ['F2F0EA','3F6FA8','B5442E']]
arm=bpy.data.armatures.new('Shared human skeleton');rig=bpy.data.objects.new('Human rig',arm);bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
def bone(name,a,b,parent=None):
    q=arm.edit_bones.new(name);q.head=a;q.tail=b
    if parent:q.parent=arm.edit_bones[parent]
bone('root',(0,0,0),(0,0,.2));bone('pelvis',(0,0,.84),(0,0,1.01),'root')
bone('spine',(0,0,1.01),(0,0,1.44),'pelvis');bone('head',(0,0,1.44),(0,0,1.72),'spine')
for side,x in [('L',-.115),('R',.115)]:
    bone('thigh.'+side,(x,0,.85),(x,-.025,.46),'pelvis')
    bone('shin.'+side,(x,-.025,.46),(x,0,.075),'thigh.'+side)
    bone('foot.'+side,(x,0,.075),(x,-.14,.075),'shin.'+side)
    a=-1 if x<0 else 1
    bone('upper_arm.'+side,(a*.225,0,1.40),(a*.28,0,1.13),'spine')
    bone('forearm.'+side,(a*.28,0,1.13),(a*.29,-.01,.91),'upper_arm.'+side)
    bone('hand.'+side,(a*.29,-.01,.91),(a*.29,-.01,.81),'forearm.'+side)
bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)
def bind(o,b,m):
    o.data.materials.append(m);o['cloth_pass']=m==cloth
    v=o.vertex_groups.new(name=b);v.add(list(range(len(o.data.vertices))),1,'REPLACE')
    mod=o.modifiers.new('Shared rig','ARMATURE');mod.object=rig;o.parent=rig
    for p in o.data.polygons:p.use_smooth=True
    return o
def ell(name,pos,size,m,b):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=pos)
    o=bpy.context.object;o.name=name;o.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return bind(o,b,m)
def tube(name,a,b,r1,r2,m,bn):
    d=Vector(b)-Vector(a)
    bpy.ops.mesh.primitive_cone_add(vertices=20,radius1=r1,radius2=r2,depth=d.length,location=(Vector(a)+Vector(b))/2)
    o=bpy.context.object;o.name=name;o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    bevel=o.modifiers.new('Soft seams','BEVEL');bevel.width=.009;bevel.segments=2
    return bind(o,bn,m)
def shell(name,rings,m,b):
    verts=[];faces=[];N=40
    for z,rx,ry in rings:
        for i in range(N):
            t=i*2*math.pi/N;verts.append((rx*math.cos(t),ry*math.sin(t),z))
    for j in range(len(rings)-1):
        for i in range(N):
            a=j*N+i;bb=j*N+(i+1)%N;faces.append((a,bb,bb+N,a+N))
    faces.extend([tuple(range(N-1,-1,-1)),tuple((len(rings)-1)*N+i for i in range(N))])
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
    o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);return bind(o,b,m)
shell('Plain thigh-length shirt',[(.72,.23,.13),(.86,.205,.13),(1.00,.17,.105),(1.18,.195,.115),(1.37,.23,.12),(1.43,.18,.10),(1.47,.08,.075)],cloth,'spine')
ell('Neck',(0,0,1.48),(.064,.065,.085),skin,'head')
ell('Head',(0,-.003,1.598),(.105,.087,.122),skin,'head')
ell('Jaw',(0,-.035,1.55),(.078,.069,.055),skin,'head')
ell('Nose',(0,-.091,1.594),(.022,.033,.028),skin,'head')
for x in [-.045,.045]:
    ell('Quiet eye',(x,-.085,1.619),(.011,.008,.006),hair,'head')
    ell('Ear',(math.copysign(.101,x),0,1.586),(.018,.022,.032),skin,'head')
ell('Hair crown',(0,.014,1.662),(.108,.09,.059),hair,'head')
ell('Hair back',(0,.066,1.564),(.098,.05,.107),hair,'head')
# Narrow plain headband follows the head, with no worn feathers or symbols.
band=shell('Plain hide headband',[(1.65,.108,.09),(1.662,.108,.09)],leather,'head')
for a in [-1,1]:
    for j in range(9):
        ell('Braid', (a*(.091+.008*math.sin(j*2)), -.025-.007*j,1.57-.034*j),(.024-.0013*j,.023-.0011*j,.024),hair,'head')
    ell('Plain braid tie',(a*.096,-.087,1.29),(.019,.018,.009),leather,'head')
shell('Plain belt',[(.982,.181,.12),(1.015,.18,.12)],leather,'pelvis')
ell('Belt pouch',(.165,-.11,.92),(.05,.037,.075),hide,'pelvis')
# Small, unpatterned white / blue / rust bead band at the yoke.
for j in range(33):
    t=2*math.pi*j/33
    ell('Plain bead',(.225*math.cos(t),.122*math.sin(t),1.365),(.011,.009,.008),beads[(j//2)%3],'spine')
for side,a in [('L',-1),('R',1)]:
    x=a*.115
    tube('Legging upper',(x,0,.84),(x,-.025,.46),.075,.065,hide,'thigh.'+side)
    ell('Legging knee',(x,-.025,.46),(.064,.063,.073),hide,'shin.'+side)
    tube('Legging lower',(x,-.025,.46),(x,0,.11),.062,.047,hide,'shin.'+side)
    ell('Moccasin',(x,-.055,.065),(.061,.124,.052),leather,'foot.'+side)
    ell('Shirt shoulder',(a*.218,0,1.38),(.085,.09,.09),cloth,'upper_arm.'+side)
    tube('Upper sleeve',(a*.225,0,1.40),(a*.28,0,1.13),.086,.062,cloth,'upper_arm.'+side)
    ell('Sleeve elbow',(a*.28,0,1.13),(.062,.062,.065),cloth,'forearm.'+side)
    tube('Lower sleeve',(a*.28,0,1.13),(a*.29,-.01,.93),.064,.055,cloth,'forearm.'+side)
    ell('Hand',(a*.29,-.01,.865),(.039,.029,.065),skin,'hand.'+side)
    ell('Thumb',(a*.268,-.027,.884),(.02,.022,.032),skin,'hand.'+side)
for side,x in [('L',-.115),('R',.115)]:
    target=bpy.data.objects.new('Foot target.'+side,None);bpy.context.collection.objects.link(target);target.parent=rig
    pole=bpy.data.objects.new('Knee pole.'+side,None);bpy.context.collection.objects.link(pole);pole.parent=rig;pole.location=(x,-1,.46)
    ik=rig.pose.bones['shin.'+side].constraints.new('IK');ik.target=target;ik.pole_target=pole;ik.chain_count=2;ik.pole_angle=-math.pi/2
    # Keep the shoe horizontal while the chain bends.
    orient=bpy.data.objects.new('Shoe orientation.'+side,None);bpy.context.collection.objects.link(orient);orient.parent=rig
    orient.rotation_euler=arm.bones['foot.'+side].matrix_local.to_euler()
    foot=rig.pose.bones['foot.'+side];c=foot.constraints.new('COPY_ROTATION');c.target=orient;c.target_space='WORLD';c.owner_space='WORLD'
rig.animation_data_create()
for frame in range(1,18):
    phase=(frame-1)/16*2*math.pi
    pelvis=rig.pose.bones['pelvis'];pelvis.location=(0,-.035+.008*math.cos(phase*2),0);pelvis.keyframe_insert('location',frame=frame,group='Body weight')
    for side,offset in [('L',0),('R',math.pi)]:
        t=((phase+offset)/(2*math.pi))%1
        # A half-cycle planted stance, then lifted return; no horizontal drift in stance.
        y=-.21+.84*t if t<.5 else .21-.84*(t-.5)
        z=.075 if t<.5 else .075+.105*math.sin((t-.5)*2*math.pi)
        target=bpy.data.objects['Foot target.'+side];target.location=((-1 if side=='L' else 1)*.115,y,z);target.keyframe_insert('location',frame=frame,group='Planted foot and return')
        for name,angle in [('upper_arm.',-.38*math.cos(phase+offset)),('forearm.',-.12-.08*math.sin(phase+offset))]:
            pb=rig.pose.bones[name+side];pb.rotation_mode='XYZ';pb.rotation_euler.x=angle;pb.keyframe_insert('rotation_euler',frame=frame,group='Arm swing')
action=rig.animation_data.action;action.name='walk';action.use_fake_user=True
# Target objects have their own actions, retained with the same explicit cycle.
for o in bpy.data.objects:
    if o.animation_data and o.animation_data.action:o.animation_data.action.use_fake_user=True
scene=bpy.context.scene;scene.frame_start=1;scene.frame_end=16;scene.render.fps=24
rig['height_m']=1.72;rig['cycle_frames']=16;rig['stride_m']=.84;rig['facing_s_rotation_deg']=45
scene.frame_set(1)
for image in bpy.data.images:
    if image.source=='FILE':image.pack()
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'human_rig.blend'))
shutil.copy2(SOURCE/'human_rig.blend',HERE/'human_rig.blend')
shutil.copy2(SOURCE.parent/'inbox/done/AB0-r1/concept/person_man.png',HERE/'concept_person_man.png')
print('AB12 human rig saved: shared skeleton, walk action, packed AB0 hide.')
