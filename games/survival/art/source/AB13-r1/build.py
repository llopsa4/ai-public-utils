"""Extend the approved AB12 figure without changing its retained source or walk frames."""
import bpy, math, json, sys, shutil
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent; SOURCE=HERE.parent; ART=SOURCE.parent
sys.path.insert(0,str(SOURCE))
from render import linear
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'AB12-r1/human_rig.blend'))
rig=bpy.data.objects['Human rig']; scene=bpy.context.scene
manifest=json.loads((ART/'manifest.json').read_text())['person_man']
original={o.name:o.animation_data.action for o in scene.objects if o.animation_data and o.animation_data.action}
registry={'walk':{k:v.name for k,v in original.items()}}

def mat(name,color,texture=None):
    m=bpy.data.materials.new(name);m.use_nodes=True
    n=m.node_tree.nodes;p=n.get('Principled BSDF');p.inputs['Base Color'].default_value=(*linear(color),1);p.inputs['Roughness'].default_value=.95
    if texture:
        t=n.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(SOURCE/texture),check_existing=True);t.projection='BOX';t.projection_blend=.3
        c=n.new('ShaderNodeTexCoord');m.node_tree.links.new(c.outputs['Generated'],t.inputs['Vector']);m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
    return m
wood=mat('AB13 painted pole wood','8C8070','textures/wood_pole.png')
stone=mat('AB13 painted stone','8F877A','textures/stone_painted.png')
hide=mat('AB13 painted hide','D9BC8C','AB0-r1/hide.png')
weave=mat('AB13 painted basket weave','A97F52','textures/mat_woven.png')
rope=mat('AB13 plain lashing','A97F52'); water=mat('AB13 splash','9DBDB2')
props={}
def control(name,anims):
    o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);o.parent=rig;props[name]=o;o['animations']=','.join(anims);return o
def attach(o,parent,m):
    o.parent=parent;o.data.materials.append(m);o['animations']=parent['animations'];o['cloth_pass']=False
    for p in o.data.polygons:p.use_smooth=True
    return o
def rod(name,a,b,r,parent,m):
    d=Vector(b)-Vector(a);bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=r,depth=d.length,location=(Vector(a)+Vector(b))/2)
    o=bpy.context.object;o.name=name;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return attach(o,parent,m)
def ell(name,p,s,parent,m):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=p);o=bpy.context.object;o.name=name;o.scale=s;return attach(o,parent,m)
def torus(name,p,major,minor,parent,m,rot=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_segments=32,minor_segments=8,location=p,major_radius=major,minor_radius=minor,rotation=rot)
    o=bpy.context.object;o.name=name;return attach(o,parent,m)

# Tools have one animated parent each. Their grips drive the wrist IK positions.
for key in ['axe','maul','club','lance','spear','scraper']:
    an={'axe':['chop'],'maul':['build'],'club':['strike'],'lance':['thrust'],'spear':['fish'],'scraper':['scrape']}[key]
    c=control(key,an);length={'axe':.65,'maul':.62,'club':.52,'lance':1.7,'spear':1.6,'scraper':.19}[key]
    rod(key+' shaft',(0,0,-.16),(0,0,length-.16),.018 if key!='scraper' else .025,c,wood)
    if key in ['axe','maul']:
        ell(key+' stone head',(0,0,length-.17),(.125,.045,.067) if key=='axe' else (.095,.072,.074),c,stone)
        for z in [length-.22,length-.19,length-.16]:torus('Plain head lashing',(0,0,z),.025,.009,c,rope)
    elif key in ['lance','spear']:
        bpy.ops.mesh.primitive_cone_add(vertices=12,radius1=.034,radius2=0,depth=.14,location=(0,0,length-.10));attach(bpy.context.object,c,stone)
    elif key=='club':ell('Club head',(0,0,.35),(.055,.052,.11),c,wood)
    else:ell('Flat hide scraper',(0,0,.06),(.085,.023,.065),c,stone)
    if key in ['lance','spear']:
        # Hold the full-length shaft near its centre so its forward cast shadow fits
        # the fixed person cell even when the point faces directly down-screen.
        for o in c.children:o.location.z-=.8 if key=='lance' else .5
