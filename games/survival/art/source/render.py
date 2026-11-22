"""Render building states or rigged figures with Blender 5.1 and Pillow.

blender -b art/source/<key>.blend -P art/source/render.py -- <key> [state or animation]
"""
import json
import math
import subprocess
import sys
import tempfile
from pathlib import Path

import bpy
from mathutils import Euler, Vector

ART = Path(__file__).resolve().parents[1]
SOURCE = ART / "source"
CAMERA_ROTATION = Euler(tuple(map(math.radians, (60, 0, 45))))


def linear(hex_color):
    vals = [int(hex_color[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in vals)


def aim(obj, direction):
    obj.rotation_euler = Vector(direction).to_track_quat("-Z", "Y").to_euler()


def setup(scene, entry):
    width, height = entry["cell"]
    ax, ay = entry["anchor"]
    camera = bpy.data.objects.new("Isometric art camera", bpy.data.cameras.new("Isometric art camera"))
    scene.collection.objects.link(camera)
    camera.rotation_euler = CAMERA_ROTATION
    camera.location = CAMERA_ROTATION.to_matrix() @ Vector((0, 0, 20))
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = width / 45.25
    camera.data.shift_x = 0.5 - ax
    camera.data.shift_y = (ay - 0.5) * height / width
    scene.camera = camera
    scene.unit_settings.system = "METRIC"
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = 64
    scene.render.resolution_x, scene.render.resolution_y = width * 2, height * 2
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.world = bpy.data.worlds.new("Cool fill")
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (*linear("3A4660"), 1)
    background.inputs["Strength"].default_value = 0.35

    # Project the sun to the upper left in the camera's image plane.
    horizontal = CAMERA_ROTATION.to_matrix() @ Vector((-1, 0, 0))
    away = Vector((1, -1, 0)).normalized()
    direction = (horizontal + away * 0.35).normalized() * 0.5 + Vector((0, 0, math.sqrt(3) / 2))
    sun = bpy.data.lights.new("Warm key", "SUN")
    sun.energy, sun.angle, sun.color = 3.5, math.radians(4), linear("FFF1D6")
    light = bpy.data.objects.new(sun.name, sun)
    scene.collection.objects.link(light)
    aim(light, -direction)

    fill = bpy.data.lights.new("Cool fill bounce", "SUN")
    fill.energy, fill.color, fill.use_shadow = 0.35, linear("3A4660"), False
    bounce = bpy.data.objects.new(fill.name, fill)
    scene.collection.objects.link(bounce)
    aim(bounce, (-1, 0, -1))

    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -0.025))
    ground = bpy.context.object
    ground.name = "Shadow matte"
    matte = bpy.data.materials.new("White matte")
    matte.use_nodes = True
    shader = matte.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (0.55, 0.55, 0.55, 1)
    shader.inputs["Roughness"].default_value = 1
    ground.data.materials.append(matte)
    return ground


def render(scene, file):
    scene.render.filepath = str(file)
    bpy.ops.render.render(write_still=True)


def main():
    key, *chosen = sys.argv[sys.argv.index("--") + 1:]
    entry = json.loads((ART / "manifest.json").read_text(encoding="utf-8"))[key]
    if entry.get("facings") == 8:
        rig = bpy.data.objects.get("Human rig")
        if key == "person_man" and rig is not None and rig.get("action_registry"):
            sys.path.insert(0, str(SOURCE / "AB13-r1"))
            from render_batch import render_figures
            render_figures(key, entry, chosen)
            return
        sys.path.insert(0, str(SOURCE / "AB12-r1"))
        from render_figures import render_figures
        render_figures(key, entry, chosen)
        return
    states = chosen or entry["states"]
    if any(state not in entry["states"] for state in states):
        raise ValueError(f"Unknown state for {key}: {states}")
    scene = bpy.context.scene
    ground = setup(scene, entry)
    parts = {name: bpy.data.collections.get(name) for name in entry["states"]}
    if any(collection is None for collection in parts.values()):
        raise ValueError(f"{key} needs collections named {tuple(parts)}")
    out = ART / "inbox" / "AB0" / key
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="survival-render-") as temp:
        temp = Path(temp)
        empty = temp / "unshadowed.png"
        for collection in parts.values():
            collection.hide_render = True
        render(scene, empty)
        for state in states:
            for name, collection in parts.items():
                collection.hide_render = name != state
            model, matte = temp / "model.png", temp / "shadow.png"
            ground.hide_render = True
            render(scene, model)
            ground.hide_render = False
            render(scene, matte)
            subprocess.run(["python", str(SOURCE / "finish_render.py"), str(model), str(matte),
                            str(empty), str(out / f"{state}_00.png"), *map(str, entry["cell"])], check=True)


if __name__ == "__main__":
    main()
