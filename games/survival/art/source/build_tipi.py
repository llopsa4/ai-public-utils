"""Build the editable AB0 tipi source with Blender 5.1."""
import math
import random
from pathlib import Path

import bpy
from mathutils import Vector

SOURCE = Path(__file__).resolve().parent
rng = random.Random(12)
TAU = math.tau
DOOR = -math.pi / 4


def material(name, rgb, image=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    shader = nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*rgb, 1)
    shader.inputs["Roughness"].default_value = 0.88
    shader.inputs["Specular IOR Level"].default_value = 0.15
    if image:
        paint = nodes.new("ShaderNodeTexImage")
        paint.image = bpy.data.images.load(str(SOURCE / "textures" / image), check_existing=True)
        uv = nodes.new("ShaderNodeUVMap")
        mat.node_tree.links.new(uv.outputs["UV"], paint.inputs["Vector"])
        mix = nodes.new("ShaderNodeMixRGB")
        mix.blend_type = "MULTIPLY"
        mix.inputs[0].default_value = 1
        mix.inputs[2].default_value = (*rgb, 1)
        mat.node_tree.links.new(paint.outputs["Color"], mix.inputs[1])
        mat.node_tree.links.new(mix.outputs[0], shader.inputs["Base Color"])
    return mat


def finish(obj, collection, mat, name):
    obj.name = name
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    collection.objects.link(obj)
    obj.data.materials.append(mat)
    for face in obj.data.polygons:
        face.use_smooth = True
    return obj


def pole(c, a, b, radius=0.045, mat=None, name="Peeled pole"):
    a, b = Vector(a), Vector(b)
    v = b - a
    bpy.ops.mesh.primitive_cone_add(vertices=9, radius1=radius, radius2=radius * 0.70,
                                   depth=v.length, location=(a + b) / 2)
    obj = bpy.context.object
    obj.rotation_euler = v.to_track_quat("Z", "Y").to_euler()
    return finish(obj, c, mat or wood, name)


def cord(c, points, radius, mat, name):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth, curve.bevel_resolution = radius, 2
    line = curve.splines.new("POLY")
    line.points.add(len(points) - 1)
    for point, co in zip(line.points, points):
        point.co = (*co, 1)
    obj = bpy.data.objects.new(name, curve)
    c.objects.link(obj)
    curve.materials.append(mat)


def rim(angle, z, offset=0):
    radius = 1.91 - 0.502 * z + offset
    ripple = (0.018 * math.sin(14 * angle) + 0.013 * math.sin(5 * angle)) * (1 - z / 3.9)
    return ((radius + ripple) * math.cos(angle), (radius + ripple) * math.sin(angle), z)


def fabric(c, start, sweep, low, high, mat, name, offset=0, door=False):
    columns, rows = max(3, round(sweep * 17)), max(2, round((high - low) * 8))
    verts, uv, faces = [], [], []
    for y in range(rows + 1):
        z = low + (high - low) * y / rows
        for x in range(columns + 1):
            angle = start + sweep * x / columns
            verts.append(rim(angle, z, offset))
            uv.append(((angle - DOOR) / math.pi, z / 2.1))
    for y in range(rows):
        for x in range(columns):
            if door and (x < 5 or (sweep == TAU and x >= columns - 5)) and low + (high - low) * y / rows < 1.4:
                continue
            i = y * (columns + 1) + x
            faces.append((i, i + 1, i + columns + 2, i + columns + 1))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    layer = mesh.uv_layers.new()
    for loop in mesh.loops:
        layer.data[loop.index].uv = uv[loop.vertex_index]
    obj = bpy.data.objects.new(name, mesh)
    finish(obj, c, mat, name)
    obj.modifiers.new("Hide thickness", "SOLIDIFY").thickness = 0.017


def patch(c, center, scale, mat, name):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=12, location=center)
    obj = bpy.context.object
    obj.scale = scale
    return finish(obj, c, mat, name)


