"""Editable AB9 models; Blender 5.1 -b -P this file. Units are metres."""
import math
import random
import sys
from pathlib import Path
import bpy
from mathutils import Vector

HERE=Path(__file__).resolve().parent
SOURCE=HERE.parent
sys.path.insert(0,str(SOURCE))
from render import linear
STATES=('stage1','stage2','stage3','finished','winter')

def material(name,color,texture=None):
    m=bpy.data.materials.new(name);m.use_nodes=True
    shader=m.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value=(*linear(color),1)
    shader.inputs['Roughness'].default_value=.94
    shader.inputs['Specular IOR Level'].default_value=.12
    if texture:
        im=m.node_tree.nodes.new('ShaderNodeTexImage')
        im.image=bpy.data.images.load(str(SOURCE/'textures'/texture),check_existing=True)
        mix=m.node_tree.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY'
        mix.inputs[0].default_value=1;mix.inputs[2].default_value=(.72,.72,.68,1)
        m.node_tree.links.new(im.outputs['Color'],mix.inputs[1])
        m.node_tree.links.new(mix.outputs[0],shader.inputs['Base Color'])
    return m

def finish(obj,c,mat,name,smooth=False):
    obj.name=name
    for old in list(obj.users_collection):old.objects.unlink(obj)
    c.objects.link(obj);obj.data.materials.append(mat)
    for p in obj.data.polygons:p.use_smooth=smooth
    return obj

def pole(c,a,b,r=.045,mat=None,name='Peeled pole'):
    a,b=Vector(a),Vector(b);v=b-a
    bpy.ops.mesh.primitive_cone_add(vertices=10,radius1=r,radius2=r*.87,depth=v.length,location=(a+b)/2)
    obj=bpy.context.object;obj.rotation_euler=v.to_track_quat('Z','Y').to_euler()
    return finish(obj,c,mat or wood,name,True)

def box(c,p,scale,mat,name,bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=p)
    obj=bpy.context.object;obj.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=obj.modifiers.new('Soft handworked edges','BEVEL');mod.width=bevel;mod.segments=2
    return finish(obj,c,mat,name)

def mesh(c,verts,faces,mat,name):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    obj=bpy.data.objects.new(name,data);c.objects.link(obj);obj.data.materials.append(mat)
    uv=data.uv_layers.new(name='Paint UV')
    for face in data.polygons:
        for index in face.loop_indices:
            co=data.vertices[data.loops[index].vertex_index].co
            uv.data[index].uv=((co.x+co.z)*.42,co.y*.42+co.z*.25)
    return obj

def cord(c,points,mat=None,r=.013,name='Plain hide lashing'):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=r;curve.bevel_resolution=1
    spline=curve.splines.new('POLY');spline.points.add(len(points)-1)
    for p,co in zip(spline.points,points):p.co=(*co,1)
    obj=bpy.data.objects.new(name,curve);c.objects.link(obj);obj.data.materials.append(mat or rope)
    return obj

def lash(c,p):
    x,y,z=p
    for dz in (-.035,0,.035):
        cord(c,[(x+.067*math.cos(a*math.tau/12),y+.067*math.sin(a*math.tau/12),z+dz) for a in range(13)])

def mound(c,p,scale,mat,name):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=p)
    obj=bpy.context.object;obj.scale=scale
    return finish(obj,c,mat,name,True)

def basket(c,x,y,r=.25):
    bpy.ops.mesh.primitive_cone_add(vertices=20,radius1=r*.7,radius2=r,depth=.32,location=(x,y,.2))
    obj=bpy.context.object
    # An open, dark interior and a rolled lip read even at the game scale.
    finish(obj,c,woven,'Woven gathering basket')
    bpy.ops.mesh.primitive_cylinder_add(vertices=20,radius=r*.88,depth=.014,location=(x,y,.365))
    finish(bpy.context.object,c,dark,'Basket interior')
    for z in (.15,.25,.37):
        rr=r*(.7+.3*(z-.04)/.32)
        cord(c,[(x+rr*math.cos(a*math.tau/24),y+rr*math.sin(a*math.tau/24),z) for a in range(25)],straw,.012,'Basket weave band')