bow=control('bow',['shoot']); pts=[]
for i in range(17):
    z=-.43+i*.86/16;pts.append((0,-.12*(1-(z/.43)**2),z))
for a,b in zip(pts,pts[1:]):rod('Self bow limb',a,b,.013,bow,wood)
strings=[]
for name in ['upperstring','lowerstring']:
    c=control(name,['shoot']);rod('Drawn plain bowstring',(0,0,-.5),(0,0,.5),.003,c,rope);strings.append(c)
arrow=control('arrow',['shoot']);rod('Nocked arrow',(0,0,-.34),(0,0,.35),.005,arrow,wood)
quiver=control('quiver',['shoot']);ell('Hip quiver',(0,0,0),(.065,.06,.24),quiver,hide)
for x in [-.025,0,.025]:rod('Quiver arrow',(x,0,.08),(x,0,.34),.005,quiver,wood)
basket=control('basket',['gather']);ell('Woven gathering basket',(0,0,.09),(.14,.12,.11),basket,weave);torus('Basket rim',(0,0,.17),.13,.014,basket,weave)
bundle=control('bundle',['carry_walk']);ell('Hide wrapped load',(0,0,0),(.22,.13,.26),bundle,hide)
for z in [-.14,.14]:torus('Bundle lashing',(0,0,z),.15,.012,bundle,rope)
rod('Chest tumpline',(-.19,-.38,.12),(.19,-.38,.12),.018,bundle,rope)
for x in [-.17,.17]:rod('Load shoulder strap',(x,0,.23),(x,-.38,.12),.014,bundle,rope)
workhide=control('workhide',['scrape']);ell('Ground hide',(0,0,.012),(.29,.35,.018),workhide,hide)
for x in [-.3,.3]:
    for y in [-.29,.29]:rod('Plain scraping frame leg',(x,y,-.60),(x,y,.02),.017,workhide,wood)
for y in [-.29,.29]:rod('Scraping frame crossbar',(-.3,y,0),(.3,y,0),.017,workhide,wood)
splash=control('splash',['fish'])
for i in range(7):
    a=i*2*math.pi/7;ell('Small spear splash',(.12*math.cos(a),.12*math.sin(a),.03+(i%3)*.025),(.018,.018,.035),splash,water)

targets={}
for side,x in [('L',-.29),('R',.29)]:
    t=bpy.data.objects.new('Wrist target.'+side,None);scene.collection.objects.link(t);t.parent=rig;targets[side]=t
    pole=bpy.data.objects.new('Elbow pole.'+side,None);scene.collection.objects.link(pole);pole.parent=rig;pole.location=(x*3,.25,1.05)
    c=rig.pose.bones['forearm.'+side].constraints.new('IK');c.name='AB13 wrist IK';c.target=t;c.pole_target=pole;c.chain_count=2;c.pole_angle=-math.pi/2;c.influence=0

def key(o,frame):
    o.keyframe_insert('location',frame=frame);o.keyframe_insert('rotation_euler',frame=frame);o.keyframe_insert('scale',frame=frame)
