"""Render independent camera-aligned cells together, then crop losslessly before finishing.

Every sampled mesh is frozen in world space. Ground-plane offsets produce exact cell spacing
under the fixed orthographic projection; lighting, 64 samples and 2x supersampling are unchanged.
"""
import bpy,sys,json,math,tempfile,subprocess,numpy as np
from pathlib import Path
from mathutils import Vector,Matrix
from bpy_extras.object_utils import world_to_camera_view
HERE=Path(__file__).resolve().parent;SOURCE=HERE.parent;ART=SOURCE.parent
sys.path.insert(0,str(SOURCE))
from render import setup,render,CAMERA_ROTATION
FACINGS=dict(zip(['s','sw','w','nw','n','ne','e','se'],[0,-45,-90,-135,180,135,90,45]))
key,*chosen=sys.argv[sys.argv.index('--')+1:]
manifest=json.loads((ART/'manifest.json').read_text())[key]
anims=chosen or [a for a in manifest['anims'] if a!='walk']
# One fresh process per animation bounds memory and keeps approved original meshes untouched.
anim=anims[0];spec=manifest['anims'][anim];n=spec['frames'];scene=bpy.context.scene;rig=bpy.data.objects['Human rig']
registry=json.loads(rig['action_registry'])
for o in scene.objects:
    if o.animation_data:o.animation_data.action=None
for pb in rig.pose.bones:pb.location=(0,0,0);pb.rotation_euler=(0,0,0)
for name,action in registry[anim].items():
    o=bpy.data.objects[name];o.animation_data_create();o.animation_data.action=bpy.data.actions[action]
for side in ['L','R']:rig.pose.bones['forearm.'+side].constraints['AB13 wrist IK'].influence=0 if anim=='walk' else 1
originals=[o for o in scene.objects if o.type=='MESH']
placements=[];objects=[];cloth=[];painted={};bounds=[192.,160.,0.,0.]
right=Vector((2**-.5,2**-.5,0));down=Vector((2**-.5,-2**-.5,0))
up=CAMERA_ROTATION.to_matrix()@Vector((0,1,0))
horizontal=CAMERA_ROTATION.to_matrix()@Vector((-1,0,0));away=Vector((1,-1,0)).normalized()
sun=(horizontal+away*.35).normalized()*.5+Vector((0,0,math.sqrt(3)/2))
screen=np.array([list(right),list(-up)],dtype=np.float32).T
rig.rotation_euler.z=math.radians(45)
for i in range(n):
    groups={}
    frame=1+i*(16/n if anim=='walk' else 24/spec['fps']);scene.frame_set(int(frame),subframe=frame%1);bpy.context.view_layer.update()
    deps=bpy.context.evaluated_depsgraph_get()
    for o in originals:
        if o.get('animations') and anim not in o['animations'].split(','):continue
        ev=o.evaluated_get(deps);me=ev.to_mesh();world=ev.matrix_world
        lo=Vector(tuple(min(v.co[a] for v in me.vertices) for a in range(3)))
        hi=Vector(tuple(max(v.co[a] for v in me.vertices) for a in range(3)))
        coords=[tuple((v.co[a]-lo[a])/max(.000001,hi[a]-lo[a]) for a in range(3)) for v in me.vertices]
        starts={}
        for poly in me.polygons:
            m=o.data.materials[min(poly.material_index,len(o.data.materials)-1)]
            k=(m.name,bool(o.get('cloth_pass')));g=groups.setdefault(k,dict(verts=[],faces=[],coords=[],material=m))
            if k not in starts:
                starts[k]=len(g['verts']);g['verts'].extend(tuple(world@v.co) for v in me.vertices);g['coords'].extend(coords)
            g['faces'].append([starts[k]+vi for vi in poly.vertices])
        ev.to_mesh_clear()
    for (name,iscloth),g in groups.items():
        # Bound every rotation and its sun-projected ground shadow. The eight-pixel
        # guard includes the soft shadow/filter. Empty cell margins are restored later.
        points=np.asarray(g['verts'],dtype=np.float32)
        for angle in FACINGS.values():
            a=math.radians(angle);rot=np.array([[math.cos(a),-math.sin(a),0],[math.sin(a),math.cos(a),0],[0,0,1]],dtype=np.float32)
            q=points@rot.T;shadow=q.copy();shadow[:,:2]-=(q[:,2:3]+.025)*np.array([sun.x/sun.z,sun.y/sun.z]);shadow[:,2]=-.025
            for vertices in [q,shadow]:
                xy=vertices@screen*45.25+np.array([96,128]);lo=xy.min(axis=0);hi=xy.max(axis=0)
                bounds=[min(bounds[0],lo[0]),min(bounds[1],lo[1]),max(bounds[2],hi[0]),max(bounds[3],hi[1])]
        me=bpy.data.meshes.new(f'sheet {i} {name}');me.from_pydata(g['verts'],[],g['faces']);me.update()
        attr=me.attributes.new('GeneratedLocal','FLOAT_VECTOR','POINT');attr.data.foreach_set('vector',[v for xyz in g['coords'] for v in xyz])
        if name not in painted:
            m=g['material'].copy();m.name='Sheet '+name
            for node in list(m.node_tree.nodes):
                if node.type=='TEX_COORD':
                    a=m.node_tree.nodes.new('ShaderNodeAttribute');a.attribute_name='GeneratedLocal'
                    for link in list(m.node_tree.links):
                        if link.from_node==node and link.from_socket.name=='Generated':m.node_tree.links.new(a.outputs['Vector'],link.to_socket)
            painted[name]=m
        me.materials.append(painted[name])
        for p in me.polygons:p.use_smooth=True
        # Linked mesh instances keep the eight rotations identical and avoid duplicating geometry.
        for row,(facing,angle) in enumerate(FACINGS.items()):
            o=bpy.data.objects.new(f'Sheet {i} {name} {facing}',me);scene.collection.objects.link(o)
            o.rotation_euler.z=math.radians(angle);o.location=right*(i*192/45.25)+down*(row*160*2/45.25)
            o['sheet_i']=i;o['sheet_row']=row
            objects.append(o)
            if iscloth:cloth.append(o)
    for row,facing in enumerate(FACINGS):placements.append(dict(anim=anim,facing=facing,frame=i,cell=[i*192,row*160,192,160]))
    print('Frozen',anim,'all facings',i,flush=True)
    del groups
