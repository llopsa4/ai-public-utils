"""AB11 editable eight-metre plaza/store models. Blender 5.1, metres."""
import math
import random
from pathlib import Path
import bpy
HERE=Path(__file__).resolve().parent
SOURCE=HERE.parent
helper=(SOURCE/'AB9-r1/build.py').read_text().split('\nfor suffix,create in ')[0]
exec(compile(helper,str(SOURCE/'AB9-r1/build.py'),'exec'))
HERE=Path(__file__).resolve().parent
SOURCE=HERE.parent

def footprint(c,state):
    mesh(c,[(-4,-4,.006),(4,-4,.006),(4,4,.006),(-4,4,.006)],[(0,1,2,3)],earth,'Cleared eight metre footprint')
    if state=='winter':
        for x,y,sx,sy in [(-3.82,0,.16,3.8),(3.82,0,.16,3.8),(0,3.82,3.8,.16),(0,-3.82,3.8,.16)]:
            mound(c,(x,y,.025),(sx,sy,.045),snow,'Snow bank')

def plaza(c,state):
    footprint(c,state)
    # Low radial polygon breaks up the square footprint into a circular meeting area.
    verts=[(0,0,.014)]+[(3.85*math.cos(i*math.tau/64),3.85*math.sin(i*math.tau/64),.014) for i in range(64)]
    mesh(c,verts,[(0,i+1,(i+1)%64+1) for i in range(64)],beaten,'Beaten earth circle')
    # Hearth centred exactly on runtime flame origin; no painted fire in this model.
    mound(c,(0,0,.02),(.78,.78,.04),char,'Hearth ash')
    for i in range(12):
        a=i*math.tau/12;r=.99
        o=mound(c,(r*math.cos(a),r*math.sin(a),.12),(.24,.19,.16),stone,'Hearth stone %02d'%i)
        o.rotation_euler[2]=a+.2
        if state=='winter':mound(c,(r*math.cos(a),r*math.sin(a),.245),(.17,.13,.04),snow,'Snow on hearth stone')
    for a,b in [((-.55,-.17,.06),(.5,.23,.06)),((-.3,.45,.07),(.4,-.43,.07))]:pole(c,a,b,.085,char,'Charred hearth log')
    # Four hide mats with subtly irregular edges, no painted pattern or symbol.
    for i,(x,y) in enumerate([(-2.35,0),(2.35,0),(0,-2.65),(0,2.65)]):
        rng=random.Random(i+20)
        pts=[(x+dx+rng.uniform(-.1,.1),y+dy+rng.uniform(-.08,.08),.035) for dx,dy in [(-.75,-.65),(.75,-.65),(.8,.6),(-.7,.65)]]
        mesh(c,pts,[(0,1,2,3)],hide,'Plain hide mat')
        if state=='winter':
            mesh(c,[(xx,yy,.055) for xx,yy,_ in pts[:2]]+[(pts[1][0],pts[1][1]+.18,.055),(pts[0][0],pts[0][1]+.18,.055)],[(0,1,2,3)],snow,'Snow at mat edge')
    for x,y in [(-2.1,-2.05),(2.1,2.05)]:
        for dx in (-.65,.65):pole(c,(x+dx,y-.25,.12),(x+dx,y+.25,.12),.12,wood,'Log seat foot')
        pole(c,(x-.95,y,.32),(x+.95,y,.32),.21,wood,'Low log seat')
        if state=='winter':pole(c,(x-.9,y,.51),(x+.9,y,.51),.09,snow,'Snow on log seat')
    for x in (-2.85,2.85):
        for y in (1.3,3.25):pole(c,(x,y,.04),(x,y,1.7),.06);lash(c,(x,y,1.55))
        pole(c,(x,1.18,1.61),(x,3.38,1.61),.06)
        for j in range(6):meat(c,(x,1.42+j*.3,1.56),j,False)
        if state=='winter':pole(c,(x,1.18,1.68),(x,3.38,1.68),.04,snow,'Snow on drying pole')
    for x,y in [(-3.15,-.7),(2.9,-1.4),(-.8,3.1)]:basket(c,x,y,.27)
    # Plain everyday hand drum, no symbols, on the near mat.
    x,y=.05,-2.7
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.31,depth=.13,location=(x,y,.13))
    finish(bpy.context.object,c,wood,'Plain hand drum rim')
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.3,depth=.012,location=(x,y,.203))
    finish(bpy.context.object,c,hide,'Plain unpainted drum skin')
    for j in range(12):
        a=j*math.tau/12;b=(j+.5)*math.tau/12
        cord(c,[(x+.31*math.cos(a),y+.31*math.sin(a),.19),(x+.31*math.cos(b),y+.31*math.sin(b),.07)],rope,.008,'Drum binding')