def frame(c):
    tip_rng = random.Random(8)
    for i in range(14):
        a = DOOR + (i + 0.5) * TAU / 14
        near = rim(a, 0.025, -0.06)
        far = rim(a, 4.15 + tip_rng.random() * 0.32, -0.02)
        pole(c, near, far, 0.049)
    cord(c, [rim(DOOR + TAU * i / 64, 3.49 + 0.023 * i / 16, 0.05) for i in range(129)],
         0.023, rope, "Two plain rope turns")


def cover(c, full):
    # Leave a physically open doorway at the base and a small gap at the crown.
    sweep = TAU - 0.62
    fabric(c, DOOR, TAU if full else 3.45, 0.045, 3.57, hide, "Hide cover", door=True)
    fabric(c, DOOR + 0.29, sweep if full else 3.1, 0.035, 0.32, weathered, "Weathered hem", 0.009)
    fabric(c, DOOR + 0.24, 0.17, 0.072, 1.45, hide, "Open door flap", 0.10)
    for j in (-1, 1):
        fabric(c, DOOR + j * 0.48 - 0.24, 0.48, 2.98, 3.72, hide, f"Smoke flap {j}", 0.09)
        pole(c, rim(DOOR + j * 0.68, 0.09, 0.07), rim(DOOR + j * 0.48, 3.65, 0.11), 0.027)
    for i in range(1, 14 if full else 7):
        a = DOOR + TAU * i / 14
        cord(c, [rim(a, 0.31 + 3.15 * j / 44, 0.012) for j in range(45)],
             0.009, seam, "Plain vertical stitched seam")


bpy.ops.wm.read_factory_settings(use_empty=True)
wood = material("Peeled pole wood", (0.72, 0.72, 0.68), "wood_pole.png")
hide = material("Plain tanned hide", (0.89, 0.84, 0.76), "hide_tanned.png")
weathered = material("Weathered hide hem", (0.49, 0.39, 0.28), "hide_tanned.png")
seam = material("Stitching", (0.31, 0.21, 0.125))
rope = material("Lashing", (0.22, 0.15, 0.09))
earth = material("Cleared loam", (0.26, 0.16, 0.09))
snow = material("Snow", (0.83, 0.87, 0.93))
bpy.context.scene.unit_settings.system = "METRIC"
for state in ("stage1", "stage2", "stage3", "finished", "winter"):
    c = bpy.data.collections.new(state)
    bpy.context.scene.collection.children.link(c)
    if state == "stage1":
        patch(c, (0, 0, -0.004), (1.86, 1.8, 0.035), earth, "Cleared footprint")
        for i in range(9):
            a = i * TAU / 9
            pole(c, rim(a, 0, -0.12), rim(a, 0.27, -0.10), 0.038, name="Stake")
        for i in range(5):
            d = i * 0.13 - 0.29
            pole(c, (-1.36, d - 0.25, 0.05), (1.54, d - 0.05, 0.09))
    else:
        frame(c)
        if state in ("stage3", "finished", "winter"):
            cover(c, state != "stage3")
        if state == "stage3":
            patch(c, (0.92, -1.23, 0.12), (0.42, 0.31, 0.15), weathered, "Rolled hide")
        if state == "winter":
            fabric(c, DOOR + 0.31, TAU - 0.62, 0.045, 0.22, snow, "Banked snow", 0.052)
            for i in range(9):
                a = DOOR + 0.47 + i * 0.59
                fabric(c, a, 0.24 + rng.random() * 0.25, 2.55 + rng.random() * 0.55, 3.56,
                       snow, "Frost above the seam", 0.023)
            for i in range(9):
                a = DOOR + 0.52 + i * 0.57
                x, y, _ = rim(a, 0, 0.01)
                patch(c, (x, y, 0.018), (0.26, 0.18, 0.052), snow, "Snow drift")
    c.hide_render = state != "finished"
    c.hide_viewport = state != "finished"

for img in bpy.data.images:
    if img.source == "FILE":
        img.pack()
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / "building_tipi.blend"))