def base(c,state):
    # Exact four metre square ground footprint centred on the manifest anchor.
    mesh(c,[(-2,-2,.006),(2,-2,.006),(2,2,.006),(-2,2,.006)],[(0,1,2,3)],earth,'Cleared four metre footprint')
    if state=='winter':
        for x,y,sx,sy in [(-1.86,0,.12,1.85),(1.86,0,.12,1.85),(0,1.86,1.85,.12),(0,-1.86,1.85,.12)]:
            mound(c,(x,y,.028),(sx,sy,.045),snow,'Snow bank along footprint')
    if state=='stage1':
        for x,y in [(-1.7,-1.7),(-1.7,1.7),(1.7,-1.7),(1.7,1.7)]:pole(c,(x,y,.01),(x,y,.25),.04,name='Layout stake')
        for i in range(4):pole(c,(-1.5+i*.18,-1.2,.07),(-.55+i*.18,.9,.08),.05,name='Loose building poles')

def roll(c,x,y):
    pole(c,(x,y,.13),(x+.5,y,.13),.13,hide,'Rolled spare covers')
    for dx in (.12,.39):lash(c,(x+dx,y,.13))

def gathering(c,state):
    level=STATES.index(state);base(c,state)
    if not level:return
    posts=[(-1.65,-1.55),(-1.65,1.55),(1.65,-1.55),(1.65,1.55)]
    for x,y in posts:
        pole(c,(x,y,.02),(x,y,2.08),.06);lash(c,(x,y,1.94))
    for y in (-1.55,1.55):pole(c,(-1.7,y,2.02),(1.7,y,2.02),.055)
    for x in (-1.65,1.65):pole(c,(x,-1.65,2.03),(x,1.65,2.03),.045)
    if level>=2:
        box(c,(0,0,.035),(3.15,2.95,.04),woven,'Large sorting mat')
        # Two canopy halves retain a broad open edge for visible contents.
        for side in [-1,1] if level>=3 else [-1]:
            xx=side*1.7
            mesh(c,[(0,-1.65,1.94),(xx,-1.65,2.035),(xx,1.65,2.035),(0,1.65,1.94)],[(0,1,2,3)],woven,'Woven shade half')
            if state=='winter':
                mesh(c,[(0,-1.65,1.98),(xx,-1.65,2.075),(xx,1.65,2.075),(0,1.65,1.98)],[(0,1,2,3)],snow,'Snow on shade')
        basket(c,-1.1,-1.05,.29);basket(c,.9,-1.05,.23)
        if level==2:roll(c,.55,.65)
        else:
            basket(c,-1.1,.95,.23)
            mound(c,(.55,-.9,.16),(.3,.24,.16),hide,'Gathering bag')
            cord(c,[(.5,-.9,.33),(.6,-.9,.33),(.62,-.9,.4)],rope,.018,'Bag tie')
            for i in range(14):
                rng=random.Random(42+i)
                mound(c,(rng.uniform(-.4,.25),rng.uniform(-1.2,-.65),.085),(.075,.055,.04),berry if i%3 else straw,'Sorting heap')