def storehouse(c,state,cutaway=False):
    level=STATES.index(state);footprint(c,state)
    if level==0:
        for x in (-3.55,3.55):
            for y in (-2.8,2.8):pole(c,(x,y,.02),(x,y,.3),.06,name='Layout stake')
        for j in range(6):pole(c,(-2.5+j*.23,-1.2,.09),(-1.6+j*.23,1.5,.09),.065,name='Loose store frame poles')
        return
    # Keep the open floor flat at runtime item z=0. Items fill a 200x100 display diamond.
    # Two front doorways remain at x=-1.8/+1.8; cutaway removes all overhead members.
    xs=[-3.55,-2.4,-1.2,0,1.2,2.4,3.55]
    for y in (-2.8,2.8):
        for x in xs:
            h=.43 if cutaway and y<0 else (1.15 if cutaway else 1.8)
            pole(c,(x,y,.02),(x,y,h),.07,name='Store upright')
            lash(c,(x,y,h-.12))
        pole(c,(-3.6,y,.4),(3.6,y,.4),.055,name='Low wall rail')
        if not cutaway:pole(c,(-3.65,y,1.72),(3.65,y,1.72),.065,name='Eaves rail')
    for x in (-3.55,3.55):
        pole(c,(x,-2.85,.4),(x,2.85,.4),.055,name='Side wall rail')
        if not cutaway:pole(c,(x,-2.85,1.72),(x,2.85,1.72),.06,name='Side eaves')
    if not cutaway:
        pole(c,(-3.7,0,2.4),(3.7,0,2.4),.075,name='Store ridge pole')
        for x in xs:
            for side in (-1,1):pole(c,(x,0,2.4),(x,side*2.98,1.69),.055,name='Roof rafter')
            lash(c,(x,0,2.4))
    if level<2:return
    # Bark slabs in overlapping horizontal courses; front has two full door gaps.
    for side in (-1,1):
        y=side*2.83
        rows=1 if cutaway and side<0 else (2 if cutaway else 4)
        for row in range(rows):
            for j in range(14):
                x=-3.3+j*.5
                if side<0 and (abs(x+1.8)<.48 or abs(x-1.8)<.48):continue
                if level==2 and j>6:continue
                z=.08+row*.4
                mesh(c,[(x-.26,y-.018,z),(x+.27,y-.018,z+.025),(x+.27,y,.57+row*.4),(x-.26,y,.55+row*.4)],[(0,1,2,3)],bark,'Overlapping bark wall slab')
    for x in (-3.57,3.57):
        for row in range(2 if cutaway else 4):
            for j in range(11):
                if level==2 and j>5:continue
                y=-2.55+j*.5;z=.08+row*.4
                mesh(c,[(x,y-.26,z),(x,y+.27,z+.02),(x,y+.27,.57+row*.4),(x,y-.26,.55+row*.4)],[(0,1,2,3)],bark,'Side bark slab')
    if not cutaway:
        # Whole hide panels, separate roof collection by object name for cutaway checks.
        for side in (-1,1):
            for j in range(6):
                if level==2 and side>0:continue
                a=-3.7+j*7.4/6;b=a+7.4/6+.03
                verts=[(a,0,2.42),(b,0,2.42),(b,side*3.02,1.7),(a,side*3.02,1.7)]
                mesh(c,verts,[(0,1,2,3)],hide,'Hide roof panel')
                cord(c,[(a,0,2.44),(a,side*3.02,1.72)],rope,.009,'Plain roof seam')
                if state=='winter':mesh(c,[(x,y,z+.055) for x,y,z in verts],[(0,1,2,3)],snow,'Snow on hide roof')
        if level==2:roll(c,-.5,-3.3)
        else:
            for x in (-2.95,.45,2.95):
                # Small fixed supplies outside the usable floor, under the eaves.
                mound(c,(x,-3.1,.18),(.33,.25,.17),hide,'Tied eaves bundle')
                cord(c,[(x-.27,-3.1,.18),(x,-3.1,.36),(x+.27,-3.1,.18)],rope,.016,'Bundle tie')
            for x in (-.45,3.3):basket(c,x,-3.15,.23)
    if state=='winter':
        for y in (-2.86,2.86):pole(c,(-3.55,y,.42),(3.55,y,.42),.035,snow,'Low wall snow')

for key,kind in [('fire_central','fire'),('building_store','store'),('building_store_open','open')]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    wood=material('AB0 painted pole wood','8C8070','wood_pole.png')
    hide=material('AB0 painted tanned hide','D9BC8C','hide_tanned.png')
    woven=material('AB9 painted woven mat','D9BC8C','mat_woven.png')
    bark=material('Painted grey brown bark','6E6254')
    shader=bark.node_tree.nodes.get('Principled BSDF')
    tex=bark.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(HERE/'bark.png'))
    bark.node_tree.links.new(tex.outputs['Color'],shader.inputs['Base Color'])
    rope=material('Plain hide bindings','6B4A2E')
    earth=material('Warm cleared loam','7A5E44')
    beaten=material('Beaten earth','8A6A4D')
    dark=material('Warm basket interior','3B2A1E')
    straw=material('Woven golden fibre','B08A48')
    dried=material('Brown dried meat','6B4A2E')
    stone=material('Grey hearth stones','8F877A')
    char=material('Ash and charred wood','4E463C')
    snow=material('Snow','E8ECEF')
    states=['finished','winter'] if kind=='fire' else (['finished'] if kind=='open' else STATES)
    for state in states:
        c=bpy.data.collections.new(state);bpy.context.scene.collection.children.link(c)
        if kind=='fire':plaza(c,state)
        else:storehouse(c,state,kind=='open')
        c.hide_render=state!='finished';c.hide_viewport=state!='finished'
    for img in bpy.data.images:
        if img.source=='FILE':img.pack()
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/f'{key}.blend'))