def pose(anim,i,n):
    t=i/n; p=t*2*math.pi; breath=math.cos(p) if anim=='sit' else math.sin(p); hit=[0,.16,.65,1,.28,0][min(i,5)]
    root=rig.pose.bones['pelvis']; root.location=(0,0,0);root.rotation_euler=(0,0,0)
    spine=rig.pose.bones['spine'];spine.rotation_euler=(0,0,0)
    head=rig.pose.bones['head'];head.rotation_euler=(0,0,.06*breath if anim=='idle' else 0)
    for side,x in [('L',-.115),('R',.115)]:
        bpy.data.objects['Foot target.'+side].location=(x,0,.075)
    hands={'L':Vector((-.29,-.01,.91)),'R':Vector((.29,-.01,.91))}
    for o in props.values():o.location=(0,0,0);o.rotation_euler=(0,0,0);o.scale=(1,1,1)
    if anim=='idle':spine.rotation_euler.x=.012*breath
    if anim=='carry_walk':
        root.location.y=-.045+.008*math.cos(p*2);spine.rotation_euler.x=.10
        for side,off in [('L',0),('R',.5)]:
            u=(t+off)%1;y=-.21+.84*u if u<.5 else .21-.84*(u-.5);z=.075 if u<.5 else .075+.105*math.sin((u-.5)*2*math.pi)
            bpy.data.objects['Foot target.'+side].location=((-1 if side=='L' else 1)*.115,y,z)
        hands={'L':Vector((-.18,-.20,1.20)),'R':Vector((.18,-.20,1.20))};bundle.location=(0,.20,1.19)
    if anim in ['chop','build','strike']:
        o=props[{'chop':'axe','build':'maul','strike':'club'}[anim]];o.location=(.03,-.24-.18*hit,1.43-.50*hit);o.rotation_euler.x=-.7+2.25*hit
        spine.rotation_euler.x=.05+.20*hit
        hands['R']=o.location+Vector((.035,0,0));hands['L']=o.location+o.rotation_euler.to_matrix()@Vector((-.035,0,-.12))
    if anim=='gather':
        b=(1-math.cos(p))/2;spine.rotation_euler.x=.12+.48*b;root.location.y=-.10*b
        hands['R']=Vector((.18,-.27-.25*b,.92-.30*b));hands['L']=Vector((-.18,-.15,.86));basket.location=(-.25,-.15,.62)
    if anim in ['scrape','tend','sit']:
        root.location.y=-.45 if anim!='sit' else -.57;spine.rotation_euler.x=.15+.025*breath
        for side,x in [('L',-.115),('R',.115)]:bpy.data.objects['Foot target.'+side].location=(x*1.6,.20 if anim!='sit' else -.1,.075)
        z=.42 if anim!='sit' else .36;hands={'L':Vector((-.13,-.36-.07*breath,z)),'R':Vector((.13,-.36-.07*breath,z))}
        if anim=='sit':
            for side,x in [('L',-.115),('R',.115)]:bpy.data.objects['Foot target.'+side].location=(-x,-.30,.075)
            hands={'L':Vector((-.21,-.18,.29)),'R':Vector((.21,-.18,.29))}
        props['scraper'].location=(0,-.36-.07*breath,z-.04);props['scraper'].rotation_euler.x=math.pi/2;workhide.location=(0,-.38,.60)
    if anim=='shoot':
        draw=[0,.15,.65,1,.1,0][i];bow.location=(-.16,-.49,1.29);quiver.location=(.24,.02,.91)
        hands['L']=bow.location.copy();hands['R']=Vector((.17,-.45+.42*draw,1.29));arrow.location=(0,-.48+.18*draw,1.29);arrow.rotation_euler.x=math.pi/2
        arrow.scale=(1,1,1) if i<4 else (.001,.001,.001)
    if anim=='thrust':
        lance=props['lance'];lance.location=(.14,-.28-.36*hit,.95);lance.rotation_euler.x=math.pi/2
        hands['R']=lance.location.copy();hands['L']=lance.location+Vector((-.10,-.24,0));spine.rotation_euler.x=.16*hit
    if anim=='fish':
        spear=props['spear'];spear.location=(.15,-.24-.20*hit,1.10-.18*hit);spear.rotation_euler.x=.25+2.1*hit
        hands['R']=spear.location.copy();hands['L']=spear.location+spear.rotation_euler.to_matrix()@Vector((-.08,0,-.14));spine.rotation_euler.x=.16*hit
        splash.location=(.15,-.62,0);splash.scale=(1,1,1) if i in [3,4] else (.001,.001,.001)
    if anim=='dance':
        root.location.x=.055*math.sin(p);root.location.y=-.025*(1-math.cos(2*p));spine.rotation_euler.z=.04*math.sin(p)
        for side,off in [('L',0),('R',math.pi)]:
            u=p+off;bpy.data.objects['Foot target.'+side].location=((-1 if side=='L' else 1)*.15,-.035*math.sin(u),.075+.035*max(0,math.sin(u)))
        hands={'L':Vector((-.31,-.07,1+.025*breath)),'R':Vector((.31,-.07,1-.025*breath))}
    if anim=='die':
        u=i/(n-1);root.location.y=-.66*u;root.rotation_euler.z=1.40*u;spine.rotation_euler.x=.18*math.sin(math.pi*u)
        # Fall about the hip; the final body lies sideways with its head above ground.
        root.location.x=.16*u
        for side,x in [('L',-.115),('R',.115)]:bpy.data.objects['Foot target.'+side].location=(x+.45*u,.10*u,.075)
        hands={'L':Vector((-.29+.24*u,-.12,.91-.76*u)),'R':Vector((.29+.22*u,-.08,.91-.76*u))}
    bpy.context.view_layer.update()
    shoulders={s:rig.pose.bones['upper_arm.'+s].head.copy() for s in targets}
    tool={'chop':'axe','build':'maul','strike':'club','thrust':'lance','fish':'spear','scrape':'scraper'}.get(anim)
    if tool:
        centre=(shoulders['L']+shoulders['R'])/2;want=(hands['L']+hands['R'])/2
        delta=want-centre
        if delta.length>.32:want=centre+delta.normalized()*.32
        props[tool].location=want
        axis=props[tool].rotation_euler.to_matrix()@Vector((0,0,.055))
        hands={'L':want-axis,'R':want+axis}
    for side in targets:
        delta=hands[side]-shoulders[side]
        if delta.length>.475:hands[side]=shoulders[side]+delta.normalized()*.475
        targets[side].location=hands[side]
    if anim=='shoot':
        bow.location=hands['L'];pull=hands['R'] if i<4 else bow.location.copy()
        for o,z in zip(strings,[.43,-.43]):
            end=bow.location+Vector((0,0,z));d=pull-end;o.location=(end+pull)/2;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();o.scale.z=d.length
        arrow.location=pull+Vector((0,-.30,0))

