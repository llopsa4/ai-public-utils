"""AB8 editable Blender models. Run with Blender 5.1 -b -P this file.

Each state owns its geometry; barricade states contain mask_0 ... mask_15.
Axes match the fixed AB0 camera: tile +x is model +X, tile +y is model -Y.
"""
import math
import random
import sys
from pathlib import Path
import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent
sys.path.insert(0, str(SOURCE))
from render import linear

STATES = ('stage1', 'stage2', 'stage3', 'finished', 'winter')

def material(name, color, texture=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*linear(color), 1)
    shader.inputs['Roughness'].default_value = 0.94
    shader.inputs['Specular IOR Level'].default_value = 0.12
    if texture:
        image = mat.node_tree.nodes.new('ShaderNodeTexImage')
        image.image = bpy.data.images.load(str(SOURCE / 'textures' / texture), check_existing=True)
        mix = mat.node_tree.nodes.new('ShaderNodeMixRGB')
        mix.blend_type = 'MULTIPLY'
        mix.inputs[0].default_value = 1
        mix.inputs[2].default_value = (0.72, 0.72, 0.68, 1)
        mat.node_tree.links.new(image.outputs['Color'], mix.inputs[1])
        mat.node_tree.links.new(mix.outputs[0], shader.inputs['Base Color'])
    return mat

def finish(obj, c, mat, name, smooth=True):
    obj.name = name
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    c.objects.link(obj)
    obj.data.materials.append(mat)
    for face in obj.data.polygons:
        face.use_smooth = smooth
    return obj

def pole(c, a, b, radius=.045, mat=None, name='Peeled pole', pointed=False):
    a, b = Vector(a), Vector(b)
    axis = b-a
    tip = axis.normalized() * .19 if pointed else Vector((0,0,0))
    shaft_end = b-tip
    bpy.ops.mesh.primitive_cone_add(vertices=9, radius1=radius, radius2=radius*.85,
                                   depth=(shaft_end-a).length, location=(a+shaft_end)/2)
    obj=bpy.context.object
    obj.rotation_euler=axis.to_track_quat('Z','Y').to_euler()
    finish(obj,c,mat or wood,name)
    if pointed:
        bpy.ops.mesh.primitive_cone_add(vertices=9, radius1=radius*.85, radius2=0,
                                      depth=tip.length,location=(shaft_end+b)/2)
        obj=bpy.context.object
        obj.rotation_euler=axis.to_track_quat('Z','Y').to_euler()
        finish(obj,c,tipwood,'Whittled stake tip')

def ellipsoid(c, p, scale, mat, name, seed=0):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=6, location=p)
    obj=bpy.context.object
    rng=random.Random(seed)
    for vert in obj.data.vertices:
        vert.co *= 1+rng.uniform(-.1,.1)
    obj.scale=scale
    return finish(obj,c,mat,name)

def box(c, p, scale, mat, name):
    bpy.ops.mesh.primitive_cube_add(size=1,location=p)
    obj=bpy.context.object
    obj.scale=scale
    return finish(obj,c,mat,name,False)

def lash(c,p,direction):
    # Three plain rope turns around each stake, no decoration.
    for dz in (-.035,0,.035):
        bpy.ops.mesh.primitive_torus_add(major_radius=.061,minor_radius=.012,
                                        major_segments=12,minor_segments=4,
                                        location=(p[0],p[1],p[2]+dz))
        obj=bpy.context.object
        obj.rotation_euler=Vector(direction).to_track_quat('Z','Y').to_euler()
        finish(obj,c,rope,'Hide lashing')

