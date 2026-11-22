"""Five editable society lodges, metres, Blender 5.1. Reuses AB9 geometry helpers."""
import math
import sys
from pathlib import Path
import bpy
HERE=Path(__file__).resolve().parent
SOURCE=HERE.parent
# Load only definitions, never AB9's model-writing loop. Retain AB10 paths.
helper=(SOURCE/'AB9-r1/build.py').read_text().split('\nfor suffix,create in ')[0]
exec(compile(helper,str(SOURCE/'AB9-r1/build.py'),'exec'))
HERE=Path(__file__).resolve().parent
SOURCE=HERE.parent
KINDS=('healers_lodge','scouts_lodge','lancers_lodge','archers_lodge','spirit_lodge')

def dome(c,state):
    level=STATES.index(state)
    # Rounded bent-pole dome, split into ten ribs; open door on the camera-facing side.
    r=1.57;h=2.02
    def point(a,t,lift=0):return (r*math.sin(t)*math.cos(a),r*math.sin(t)*math.sin(a),.09+h*math.cos(t)+lift)
    for j in range(12):
        a=math.tau*j/12
        cord(c,[point(a,math.pi*i/24) for i in range(13)],wood,.042,'Bent dome rib')
    for z in (.48,1.0,1.55):
        t=math.acos((z-.09)/h)
        start,end=(-math.pi/3,4*math.pi/3) if z<1.3 else (0,math.tau)
        cord(c,[point(start+(end-start)*i/48,t) for i in range(49)],wood,.028,'Dome cross lashing')
    if level<2:return
    for j in range(24):
        a,b=math.tau*j/24,math.tau*(j+1)/24
        if level==2 and j>=12:continue
        for k in range(8):
            if j in (16,17,18,19) and k>=4:continue
            t,u=k*math.pi/16,(k+1)*math.pi/16
            mat=woven if k>=6 else hide
            mesh(c,[point(a,t),point(b,t),point(b,u),point(a,u)],[(0,1,2,3)],mat,'Dome hide panel' if k<6 else 'Woven lower wall')
            if state=='winter' and k<6:
                mesh(c,[point(a,t,.045),point(b,t,.045),point(b,u,.045),point(a,u,.045)],[(0,1,2,3)],snow,'Snow on dome')
    for x in (-.65,.65):pole(c,(x,-1.42,.03),(x,-1.42,1.33),.055)
    pole(c,(-.71,-1.42,1.32),(.71,-1.42,1.32),.06)
    if level==2:roll(c,-1.3,-1.7)

def shelter(c,state,pale=False):
    level=STATES.index(state);cx=-.42;r=1.12;h=2.0
    def arc(t,y,dz=0):return (cx+r*math.cos(t),y,.1+h*math.sin(t)+dz)
    for y in (-1.28,0,1.28):
        cord(c,[arc(math.pi*i/20,y) for i in range(21)],wood,.048,'Bent shelter rib')
    for i in range(1,10):pole(c,arc(math.pi*i/10,-1.3),arc(math.pi*i/10,1.3),.03)
    for y in (-1.28,1.28):
        for i in (2,8):lash(c,arc(math.pi*i/10,y))
    if level<2:return
    mat=bleached if pale else hide
    for i in range(20 if level>=3 else 10):
        a,b=math.pi*i/20,math.pi*(i+1)/20
        mesh(c,[arc(a,-1.3),arc(b,-1.3),arc(b,1.3),arc(a,1.3)],[(0,1,2,3)],mat,'Plain hide roof')
        if state=='winter' and 3<=i<=16:
            mesh(c,[arc(a,-1.3,.045),arc(b,-1.3,.045),arc(b,1.3,.045),arc(a,1.3,.045)],[(0,1,2,3)],snow,'Snow on hide roof')
    if level==2:roll(c,.7,-1.6);return
    for y in (-1.305,1.305):
        for i in range(20):
            a,b=math.pi*i/20,math.pi*(i+1)/20
            low=1.22 if y<0 and 6<=i<=13 else .04
            mesh(c,[arc(a,y),arc(b,y),(arc(b,y)[0],y,low),(arc(a,y)[0],y,low)],[(0,1,2,3)],mat,'Plain end wall with open door')
    for y in (-.85,-.25,.35,.95):
        cord(c,[arc(math.pi*i/20,y,.012) for i in range(21)],rope,.009,'Cover stitch seam')
    # Warm interior back wall remains physically inside the open shelter.
    box(c,(cx,.92,.65),(1.55,.015,1.2),dark,'Warm brown doorway recess')
    if pale:
        # Light the existing earth floor rather than drawing an opaque blue disc.
        light=bpy.data.lights.new('Faint doorway bounce','POINT');light.energy=15;light.color=linear('BFE3F2');light.shadow_soft_size=.5
        obj=bpy.data.objects.new(light.name,light);c.objects.link(obj);obj.location=(cx,-.75,.6)

def herb_bunch(c,x,y,z,index):
    for j in range(7):
        dx=(j-3)*.033;end=(x+dx*1.7,y+.02*math.sin(j),z-.48-.035*(j%3))
        pole(c,(x+dx*.3,y,z),end,.011,straw,'Dried plant stem')
        for k in range(3):
            t=.45+k*.16
            xx=x+dx*1.7*t;zz=z+(end[2]-z)*t
            ob=mound(c,(xx+(.04 if k%2 else -.04),y-.012,zz),(.065,.016,.029),herbs,'Plain dried leaf')
            ob.rotation_euler[1]=(-1 if k%2 else 1)*.55
    cord(c,[(x-.06,y,z-.1),(x+.06,y,z-.1)],rope,.015,'Herb bundle tie')

