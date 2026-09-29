"""Build photo-guided P8-P12 Red Dot packaging variants in Blender.

Each capacity gets its own editable scene and GLB. Geometry is for visual
selection; the catalogue contains no millimetre drawings or mating tolerances.

Run: blender -b --factory-startup --python scripts/blender/build-packaging-first-batch.py -- [HD code ...]
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
import importlib

s = importlib.import_module('build-packaging-samples')

ROOT = Path(__file__).resolve().parents[2]
VARIANTS = json.loads((ROOT / 'docs/packaging-brochure-variants.json').read_text(encoding='utf-8'))['variants']
ROWS = [row for row in VARIANTS if 8 <= row['sourcePage'] <= 12]
REQUESTED = set(sys.argv[sys.argv.index('--') + 1:]) if '--' in sys.argv else set()

BLUE = s.material('blue transparent solution', (.018, .31, .68), .15, transmission=.25, alpha=.58)
BLUE_BODY = s.material('light blue PET', (.44, .63, .79), .28)
BLUE_HEAD = s.material('pale blue PP foam pump', (.55, .73, .84), .22)
WHITE_PUMP = s.material('warm white pump', (.91, .91, .86), .2)
SILICONE = s.material('soft silicone brush', (.79, .83, .79), .54)
AMBER = s.material('golden clear PETG', (.9, .62, .2), .16, transmission=.45, alpha=.24)
DARK_AMBER = s.material('dark amber spray PET', (.36, .12, .025), .23, transmission=.25, alpha=.7)
HONEY = s.material('honey formula', (.88, .46, .014), .24, transmission=.1, alpha=.84)
BLACK = s.material('black dispenser lacquer', (.018, .019, .016), .22)
BLACK_TRIM = s.material('black satin collar', (.052, .055, .048), .31)
WHITE_BODY = s.material('ivory satin PET', (.72, .71, .64), .3)
GOLD_INK = s.material('champagne gold print', (.45, .33, .13), .28, metallic=.35)


def ball(name, pos, dimensions, mat, role=None, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, location=pos)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    obj.rotation_euler = rotation
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    s.assign(obj, mat, role)
    obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return obj


def imprint(radius, height, colour=s.WHITE, detail='MOISTURIZING CLEANSING MOUSSE'):
    s.text('RED DESIGN print', 'RED DESIGN', (0, -radius - .022, height * .78), .105, colour)
    s.text('Product descriptor', detail, (0, -radius - .022, height * .25), .034, colour)


def brush_mousse(ml):
    # The silicone brush and its angled neck are outside the bottle, while
    # the blue solution and pickup tube remain visible through the PET shell.
    body_height = 1.86 + (ml - 100) * .0052
    radius = .51 + (ml - 100) * .00072
    top = .06 + body_height
    s.cylinder('Clear PET bottle shell', radius, body_height, (0, 0, .06 + body_height / 2), s.CLEAR, 'body', bevel=.055)
    s.cylinder('Blue product fill', radius - .065, body_height * .77, (0, 0, .08 + body_height * .385), BLUE, 'liquid', bevel=.022)
    s.cylinder('Deep blue liquid shoulder', radius - .065, .15, (0, 0, top - .19), s.material('deep blue upper liquid', (.015, .16, .48), .17, transmission=.3, alpha=.28), 'liquid', bevel=.015)
    s.cylinder('White pump retaining collar', radius + .012, .26, (0, 0, top + .12), WHITE_PUMP, 'trim', bevel=.035)
    s.cylinder('Visible pickup tube', .024, body_height * .77, (0, 0, .14 + body_height * .41), WHITE_PUMP, 'pump', bevel=.004)
    s.cylinder('Pump stem', .15, .41, (0, 0, top + .43), WHITE_PUMP, 'pump', bevel=.025)
    s.cylinder('Pump top socket', .22, .27, (0, 0, top + .70), WHITE_PUMP, 'pump', bevel=.045)
    ball('Angled silicone cleansing head', (.29, 0, top + .96), (.56, .19, .61), SILICONE, 'pump', rotation=(0, .72, 0))
    for row in range(-5, 6):
        for column in range(-4, 5):
            radial = (column / 4.7) ** 2 + (row / 5.7) ** 2
            if radial > .86:
                continue
            local_x, local_z = column * .05, row * .049
            x = .29 + math.cos(.72) * local_x + math.sin(.72) * local_z
            z = top + .96 - math.sin(.72) * local_x + math.cos(.72) * local_z
            y = -.10 * math.sqrt(1 - radial) - .006
            bpy.ops.mesh.primitive_cone_add(vertices=7, radius1=.007, radius2=.002, depth=.022,
                                            location=(x, y, z), rotation=(math.pi / 2, 0, 0))
            bpy.context.object.name = 'Silicone microbristle'
            s.assign(bpy.context.object, SILICONE, 'pump')
    imprint(radius, body_height, s.WHITE, 'SKIN CARE CLEANSING FOAM')


def blue_mousse(ml):
    body_height = 1.75 + (ml - 200) * .0039
    radius = .60 + (ml - 200) * .00055
    top = .05 + body_height
    s.cylinder('Blue PET bottle body', radius, body_height, (0, 0, .05 + body_height / 2), BLUE_BODY, 'body', bevel=.065)
    s.cylinder('Silver satin dispenser collar', radius + .005, .4, (0, 0, top + .18), s.STEEL, 'trim', bevel=.03)
    s.cylinder('Foam pump stem', .17, .39, (0, 0, top + .53), BLUE_HEAD, 'pump', bevel=.025)
    s.cylinder('Wide flat foam pump plate', .31, .13, (0, 0, top + .74), BLUE_HEAD, 'pump', bevel=.04)
    s.box('Short thumb spout', (.31, .17, .085), (-.29, 0, top + .745), BLUE_HEAD, 'pump', bevel=.035)
    imprint(radius, body_height, s.WHITE, 'AMINO ACID SURFACTANT')


def amber_lotion(ml):
    body_height = 2.15 + (ml - 100) * .005
    radius = .58 + (ml - 100) * .00035
    top = .06 + body_height
    s.cylinder('Amber PETG outer bottle', radius, body_height, (0, 0, .06 + body_height / 2), AMBER, 'body', bevel=.065)
    s.cylinder('Golden liquid core', radius - .055, body_height * .77, (0, 0, .08 + body_height * .385), HONEY, 'liquid', bevel=.025)
    s.cylinder('Internal dip tube', .025, body_height * .83, (0, 0, .12 + body_height * .49), BLACK_TRIM, 'pump', bevel=.005)
    s.cylinder('Black pump collar', radius + .013, .36, (0, 0, top + .18), BLACK_TRIM, 'trim', bevel=.035)
    pump = s.empty('Lotion_Pump_Assembly', (0, 0, top + .37))
    for obj in [
        s.cylinder('Tall black pump actuator', .20, .57, (0, 0, top + .55), BLACK, 'pump', bevel=.022),
        s.box('Curved dispensing spout', (.42, .18, .13), (-.27, 0, top + .81), BLACK, 'pump', bevel=.055),
    ]:
        s.parent_keep_position(obj, pump)
    imprint(radius, body_height, BLACK, 'SKIN CARE FORMULA')


def spray(ml, amber):
    body_height = (1.36 if amber else 1.7) + (ml - (50 if amber else 80)) * (.009 if amber else .007)
    radius = (.54 if amber else .56) + (ml - (50 if amber else 80)) * .00065
    top = .06 + body_height
    body_mat = DARK_AMBER if amber else WHITE_BODY
    pump_mat = BLACK_TRIM if amber else WHITE_PUMP
    s.cylinder('Spray bottle body', radius, body_height, (0, 0, .06 + body_height / 2), body_mat, 'body', bevel=.055)
    s.cylinder('Spray collar', radius + .008, .30, (0, 0, top + .14), pump_mat, 'trim', bevel=.026)
    s.cylinder('Atomizer shoulder', .35, .19, (0, 0, top + .34), pump_mat, 'pump', bevel=.025)
    s.cylinder('Atomizer actuator', .18, .29, (0, 0, top + .57), pump_mat, 'pump', bevel=.027)
    s.box('Spray nozzle tip', (.12, .06, .12), (0, -.17, top + .62), pump_mat, 'pump', bevel=.02)
    cap_radius = radius + .018
    cap = s.empty('Spray_Cap_Assembly', (0, 0, top + .39))
    cap_obj = s.protective_cap('Clear spray protective cap', cap_radius, .035, top + .28, top + .88, s.CAP_CLEAR)
    s.parent_keep_position(cap_obj, cap)
    rim = s.ring('Cap upper edge', cap_radius - .012, .009, (0, 0, top + .86), s.CAP_EDGE)
    s.parent_keep_position(rim, cap)
    imprint(radius, body_height, s.WHITE if amber else GOLD_INK, 'AMINO ACID SURFACTANT')


BUILDERS = {8: brush_mousse, 9: blue_mousse, 10: amber_lotion, 11: lambda ml: spray(ml, True), 12: lambda ml: spray(ml, False)}


def build(row):
    sku = row['sku']
    ml = int(row['capacity'].removesuffix('ml'))
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.world = bpy.data.worlds.new(f'{sku} studio')
    BUILDERS[row['sourcePage']](ml)
    geometry = list(scene.objects)
    floor, camera = s.review_stage()
    floor.dimensions = (1000, 1000, .1)
    s.box('Warm studio background', (20, .1, 30), (0, 5, 7), s.material('warm studio backdrop', (.79, .78, .74), .8), bevel=0)
    scene.cycles.samples = 28
    scene.render.resolution_x = 760
    scene.render.resolution_y = 760
    camera.data.ortho_scale = 5.1 if row['sourcePage'] == 8 else 4.5
    target_z = max((obj.location.z + obj.dimensions.z / 2 for obj in geometry if obj.type == 'MESH'), default=2) / 2
    camera.location = (.55, -8.5, target_z + 2.0)
    camera.rotation_euler = (Vector((0, 0, target_z)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    blend = s.REVIEW / f'{sku}.blend'
    bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    bpy.ops.object.select_all(action='DESELECT')
    for obj in geometry:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = next(obj for obj in geometry if obj.type == 'MESH')
    glb = s.PUBLIC_MODELS / f'{sku.lower()}.glb'
    bpy.ops.export_scene.gltf(filepath=str(glb), export_format='GLB', use_selection=True, export_extras=True, export_apply=True)
    for obj in geometry:
        obj.select_set(False)
    render = s.REVIEW / f'{sku}-front.png'
    scene.render.filepath = str(render)
    bpy.ops.render.render(write_still=True)
    (s.PUBLIC_IMAGES / f'{sku.lower()}.png').write_bytes(render.read_bytes())
    print('MODEL_READY', sku, row['capacity'], blend, glb, flush=True)


for row in ROWS:
    if REQUESTED and row['sku'] not in REQUESTED:
        continue
    build(row)