for o in originals:o.hide_render=True
if '--preflight' in chosen:
    report=HERE/'bounds-checks.json';checks=json.loads(report.read_text()) if report.exists() else {}
    checks[anim]=dict(bounds=[float(x) for x in bounds],fits=bool(bounds[0]>=2 and bounds[1]>=2 and bounds[2]<=190 and bounds[3]<=158))
    report.write_text(json.dumps(checks,indent=2));print('BOUNDS',anim,checks[anim],flush=True)
    raise SystemExit(0)
assert bounds[0]>=2 and bounds[1]>=2 and bounds[2]<=190 and bounds[3]<=158,('Geometry/shadow exceeds person cell',anim,bounds)
left=max(0,math.floor(bounds[0])-8);top=max(0,math.floor(bounds[1])-8)
cw=min(192,math.ceil(bounds[2])+8)-left;ch=min(160,math.ceil(bounds[3])+8)-top
for o in objects:o.location=right*(o['sheet_i']*cw/45.25)+down*(o['sheet_row']*ch*2/45.25)
placements=[dict(anim=anim,facing=facing,frame=i,cell=[i*cw,row*ch,cw,ch],offset=[left,top]) for row,facing in enumerate(FACINGS) for i in range(n)]
W,H=cw*n,ch*8
ground=setup(scene,dict(cell=[W,H],anchor=[(96-left)/W,(128-top)/H]));scene.camera.data.sensor_fit='HORIZONTAL'
# The whole sheet extends further along the ground than a single 20m-away camera.
# Move only along its view axis: projection, scale and lighting remain identical.
scene.camera.location=CAMERA_ROTATION.to_matrix()@Vector((0,0,200))
bpy.context.view_layer.update()
anchors=[]
for row in range(8):
    for col in range(n):
        off=right*(col*cw/45.25)+down*(row*ch*2/45.25)
        q=world_to_camera_view(scene,scene.camera,off);xy=[q.x*W,(1-q.y)*H]
        expected=[96-left+cw*col,128-top+ch*row]
        assert max(abs(a-b) for a,b in zip(xy,expected))<.01,(xy,expected)
        padded=[xy[0]-col*cw+left,xy[1]-row*ch+top]
        assert max(abs(a-b) for a,b in zip(padded,[96,128]))<.01
        anchors.append(dict(cell=[col,row],anchor=xy,padded_anchor=padded))
hold=bpy.data.materials.new('Sheet holdout');hold.use_nodes=True;nodes=hold.node_tree.nodes;nodes.clear();shader=nodes.new('ShaderNodeHoldout');end=nodes.new('ShaderNodeOutputMaterial');hold.node_tree.links.new(shader.outputs[0],end.inputs['Surface'])
raw=HERE/'raw'/anim;raw.mkdir(parents=True,exist_ok=True)
for o in objects:o.hide_render=True
render(scene,raw/'empty.png')
for o in objects:o.hide_render=False
ground.hide_render=True;render(scene,raw/'base.png')
ground.hide_render=False;render(scene,raw/'shadow.png')
ground.hide_render=True
for o in objects:
    if o not in cloth:o.data.materials.clear();o.data.materials.append(hold)
render(scene,raw/'cloth.png')
(raw/'placements.json').write_text(json.dumps(placements,indent=2))
(raw/'camera-checks.json').write_text(json.dumps(anchors,indent=2))
subprocess.run(['python',str(HERE/'split_sheet.py'),anim],check=True)
