"""Create editable photo-guided skincare packaging drafts from P22-P29.

Models are exterior studies only. Containers, inserts and closures are separate
meshes. The PDF does not supply mould dimensions, thread specifications or fit.
"""

from __future__ import annotations

import importlib
import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
s = importlib.import_module('build-packaging-samples')
ROOT = Path(__file__).resolve().parents[2]
ROWS = [row for row in json.loads((ROOT / 'docs/packaging-brochure-variants.json').read_text(encoding='utf-8'))['variants'] if 22 <= row['sourcePage'] <= 29]
REQUESTED = set(sys.argv[sys.argv.index('--') + 1:]) if '--' in sys.argv else set()

RED = s.material('deep red PETG', (.42, .018, .025), .24)
WHITE = s.material('clean warm white PETG', (.85, .84, .78), .28)
SILVER = s.material('satin silver PETG', (.61, .63, .62), .31, metallic=.22)
CHARCOAL = s.material('smoky dark PETG', (.21, .21, .19), .25, transmission=.12, alpha=.82)
ORANGE = s.material('coral orange PETG', (.81, .35, .15), .26)
BLACK = s.material('black cap PP', (.032, .031, .029), .24)
GOLD = s.material('champagne collar', (.63, .49, .27), .22, metallic=.55)
PASTEL = s.material('pastel cotton box PP', (.56, .68, .47), .34, transmission=.12, alpha=.72)


def palette(page):
    return {22: (PASTEL, GOLD), 23: (RED, BLACK), 24: (WHITE, WHITE),
            25: (SILVER, WHITE), 26: (CHARCOAL, BLACK), 28: (ORANGE, WHITE),
            29: (SILVER, SILVER)}[page]


def jar(amount, page, body, cap_material):
    radius = .66 + amount * .002
    height = .43 + amount * .0024
    top = .04 + height
    s.cylinder('Jar body', radius, height, (0, 0, .04 + height / 2), body, 'body', bevel=.065)
    s.cylinder('Inset base', radius - .1, .06, (0, 0, .055), body, 'body', bevel=.015)
    s.ring('Jar moulding seam', radius - .012, .012, (0, 0, top + .012), BLACK if page == 26 else cap_material)
    lid = s.empty('Jar_Lid_Assembly', (0, 0, top + .02))
    for obj in [s.cylinder('Jar cap', radius + .01, .30, (0, 0, top + .18), cap_material, 'trim', bevel=.06),
                s.cylinder('Cap inner lip', radius - .09, .05, (0, 0, top + .02), cap_material, 'trim', bevel=.01)]:
        s.parent_keep_position(obj, lid)
    s.text('RED DESIGN print', 'RED DESIGN', (0, -radius - .02, height * .58), .095, s.WHITE if page in (23, 26, 28) else s.INK)


def skincare_bottle(amount, page, body, closure, small):
    radius = (.39 if small else .48) + amount * (.0017 if small else .00115)
    height = (1.23 if small else 1.52) + amount * (.008 if small else .005)
    top = .04 + height
    s.cylinder('Skincare bottle body', radius, height, (0, 0, .04 + height / 2), body, 'body', bevel=.055)
    s.cylinder('Bottom insert', radius - .07, .045, (0, 0, .05), body, 'body', bevel=.012)
    if page in (23, 24, 28) and amount >= 100:
        s.cylinder('Pump neck collar', radius + .012, .21, (0, 0, top + .085), closure, 'pump', bevel=.024)
        s.cylinder('Pump stem', .11, .29, (0, 0, top + .29), closure, 'pump', bevel=.014)
        s.cylinder('Pump head', .21, .1, (0, 0, top + .46), closure, 'pump', bevel=.022)
        s.box('Pump nozzle', (.24, .13, .068), (-.19, 0, top + .46), closure, 'pump', bevel=.02)
    elif small and page == 24:
        s.cylinder('Dropper collar', radius + .01, .19, (0, 0, top + .085), GOLD, 'trim', bevel=.02)
        s.cylinder('Pipette tube', .035, height * .6, (0, 0, height * .55), s.CLEAR, 'inner', bevel=.004)
        s.cylinder('Dropper screw cap', radius * .66, .35, (0, 0, top + .34), closure, 'trim', bevel=.045)
    else:
        s.cylinder('Tall closure cap', radius + .018, .38 if small else .48, (0, 0, top + (.19 if small else .24)), closure, 'trim', bevel=.055)
        s.ring('Cap lower seam', radius - .009, .01, (0, 0, top + .008), GOLD if page in (25, 26) else closure)
    ink = s.WHITE if page in (23, 26, 28) else s.INK
    s.text('RED DESIGN print', 'RED DESIGN', (0, -radius - .02, height * .75), min(.11, radius * .2), ink)
    s.text('Skincare descriptor', 'SKIN CARE', (0, -radius - .02, height * .28), .033, ink)


def single_layer_box():
    s.box('Translucent cotton pad container', (1.75, 1.2, 1.4), (0, 0, .73), PASTEL, 'body', bevel=.08)
    s.box('Cotton pad inner insert', (1.48, 1.02, 1.12), (0, 0, .72), s.PAPER, 'inner', bevel=.06)
    s.box('Upper box rim', (1.78, 1.23, .09), (0, 0, 1.42), GOLD, 'trim', bevel=.025)
    lid = s.empty('Cotton_Lid_Assembly', (0, .6, 1.47))
    obj = s.box('Lift-off square lid', (1.79, 1.24, .18), (0, 0, 1.55), PASTEL, 'trim', bevel=.05)
    s.parent_keep_position(obj, lid)
    s.text('RED DESIGN print', 'RED DESIGN', (0, -.61, .74), .12, s.WHITE)


def build(row):
    variant_id = row['id']
    amount = int(''.join(character for character in row['capacity'] if character.isdigit()))
    page = row['sourcePage']
    body, cap = palette(page)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.world = bpy.data.worlds.new(f'{variant_id} studio')
    if page == 22:
        single_layer_box()
    elif row['capacity'].endswith('g'):
        jar(amount, page, body, cap)
    else:
        skincare_bottle(amount, page, body, cap, amount <= 60)
    geometry = list(scene.objects)
    floor, camera = s.review_stage()
    floor.dimensions = (1000, 1000, .1)
    s.box('Warm studio background', (20, .1, 30), (0, 5, 7), s.material('warm studio backdrop', (.79, .78, .74), .8), bevel=0)
    scene.cycles.samples = 28
    scene.render.resolution_x = 760
    scene.render.resolution_y = 760
    highest = max((obj.location.z + obj.dimensions.z / 2 for obj in geometry if obj.type == 'MESH'), default=2)
    camera.location = (.55, -8.5, highest * .5 + 2)
    camera.rotation_euler = (Vector((0, 0, highest * .5)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.ortho_scale = max(3.3, highest * 1.55)
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
