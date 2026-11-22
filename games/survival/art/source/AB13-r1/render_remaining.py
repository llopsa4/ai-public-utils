"""Render several actions in one Blender process to reuse compiled EEVEE shaders."""
import bpy,sys,runpy
from pathlib import Path
HERE=Path(__file__).resolve().parent;SOURCE=HERE.parent
anims=sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'person_man.blend'))
originals=set(bpy.data.objects);original_meshes=set(bpy.data.meshes)
for anim in anims:
    for o in list(bpy.data.objects):
        if o not in originals:bpy.data.objects.remove(o,do_unlink=True)
    for mesh in list(bpy.data.meshes):
        if mesh not in original_meshes and mesh.users==0:bpy.data.meshes.remove(mesh)
    for o in originals:o.hide_render=False
    sys.argv=['render_sheet.py','--','person_man',anim]
    runpy.run_path(str(HERE/'render_sheet.py'),run_name='__main__')
    print('COMPLETED ACTION '+anim,flush=True)