animated=[rig]+list(targets.values())+[bpy.data.objects['Foot target.'+s] for s in ['L','R']]+list(props.values())
for anim,spec in manifest['anims'].items():
    if anim=='walk':continue
    for o in animated:
        if o.animation_data:o.animation_data.action=None
    for pb in rig.pose.bones:
        pb.rotation_mode='XYZ';pb.rotation_euler=(0,0,0);pb.location=(0,0,0)
    for side in ['L','R']:rig.pose.bones['forearm.'+side].constraints['AB13 wrist IK'].influence=1
    n=spec['frames']
    for i in range(n+1 if spec['loop'] else n):
        j=i%n;pose(anim,j,n);f=1+i*24/spec['fps']
        for pb in rig.pose.bones:
            pb.keyframe_insert('rotation_euler',frame=f);pb.keyframe_insert('location',frame=f)
        for o in animated:
            if o!=rig:key(o,f)
    registry[anim]={}
    for o in animated:
        if o.animation_data and o.animation_data.action:
            a=o.animation_data.action;a.name=anim if o==rig else anim+':'+o.name;a.use_fake_user=True;registry[anim][o.name]=a.name
for o in animated:
    if o.animation_data:o.animation_data.action=None
for name,action in original.items():bpy.data.objects[name].animation_data.action=action
for side in ['L','R']:rig.pose.bones['forearm.'+side].constraints['AB13 wrist IK'].influence=0
rig['action_registry']=json.dumps(registry);scene.frame_set(1)
for image in bpy.data.images:
    if image.source=='FILE':image.pack()
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'person_man.blend'))
shutil.copy2(SOURCE/'person_man.blend',HERE/'person_man.blend')
shutil.copy2(SOURCE/'person_man.blend',SOURCE/'human_rig.blend')
(HERE/'actions.json').write_text(json.dumps(registry,indent=2))
print('AB13: 15 actions and plain work/combat props saved.')
