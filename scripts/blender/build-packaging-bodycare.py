"""Create editable visual models for Red Dot P33-P58 hair/body packaging.

The page-specific silhouettes follow the photographs. Distinct capacities have
distinct body proportions; no output is presented as mould-ready geometry.
"""

from __future__ import annotations

import importlib
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
s = importlib.import_module('build-packaging-samples')
ROOT = Path(__file__).resolve().parents[2]
ROWS = [row for row in json.loads((ROOT / 'docs/packaging-brochure-variants.json').read_text(encoding='utf-8'))['variants'] if 33 <= row['sourcePage'] <= 58]
REQUESTED = set(sys.argv[sys.argv.index('--') + 1:]) if '--' in sys.argv else set()

BLACK = s.material('black PP pump', (.025, .027, .025), .22)
WHITE = s.material('ivory PP pump', (.86, .85, .78), .27)
SILVER = s.material('satin silver pump', (.7, .73, .72), .2, metallic=.68)
GOLD = s.material('gold collar', (.69, .52, .25), .2, metallic=.55)
PAGE_COLOURS = {
    33: (.43, .25, .17), 35: (.77, .75, .68), 37: (.56, .022, .026),
    39: (.39, .23, .13), 41: (.085, .16, .46), 43: (.85, .83, .76),
    45: (.29, .69, .65), 47: (.24, .13, .085), 48: (.16, .34, .77),
    49: (.27, .55, .4), 50: (.69, .7, .67), 51: (.78, .51, .28),
    52: (.31, .21, .15), 53: (.22, .115, .072), 54: (.51, .38, .65),
    55: (.60, .60, .78), 56: (.39, .64, .76), 57: (.37, .61, .46),
    58: (.63, .8, .3),
}


def body_material(page, variant_id):
    colour = PAGE_COLOURS[page]
    if page == 33:
        colour = (.24, .095, .052)
    if page == 45:
        colour = {'HD-900': (.68, .68, .65), 'HD-901': (.29, .69, .65), 'HD-902': (.76, .76, .25)}.get(variant_id, colour)
    if page == 58:
        colour = {'HD-09': (.9, .42, .64), 'HD-10': (.61, .81, .28), 'HD-11': (.86, .45, .25)}.get(variant_id, colour)
    translucent = page in (33, 39, 47, 49, 51, 52, 53, 54, 57)
    return s.material(f'{variant_id} bottle shell', colour, .24 if translucent else .32,
                      transmission=.3 if page == 33 else .18 if translucent else 0,
                      alpha=.9 if page == 33 else .8 if translucent else 1)


def lathe(name, profile, material, role='body', segments=64):
    vertices = []
    for z, radius in profile:
        for i in range(segments):
            angle = math.tau * i / segments
            vertices.append((radius * math.cos(angle), radius * math.sin(angle), z))
    faces = []
    for ring in range(len(profile) - 1):
        for i in range(segments):
            j = (i + 1) % segments
            faces.append((ring * segments + i, ring * segments + j, (ring + 1) * segments + j, (ring + 1) * segments + i))
    faces.append(tuple(reversed(range(segments))))
    faces.append(tuple((len(profile) - 1) * segments + i for i in range(segments)))
    mesh = bpy.data.meshes.new(f'{name} mesh')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    s.assign(obj, material, role)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    bevel = obj.modifiers.new('Soft moulded edge', 'BEVEL')
    bevel.width = .016
    bevel.segments = 2
    obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return obj


def twisted_bottle(radius, height, material):
    # The P45 reference has diagonal moulded bands, not stacked circular ribs.
    vertices, faces = [], []
    segments, rings = 72, 55
    for ring in range(rings):
        t = ring / (rings - 1)
        end_taper = .88 + .12 * min(1, t * 12, (1 - t) * 12)
        for index in range(segments):
            angle = math.tau * index / segments
            band = math.cos(3 * angle - math.tau * 2.1 * t)
            r = radius * end_taper * (1 + .075 * band * math.sin(math.pi * t) ** .45)
            vertices.append((r * math.cos(angle), r * math.sin(angle), .05 + height * t))
    for ring in range(rings - 1):
        for index in range(segments):
            nxt = (index + 1) % segments
            faces.append((ring * segments + index, ring * segments + nxt,
                          (ring + 1) * segments + nxt, (ring + 1) * segments + index))
    faces.append(tuple(reversed(range(segments))))
    faces.append(tuple((rings - 1) * segments + index for index in range(segments)))
    mesh = bpy.data.meshes.new('Twisted moulded body mesh')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new('Twisted ribbed bottle body', mesh)
    bpy.context.scene.collection.objects.link(obj)
    s.assign(obj, material, 'body')
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return obj