def trap(c,state):
    level=STATES.index(state)
    # Recess represented by dark earth within a low physical rim; no black void.
    box(c,(0,0,.012),(1.48,1.48,.025),earth,'Excavated square pit')
    for x in (-.76,.76):
        pole(c,(x,-.78,.03),(x,.78,.03),.055,soil,'Pit rim')
    for y in (-.76,.76):
        pole(c,(-.78,y,.03),(.78,y,.03),.055,soil,'Pit rim')
    for x,y in ((-.76,.76),(.76,-.76)):
        pole(c,(x,y,.02),(x,y,.45 if level==0 else .76),.043,pointed=True,name='Marker stake')
    count=(1,3,5,6,6)[level]
    for i in range(count):
        t=-.65+i*.26
        pole(c,(-.76,t,.07),(.76,t+.035,.07),.025,name='Crossed cover stick')
        if level>0:
            pole(c,(t,-.76,.11),(t+.025,.76,.11),.024,name='Crossed cover stick')
    if level>=2:
        rng=random.Random(4)
        for i in range(48 if level==2 else 105):
            x,y=rng.uniform(-.7,.7),rng.uniform(-.7,.7)
            pole(c,(x,y,.14),(x+rng.uniform(-.22,.22),y+rng.uniform(-.25,.25),.16),.009,
                 grass if i%3 else straw,'Grass camouflage')
    if state=='winter':
        for i in range(12):
            x=-.62+(i%4)*.4;y=-.6+(i//4)*.6
            ellipsoid(c,(x,y,.17),(.24,.18,.035),snow,'Snow on cover',i)
        for x,y in ((-.76,.76),(.76,-.76)):
            ellipsoid(c,(x,y,.77),(.06,.06,.025),snow,'Snow on marker')

def fire_pit(c,state):
    level=STATES.index(state)
    ellipsoid(c,(0,0,.006),(.75,.75,.025),earth,'Cleared hearth')
    for i in range((3,7,10,12,12)[level]):
        a=i*math.tau/12
        x,y=.67*math.cos(a),.67*math.sin(a)
        ellipsoid(c,(x,y,.13),(.19,.14,.15),stone,'Hearth stone',i+20)
        if state=='winter':
            ellipsoid(c,(x,y,.26),(.17,.13,.035),snow,'Stone snow cap',i)
    if level>=2:
        for i in range(2 if level==2 else 3):
            y=(i-1)*.22
            pole(c,(-.42,y,.08),(.42,y+.16,.12),.075,char,'Charred hearth log')
        pole(c,(-.24,-.34,.17),(.24,.34,.24),.06,char,'Crossed charred log')
    if state=='winter':
        for i in range(7):
            a=i*math.tau/7
            ellipsoid(c,(.82*math.cos(a),.82*math.sin(a),.016),(.18,.12,.028),snow,'Banked snow',i)

EDGES = ((1,(0,1)),(2,(1,0)),(4,(0,-1)),(8,(-1,0)))
def barricade(c,state,mask):
    level=STATES.index(state)
    arms=[v for bit,v in EDGES if mask&bit]
    # Ground poles reach exactly to the tile edge centres; tips never protrude into a neighbour.
    for dx,dy in arms:
        pole(c,(0,0,.09),(dx,dy,.09),.052,name='Joining ground pole')
    if not arms:
        pole(c,(-.57,0,.09),(.57,0,.09),.052,name='Lone ground pole')
    sites=[(0,0,1,0)]
    for dx,dy in arms:
        for distance in (.31,.64,.91):
            sites.append((dx*distance,dy*distance,dx,dy))
    if not arms:
        sites=[(-.45,0,1,0),(0,0,1,0),(.45,0,1,0)]
    for i,(x,y,dx,dy) in enumerate(sites):
        outward=Vector((-dy,dx,0))
        height=(.18,.60,.91,1.13,1.13)[level]
        if level==1 and i%2: height=.26
        if level==2 and i%3==1: height=.58
        # Preserve the exact same completed silhouette between summer and winter.
        end=Vector((x,y,height))+outward*(.26 if level>=2 else .08)
        pole(c,(x,y,.018),end,.057,pointed=height>.3,name='Outward angled stake')
        if level>=2:
            lash(c,(x,y,.18),end-Vector((x,y,0)))
        if state=='winter':
            ellipsoid(c,(x,y,.035),(.12,.12,.038),snow,'Snow bank at stake',i)
    if state=='winter':
        for dx,dy in arms:
            pole(c,(0,0,.14),(dx,dy,.14),.035,snow,'Snow on joining pole')

for key,create in (('building_trap',trap),('building_fire_pit',fire_pit),('building_barricade',barricade)):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    wood=material('AB0 painted pole wood','8C8070','wood_pole.png')
    stone=material('Painted field stone','8F877A','stone_painted.png')
    tipwood=material('Whittled light wood','B0A28E')
    rope=material('Plain hide cord','6B4A2E')
    earth=material('Dark brown pit and hearth','4A3828')
    soil=material('Loam rim','7A5E44')
    grass=material('Dried green camouflage','8F9B4E')
    straw=material('Golden prairie stems','B08A48')
    char=material('Charred wood brown','3E2A1A')
    snow=material('Snow','E8ECEF')
    for state in STATES:
        c=bpy.data.collections.new(state);bpy.context.scene.collection.children.link(c)
        if key=='building_barricade':
            for mask in range(16):
                sub=bpy.data.collections.new(f'{state}_mask_{mask}');c.children.link(sub)
                create(sub,state,mask)
                sub.hide_render=mask!=0;sub.hide_viewport=mask!=0
        else: create(c,state)
        c.hide_render=state!='finished';c.hide_viewport=state!='finished'
    for img in bpy.data.images:
        if img.source=='FILE': img.pack()
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/f'{key}.blend'))