def lodge(c,state):
    level=STATES.index(state);base(c,state)
    if not level:return
    # A low arched shelter left of a separate hide-and-meat rack.
    cx=-.53;radius=1.03
    def arc(t,y,zoff=0):return (cx+radius*math.cos(t),y,.2+1.85*math.sin(t)+zoff)
    for y in (-1.35,0,1.35):
        points=[arc(math.pi*i/16,y) for i in range(17)]
        cord(c,points,wood,.045,'Bent lodge frame')
    for i in range(1,8):
        t=math.pi*i/8;pole(c,arc(t,-1.35),arc(t,1.35),.035)
    for y in (-1.35,1.35):
        for i in (2,6):lash(c,arc(math.pi*i/8,y))
    if level>=2:
        # Cover back half first; doorway remains an open warm-brown recess.
        end=8 if level==2 else 16
        for i in range(end):
            a,b=math.pi*i/16,math.pi*(i+1)/16
            mesh(c,[arc(a,-1.35),arc(b,-1.35),arc(b,1.35),arc(a,1.35)],[(0,1,2,3)],hide,'Painted hide cover panel')
            if state=='winter' and 2<=i<=13:
                mesh(c,[arc(a,-1.35,.045),arc(b,-1.35,.045),arc(b,1.35,.045),arc(a,1.35,.045)],[(0,1,2,3)],snow,'Roof snow')
        if level>=3:
            for y in (-1.354,1.354):
                for i in range(16):
                    a,b=math.pi*i/16,math.pi*(i+1)/16
                    # Leave central front door (no black painted rectangle).
                    if y<0 and 5<=i<=10:
                        pts=[arc(a,y),arc(b,y),(arc(b,y)[0],y,1.2),(arc(a,y)[0],y,1.2)]
                    else:pts=[arc(a,y),arc(b,y),(arc(b,y)[0],y,.04),(arc(a,y)[0],y,.04)]
                    mesh(c,pts,[(0,1,2,3)],hide,'Hide end panel')
            for y in (-.9,-.4,.1,.6,1.1):
                cord(c,[arc(math.pi*i/16,y,.012) for i in range(17)],rope,.007,'Plain cover seam')
        else:roll(c,-.4,-1.7)
    # Rack at the right, bows leaning beside the doorway, all inside the footprint.
    for y in (-1.2,1.25):pole(c,(1.35,y,.03),(1.35,y,1.55),.05);lash(c,(1.35,y,1.4))
    pole(c,(1.35,-1.25,1.45),(1.35,1.3,1.45),.05)
    if level>=2:
        mesh(c,[(1.36,.15,1.4),(1.36,1.02,1.4),(1.36,.96,.5),(1.36,.28,.43)],[(0,1,2,3)],hide,'Hide drying on side rack')
        for j in range(4):meat(c,(1.35,-1.05+j*.24,1.4),j,False)
    if level>=3:
        for x in (-1.7,-1.5):
            cord(c,[(x,-1.35,.1),(x-.12,-1.28,.65),(x,-1.15,1.2)],wood,.025,'Plain bow')
            cord(c,[(x,-1.35,.1),(x,-1.15,1.2)],rope,.006,'Bow string')
    if state=='winter':pole(c,(1.35,-1.25,1.51),(1.35,1.3,1.51),.035,snow,'Rack top snow')

def meat(c,p,index,animated):
    x,y,z=p
    # Plain dried strips, warm dark brown; no blood, cuts or gore.
    obj=mesh(c,[(-.07,0,0),(.07,0,0),(.1,.015,-.38),(.04,.02,-.7),(-.055,0,-.66),(-.09,-.01,-.3)],[(0,1,2,3,4,5)],dried,'Hanging dried meat strip')
    obj.location=p
    solid=obj.modifiers.new('Dried strip thickness','SOLIDIFY');solid.thickness=.025
    bevel=obj.modifiers.new('Rounded dry edges','BEVEL');bevel.width=.015;bevel.segments=2
    if animated:
        for frame,phase in [(1,0),(7,math.pi/2),(13,math.pi),(19,math.pi*1.5),(25,math.tau)]:
            obj.rotation_euler[0]=.095*math.sin(phase+index*.4)
            obj.rotation_euler[1]=.04*math.sin(phase+index*.4+.3)
            obj.keyframe_insert(data_path='rotation_euler',frame=frame)
        obj.animation_data.action.name=f'{c.name}_strip_{index:02d}_sway'