def pump(top, radius, page, material=None, cap_name='Pump'):
    metal = material or (SILVER if page in (41, 50, 54, 57) else BLACK if page in (33, 39, 45, 47, 52, 53) else WHITE)
    s.cylinder(f'{cap_name} retaining collar', radius * .61, .23, (0, 0, top + .10), metal, 'pump', bevel=.028)
    stem = s.cylinder(f'{cap_name} stem', radius * .22, .35, (0, 0, top + .34), metal, 'pump', bevel=.018)
    head = s.cylinder(f'{cap_name} actuator', radius * .37, .12, (0, 0, top + .55), metal, 'pump', bevel=.03)
    spout = s.box(f'{cap_name} spout', (radius * .55, radius * .22, .075), (-radius * .42, 0, top + .55), metal, 'pump', bevel=.026)
    assembly = s.empty('Lotion_Pump_Assembly', (0, 0, top + .3))
    for obj in (stem, head, spout):
        s.parent_keep_position(obj, assembly)


def label(radius, height, material=s.WHITE, detail='HAIR & BODY CARE'):
    s.text('RED DESIGN print', 'RED DESIGN', (0, -radius - .024, height * .68), min(.13, radius * .17), material)
    s.text('Product descriptor', detail, (0, -radius - .024, height * .3), .036, material)


def build_shape(row):
    page, variant_id = row['sourcePage'], row['id']
    amount = int(''.join(c for c in row['capacity'] if c.isdigit()))
    component = 2 if '×2' in row['capacity'] else 1
    total = amount * component
    height = 1.75 + (total - 250) * .0024
    radius = .56 + (total - 250) * .00045
    height = max(1.35, height)
    radius = max(.46, radius)
    top = .05 + height
    body = body_material(page, variant_id)

    if page == 33:  # hourglass body with widened shoulders and narrow waist
        lathe('Waisted hourglass body', [(0.04, radius * .78), (.11, radius), (height * .31, radius * 1.04),
             (height * .51, radius * .76), (height * .72, radius * 1.02), (height + .05, radius * .88)], body)
    elif page in (35, 41, 43, 49, 52, 57):
        width = radius * (1.8 if page == 43 else 1.65)
        depth = radius * (1.05 if page == 43 else 1.25)
        s.box('Rounded rectangular bottle body', (width, depth, height), (0, 0, .05 + height / 2), body, 'body', bevel=.13)
        if page == 43:
            s.box('Recessed oval face panel', (width * .78, .025, height * .77), (0, -depth / 2 - .014, .08 + height * .49), WHITE, 'accent', bevel=.18)
            for index in range(5):
                s.box('Lower moulded rib', (width * .83, .018, .018), (0, -depth / 2 - .023, .13 + index * .047), body, 'body', bevel=.006)
    elif page == 39:
        s.box('Lower stepped glass body', (radius * 1.8, radius * 1.5, height * .52), (0, 0, .05 + height * .26), body, 'body', bevel=.095)
        s.box('Upper stepped glass body', (radius * 1.52, radius * 1.32, height * .38), (0, 0, .05 + height * .72), body, 'body', bevel=.09)
        s.box('Waist band', (radius * 1.55, radius * 1.37, .15), (0, 0, .05 + height * .52), body, 'body', bevel=.045)
    elif page == 45:
        twisted_bottle(radius, height, body)
    elif page == 48:  # two visible formula chambers and shared blue collar
        s.box('Blue dual-chamber outer casing', (radius * 2, radius * 1.15, height), (0, 0, .05 + height / 2), body, 'body', bevel=.09)
        left = s.material('left clear chamber', (.7, .82, .92), .2, transmission=.4, alpha=.55)
        right = s.material('right blue chamber', (.16, .4, .77), .21, transmission=.3, alpha=.6)
        for x, mat in ((-radius * .45, left), (radius * .45, right)):
            s.box('Separate inner chamber', (radius * .83, radius * .89, height * .9), (x, 0, .06 + height * .47), mat, 'chamber-a' if x < 0 else 'chamber-b', bevel=.06)
        s.box('Central division seam', (.018, radius, height * .89), (0, 0, .06 + height * .47), WHITE, 'accent', bevel=.004)
    elif page == 58:  # coloured bottle with a spherical stopper
        s.cylinder('Colourful bottle body', radius, height, (0, 0, .05 + height / 2), body, 'body', bevel=.065)
    else:
        s.cylinder('Cylindrical bottle body', radius, height, (0, 0, .05 + height / 2), body, 'body', bevel=.065)
        if page == 37:
            for index in range(14):
                angle = math.tau * index / 14
                s.cylinder('Vertical fluted body rib', .035, height * .79,
                           ((radius - .008) * math.cos(angle), (radius - .008) * math.sin(angle), .05 + height * .49), body, 'body', vertices=10, bevel=.012)

    if page == 58:
        s.cylinder('Stopper neck', radius * .58, .12, (0, 0, top + .05), body, 'cap', bevel=.02)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, location=(0, 0, top + radius * .51))
        bpy.context.object.name = 'Spherical stopper cap'
        bpy.context.object.dimensions = (radius * 1.04, radius * 1.04, radius * 1.04)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        s.assign(bpy.context.object, body, 'cap')
    elif page == 48:
        for side in (-1, 1):
            offset = side * radius * .45
            s.cylinder('Twin pump stem', .085, .36, (offset, 0, top + .30), WHITE, 'pump', bevel=.01)
            s.box('Twin pump head', (.27, .20, .1), (offset - .08, 0, top + .53), WHITE, 'pump', bevel=.04)
        s.box('Blue dual pump collar', (radius * 2.02, radius * 1.18, .24), (0, 0, top + .1), body, 'pump', bevel=.075)
    else:
        pump(top, radius, page, material=(SILVER if page == 45 and variant_id == 'HD-900' else body if page in (37, 45, 49) else None))
    front = radius * (.525 if page == 43 else .625 if page in (35, 41, 49, 52, 57) else .575 if page == 48 else .75 if page == 39 else 1.09 if page == 45 else 1)
    label(front, height, s.INK if page in (35, 43, 45, 50, 51, 55, 56, 58) else s.WHITE)


