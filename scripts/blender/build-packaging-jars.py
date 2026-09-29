"""Photo-guided P14-P20 jar and cotton-pad-box capacity models.

Run with Blender 5.2. The saved .blend scenes are editable visual studies;
physical dimensions and opening mechanisms need supplier samples.
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
ROWS = [row for row in json.loads((ROOT / 'docs/packaging-brochure-variants.json').read_text(encoding='utf-8'))['variants'] if 14 <= row['sourcePage'] <= 20]
REQUESTED = set(sys.argv[sys.argv.index('--') + 1:]) if '--' in sys.argv else set()

BURGUNDY = s.material('cranberry PET', (.25, .012, .021), .22)
BURGUNDY_LID = s.material('cranberry glossy lid', (.28, .014, .024), .16)
ROSE_COPPER = s.material('rose copper PETG', (.52, .27, .22), .28, metallic=.12)
COPPER_LID = s.material('copper satin lid', (.31, .15, .12), .21, metallic=.27)
PALE_BLUE = s.material('pale blue PETG', (.61, .74, .79), .39)
SKY_BLUE = s.material('sky cotton pad box', (.32, .64, .77), .26)
SPRING_GREEN = s.material('spring green cotton pad box', (.49, .72, .32), .28)
LAVENDER = s.material('lavender cotton pad box', (.48, .4, .7), .27)
BRONZE = s.material('brown translucent PETG', (.34, .19, .12), .25, transmission=.14, alpha=.72)
CREAM_LID = s.material('warm cream lid', (.87, .83, .73), .29)
DARK_SEAM = s.material('dark moulded parting line', (.12, .075, .06), .4)


def jar(ml, page):
    short = page in (14, 15, 20)
    radius = (.67 if short else .72) + ml * (.0013 if short else .001)
    body_height = (.36 if short else .45) + ml * (.0018 if short else .0023)
    if page == 14:
        body, lid = BURGUNDY, BURGUNDY_LID
    elif page == 15:
        body, lid = ROSE_COPPER, COPPER_LID
    elif page == 16:
        body, lid = PALE_BLUE, CREAM_LID
    else:
        body, lid = BRONZE, CREAM_LID
    body_top = .045 + body_height
    s.cylinder('Jar body', radius, body_height, (0, 0, .045 + body_height / 2), body, 'body', bevel=.065)
    s.cylinder('Recessed foot', radius - .12, .055, (0, 0, .06), body, 'body', bevel=.016)
    s.ring('Lid parting seam', radius - .014, .012, (0, 0, body_top + .018), DARK_SEAM)
    cap = s.empty('Jar_Lid_Assembly', (0, 0, body_top + .025))
    lid_height = .28 + radius * .14
    for obj in [
        s.cylinder('Jar screw cap', radius + .012, lid_height, (0, 0, body_top + .03 + lid_height / 2), lid, 'trim', bevel=.075),
        s.cylinder('Cap inner lip', radius - .08, .05, (0, 0, body_top + .035), lid, 'trim', bevel=.01),
    ]:
        s.parent_keep_position(obj, cap)
    ink = s.WHITE if page == 14 else s.INK
    s.text('RED DESIGN print', 'RED DESIGN', (0, -radius - .02, body_top * .67), min(.11, radius * .12), ink)
    s.text('Scrub jar descriptor', 'FACIAL CARE', (0, -radius - .02, body_top * .35), .036, ink)


def cotton_box(ml, page):
    radius = .64 + ml * .00095
    body_height = .54 + ml * .0016
    if page == 17:
        body, lid = SKY_BLUE, PALE_BLUE
    elif page == 18:
        body, lid = SPRING_GREEN, SPRING_GREEN
    else:
        body, lid = LAVENDER, LAVENDER
    top = .04 + body_height
    s.cylinder('Cotton pad lower tub', radius, body_height, (0, 0, .04 + body_height / 2), body, 'body', bevel=.09)
    s.cylinder('White cotton pad stack', radius - .115, .035, (0, 0, top - .02), s.PAPER, 'inner', bevel=.01)
    s.cylinder('Pad pickup slot', radius * .35, .012, (0, 0, top + .006), s.WHITE, 'inner', bevel=.004)
    s.ring('Box upper rim', radius - .012, .014, (0, 0, top + .015), lid, 'trim')
    s.box('Rear hinge', (radius * .65, .1, .1), (0, radius - .015, top + .025), lid, 'trim', bevel=.025)
    cap = s.empty('Cotton_Lid_Assembly', (0, radius - .015, top + .04))
    for obj in [
        s.cylinder('Hinged cotton box lid', radius + .018, .16, (0, 0, top + .12), lid, 'trim', bevel=.07),
        s.cylinder('Inset lid roundel', radius - .17, .017, (0, 0, top + .21), body, 'trim', bevel=.007),
    ]:
        s.parent_keep_position(obj, cap)
    s.text('RED DESIGN print', 'RED DESIGN', (0, -radius - .02, body_height * .59), min(.13, radius * .12), s.WHITE)
    s.text('Cotton pad descriptor', 'COTTON PADS', (0, -radius - .02, body_height * .32), .038, s.WHITE)


def build(row):
    variant_id = row['id']
    amount = int(''.join(character for character in row['capacity'] if character.isdigit()))
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.world = bpy.data.worlds.new(f'{variant_id} studio')
    if row['sourcePage'] in (17, 18, 19):
        cotton_box(amount, row['sourcePage'])
    else:
        jar(amount, row['sourcePage'])
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
    camera.data.ortho_scale = max(3, highest * 2.3)
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
    if REQUESTED and row['id'] not in REQUESTED and row['sku'] not in REQUESTED:
        continue
    build(row)