def drying(c,state):
    level=STATES.index(state);base(c,state)
    if not level:return
    for row,y in enumerate((-.95,.95)):
        for x in (-1.55,1.55):
            for d in (-.5,.5):pole(c,(x,y+d,.03),(x,y,1.9),.065)
            pole(c,(x,y-.35,.62),(x,y+.35,.62),.04);lash(c,(x,y,1.74))
        pole(c,(-1.7,y,1.8),(1.7,y,1.8),.065)
        if level>=2:
            for j in range(4 if level==2 else 9):
                x=-1.35+j*.32
                meat(c,(x,y,1.74),j+row*9,level>=3)
                cord(c,[(x-.025,y,1.73),(x,y-.025,1.89),(x+.03,y+.03,1.73)],rope,.012)
        if state=='winter':
            pole(c,(-1.7,y,1.87),(1.7,y,1.87),.045,snow,'Snow on drying rail')
            for x in (-1.55,1.55):mound(c,(x,y,1.93),(.1,.12,.045),snow,'Snow on A frame')
    if level==2:roll(c,-.5,-1.7)

def corral(c,state):
    level=STATES.index(state);base(c,state)
    if not level:return
    count=14;rad=1.83
    points=[(rad*math.cos(i*math.tau/count),rad*math.sin(i*math.tau/count)) for i in range(count)]
    for x,y in points:
        pole(c,(x,y,.025),(x,y,1.25),.07)
        if state=='winter':mound(c,(x,y,1.27),(.08,.08,.035),snow,'Snow on post')
    # Open gap gate towards the viewer; construction adds rails in two passes.
    for i,(x,y) in enumerate(points):
        if i in (11,12):continue
        xx,yy=points[(i+1)%count]
        for z in ([.48] if level==1 else [.48,.96]):
            if level==2 and i%2 and z>.6:continue
            pole(c,(x,y,z),(xx,yy,z),.05)
            lash(c,(x,y,z))
            if state=='winter':pole(c,(x,y,z+.055),(xx,yy,z+.055),.028,snow,'Snow on fence rail')
    if level>=2:
        # Hollow wooden trough, with a visible blue-green water surface.
        box(c,(.15,1.13,.17),(1.2,.48,.18),wood,'Trough base',.025)
        for x in (-.45,.75):box(c,(x,1.13,.36),(.08,.55,.38),wood,'Trough end',.02)
        for y in (.88,1.38):box(c,(.15,y,.36),(1.2,.07,.38),wood,'Trough side',.02)
        box(c,(.15,1.13,.42),(1.04,.37,.01),water,'Water in trough')
        if level==2:roll(c,-.6,-1.35)
        else:
            cord(c,[(-.4,-1.77,.35),(-.15,-1.8,.4),(.1,-1.76,.38)],rope,.025,'Loose gate rope')
    if state=='winter':box(c,(.15,1.13,.431),(1.04,.37,.009),ice,'Trough ice')

for suffix,create in [('gathering_spot',gathering),('hunting_lodge',lodge),('drying_rack',drying),('horse_corral',corral)]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    wood=material('AB0 painted pole wood','8C8070','wood_pole.png')
    hide=material('AB0 painted tanned hide','D9BC8C','hide_tanned.png')
    woven=material('Painted woven mat','D9BC8C','mat_woven.png')
    rope=material('Plain dark hide lashings','6B4A2E')
    earth=material('Warm cleared loam','7A5E44')
    dark=material('Warm brown basket interiors','3B2A1E')
    straw=material('Golden fibre','B08A48')
    berry=material('Dark red sorting berries','8E2A30')
    dried=material('Dry meat brown','6B4A2E')
    snow=material('Snow','E8ECEF')
    water=material('Blue green trough water','4F8094')
    ice=material('Thin trough ice','AFC4C4')
    for state in STATES:
        c=bpy.data.collections.new(state);bpy.context.scene.collection.children.link(c)
        create(c,state);c.hide_render=state!='finished';c.hide_viewport=state!='finished'
    scene=bpy.context.scene;scene.render.fps=24;scene.frame_start=1;scene.frame_end=24;scene.frame_set(1)
    for img in bpy.data.images:
        if img.source=='FILE':img.pack()
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/f'building_{suffix}.blend'))