def build(row):
    variant_id = row['id']
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.world = bpy.data.worlds.new(f'{variant_id} studio')
    build_shape(row)
    geometry = list(scene.objects)
    floor, camera = s.review_stage()
    floor.dimensions = (1000, 1000, .1)
    s.box('Warm studio background', (20, .1, 30), (0, 5, 7), s.material('warm studio backdrop', (.79, .78, .74), .8), bevel=0)
    scene.cycles.samples = 28
    scene.render.resolution_x = 760
    scene.render.resolution_y = 760
    highest = max((obj.location.z + obj.dimensions.z / 2 for obj in geometry if obj.type == 'MESH'), default=2)
    camera.location = (.65, -9, highest * .5 + 2)
    camera.rotation_euler = (Vector((0, 0, highest * .5)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.ortho_scale = max(3.3, highest * 1.46)
    bpy.ops.wm.save_as_mainfile(filepath=str(s.REVIEW / f'{variant_id}.blend'))
    bpy.ops.object.select_all(action='DESELECT')
    for obj in geometry:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = next(obj for obj in geometry if obj.type == 'MESH')
    bpy.ops.export_scene.gltf(filepath=str(s.PUBLIC_MODELS / f'{variant_id.lower()}.glb'), export_format='GLB', use_selection=True, export_extras=True, export_apply=True)
    for obj in geometry:
        obj.select_set(False)
    render = s.REVIEW / f'{variant_id}-front.png'
    scene.render.filepath = str(render)
    bpy.ops.render.render(write_still=True)
    (s.PUBLIC_IMAGES / f'{variant_id.lower()}.png').write_bytes(render.read_bytes())
    print('MODEL_READY', variant_id, row['capacity'], flush=True)


for row in ROWS:
    if REQUESTED and row['id'] not in REQUESTED:
        continue
    build(row)
