"""Check all pose/facing and sun-projected shadow bounds without rendering."""
import bpy,sys,runpy,json
from pathlib import Path
HERE=Path(__file__).resolve().parent;SOURCE=HERE.parent;ART=SOURCE.parent
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'person_man.blend'))
originals=set(bpy.data.objects);meshes=set(bpy.data.meshes)
chosen=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
for anim in chosen or json.loads((ART/'manifest.json').read_text())['person_man']['anims']:
    if anim=='walk':continue
    for o in list(bpy.data.objects):
        if o not in originals:bpy.data.objects.remove(o,do_unlink=True)
    for me in list(bpy.data.meshes):
        if me not in meshes and me.users==0:bpy.data.meshes.remove(me)
    for o in originals:o.hide_render=False
    sys.argv=['render_sheet.py','--','person_man',anim,'--preflight']
    try:runpy.run_path(str(HERE/'render_sheet.py'),run_name='__main__')
    except SystemExit as e:
        if e.code:raise
checks=json.loads((HERE/'bounds-checks.json').read_text())
assert all(r['fits'] for r in checks.values()),[(a,r['bounds']) for a,r in checks.items() if not r['fits']]
print('All geometry and projected shadows fit the fixed cells.')