def props(c,state,kind):
    level=STATES.index(state)
    if kind=='healers_lodge':
        if level>=2:
            for i,x in enumerate((-.87,.87)):herb_bunch(c,x,-1.47,1.45,i)
            if level>=3:basket(c,1.35,-.95,.28)
        return
    if kind=='scouts_lodge':
        pole(c,(1.42,.25,.02),(1.42,.25,3.8),.065,name='Plain lookout pole')
        for d in (-1,1):pole(c,(1.42+d*.33,.25,.02),(1.42,.25,1.05),.04)
        for z in (.3,.7,1.1):lash(c,(1.42,.25,z))
        if level>=2:
            mesh(c,[(1.42,.25,3.65),(2.0,.25,3.55),(1.93,.25,3.32),(1.42,.25,3.36)],[(0,1,2,3)],pennant,'Small plain cloth pennant')
        if state=='winter':mound(c,(1.42,.25,3.81),(.08,.08,.03),snow,'Snow on lookout pole')
        return
    if kind in ('lancers_lodge','archers_lodge'):
        y=-.35
        for yy in (-1.1,.85):pole(c,(1.34,yy,.02),(1.34,yy,1.37),.055);lash(c,(1.34,yy,1.15))
        for z in (.35,1.15):pole(c,(1.34,-1.18,z),(1.34,.92,z),.048)
        if state=='winter':pole(c,(1.34,-1.18,1.21),(1.34,.92,1.21),.032,snow,'Rack snow')
        if level<2:return
        if kind=='lancers_lodge':
            for yy in (-.8,-.1,.6):
                pole(c,(1.38,yy,.06),(1.38,yy,2.35),.026,name='Plain lance shaft')
                mesh(c,[(1.38,yy-.11,2.25),(1.38,yy,2.65),(1.38,yy+.11,2.25),(1.44,yy,2.28)],[(0,1,3),(1,2,3),(2,0,3),(0,2,1)],stone,'Plain stone lance point')
                lash(c,(1.38,yy,2.2))
        else:
            for yy in (-.8,.55):
                cord(c,[(1.4,yy,.12),(1.55,yy,.62),(1.5,yy,1.05),(1.4,yy,1.6)],wood,.026,'Plain self bow')
                cord(c,[(1.4,yy,.12),(1.4,yy,1.6)],rope,.007,'Bow string')
            # Target in a front-facing Y plane; bound straw, never a painted bullseye.
            for x in (.55,1.55):pole(c,(x,-1.65,.03),(x,-1.53,1.4),.045)
            pole(c,(.5,-1.53,.4),(1.6,-1.53,.4),.05)
            center=(1.05,-1.57,.96);rad=.48
            for ring in range(1,12):
                rr=rad*ring/12
                cord(c,[(center[0]+rr*math.cos(j*math.tau/40),center[1],center[2]+rr*math.sin(j*math.tau/40)) for j in range(41)],straw,.028,'Bound straw target coil')
            for j in range(16):
                a=math.tau*j/16
                pole(c,center,(center[0]+rad*math.cos(a),center[1]+.012,center[2]+rad*math.sin(a)),.01,straw,'Straw target fibres')
            if state=='winter':mound(c,(1.05,-1.57,1.44),(.3,.1,.045),snow,'Snow on target top')

chosen=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
for kind in KINDS:
    if chosen and kind not in chosen:continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    wood=material('AB0 painted pole wood','8C8070','wood_pole.png')
    hide=material('AB0 painted tanned hide','D9BC8C','hide_tanned.png')
    woven=material('AB9 painted woven mat','D9BC8C','mat_woven.png')
    bleached=hide.copy();bleached.name='Pale bleached painted hide'
    tree=bleached.node_tree;tex=next(n for n in tree.nodes if n.type=='TEX_IMAGE');mix=next(n for n in tree.nodes if n.type=='MIX_RGB')
    hsv=tree.nodes.new('ShaderNodeHueSaturation');hsv.inputs['Saturation'].default_value=.18;hsv.inputs['Value'].default_value=1.48
    tree.links.new(tex.outputs['Color'],hsv.inputs['Color']);tree.links.new(hsv.outputs['Color'],mix.inputs[1]);mix.inputs[2].default_value=(.94,.96,1,1)
    rope=material('Plain hide lashings','6B4A2E');earth=material('Warm cleared loam','7A5E44')
    dark=material('Warm brown interiors','3B2A1E');straw=material('Bound straw','B08A48')
    snow=material('Snow','E8ECEF');herbs=material('Dried plain leaves','7E7847')
    stone=material('Stone lance heads','8F877A');pennant=material('Plain ochre cloth','B08A48')
    for state in STATES:
        c=bpy.data.collections.new(state);bpy.context.scene.collection.children.link(c)
        base(c,state)
        if state!='stage1':
            if kind=='healers_lodge':dome(c,state)
            else:shelter(c,state,kind=='spirit_lodge')
            props(c,state,kind)
        c.hide_render=state!='finished';c.hide_viewport=state!='finished'
    scene=bpy.context.scene;scene.render.fps=24;scene.frame_start=1;scene.frame_end=1
    for im in bpy.data.images:
        if im.source=='FILE':im.pack()
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/f'building_{kind}.blend'))
