"""Build four Red Dot Packaging sample families with editable size variants.

Run with Blender 5.2+: blender -b --factory-startup --python scripts/blender/build-packaging-samples.py
These are photo-based concept models; engineering dimensions require supplier drawings.
"""

from pathlib import Path
from functools import partial
import math
import sys

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
REVIEW = ROOT / 'artifacts/packaging-review'
PUBLIC_MODELS = ROOT / 'public/models/packaging'
PUBLIC_IMAGES = ROOT / 'public/assets/packaging'
for directory in (REVIEW, PUBLIC_MODELS, PUBLIC_IMAGES):
    directory.mkdir(parents=True, exist_ok=True)


def material(name, color, roughness=.28, metallic=0, transmission=0, alpha=1):
    value = bpy.data.materials.new(name)
    value.diffuse_color = (*color, 1)
    value.use_nodes = True
    shader = value.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Transmission Weight'].default_value = transmission
    shader.inputs['IOR'].default_value = 1.47
    shader.inputs['Alpha'].default_value = alpha
    if alpha < 1 and hasattr(value, 'surface_render_method'):
        value.surface_render_method = 'DITHERED'
    return value


CREAM = material('warm ivory PET', (.71, .68, .66), .43)
RED = material('burgundy pump lacquer', (.23, .025, .027), .19)
RED_DARK = material('pump recess', (.18, .028, .025), .31)
CLEAR = material('clear PETG', (.92, .96, .93), .08, transmission=.38, alpha=.16)
CAP_CLEAR = material('clear cap PET', (.84, .88, .86), .08, alpha=.045)
CAP_EDGE = material('clear cap edge', (.62, .68, .65), .12, transmission=.18, alpha=.64)
IVORY = material('ivory jar PETG', (.77, .76, .71), .32)
WHITE = material('soft white ink', (.95, .94, .89), .45)
INK = material('charcoal printing', (.055, .062, .052), .42)
YELLOW = material('soft gold PP', (.84, .65, .32), .3)
YELLOW_CLEAR = material('translucent amber PP', (.84, .65, .32), .24, transmission=.3, alpha=.38)
YELLOW_EDGE = material('hinge and rim gold', (.68, .47, .2), .24)
GREEN = material('sage PETG', (.27, .43, .27), .26)
GREEN_LIGHT = material('second chamber', (.57, .66, .51), .24)
STEEL = material('spring steel', (.75, .76, .7), .16, metallic=.72)
PAPER = material('insert paper', (.92, .9, .78), .63)


def assign(obj, mat, role=None):
    obj.data.materials.append(mat)
    if role:
        obj['role'] = role
    return obj


def cylinder(name, radius, depth, pos, mat, role=None, vertices=96, bevel=.02):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=pos)
    obj = bpy.context.object
    obj.name = name
    assign(obj, mat, role)
    if bevel:
        mod = obj.modifiers.new('Soft machined edge', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
        obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return obj


def protective_cap(name, outer_radius, wall, bottom, top, mat, role='glass', segments=96):
    """Closed roof, open bottom and real wall clearance around a dispenser."""
    inner_radius = outer_radius - wall
    half_height = (top - bottom) / 2
    rings = [
        [(radius * math.cos(2 * math.pi * i / segments), radius * math.sin(2 * math.pi * i / segments), height)
         for i in range(segments)]
        for radius, height in ((outer_radius, -half_height), (outer_radius, half_height), (inner_radius, -half_height), (inner_radius, half_height - wall))
    ]
    vertices = [point for ring_points in rings for point in ring_points]
    outer_roof = len(vertices)
    vertices.append((0, 0, half_height))
    inner_roof = len(vertices)
    vertices.append((0, 0, half_height - wall))
    faces = []
    for i in range(segments):
        j = (i + 1) % segments
        faces.extend([
            (i, j, segments + j, segments + i),
            (2 * segments + j, 2 * segments + i, 3 * segments + i, 3 * segments + j),
            (i, 2 * segments + i, 2 * segments + j, j),
            (outer_roof, segments + i, segments + j),
            (inner_roof, 3 * segments + j, 3 * segments + i),
        ])
    mesh = bpy.data.meshes.new(f'{name} mesh')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.location.z = (bottom + top) / 2
    assign(obj, mat, role)
    edge = obj.modifiers.new('Soft molded cap edge', 'BEVEL')
    edge.width = min(.015, wall / 3)
    edge.segments = 3
    obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return obj


def box(name, dims, pos, mat, role=None, bevel=.06):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign(obj, mat, role)
    if bevel:
        mod = obj.modifiers.new('Rounded molded edge', 'BEVEL')
        mod.width = bevel
        mod.segments = 4
        obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return obj


def ring(name, major_radius, minor_radius, pos, mat, role=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=major_radius, minor_radius=minor_radius, location=pos, major_segments=96, minor_segments=12)
    obj = bpy.context.object
    obj.name = name
    return assign(obj, mat, role)


def text(name, value, pos, size, mat, align='CENTER'):
    bpy.ops.object.text_add(location=pos, rotation=(math.pi / 2, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.data.body = value
    obj.data.size = size
    obj.data.align_x = align
    obj.data.extrude = .0005
    obj.data.resolution_u = 8
    bpy.ops.object.convert(target='MESH')
    obj = bpy.context.object
    assign(obj, mat, 'label')
    return obj


def empty(name, pos):
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = pos
    return obj


def parent_keep_position(obj, parent):
    bpy.context.view_layer.update()
    world = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_world = world
    bpy.context.view_layer.update()


def mousse(body_height=2.32, body_radius=.66):
    """Keep the 43-neck and pump size, while changing each bottle's body profile."""
    lift = body_height - 2.32
    cylinder('PET body', body_radius, body_height, (0, 0, .03 + body_height / 2), CREAM, 'body', bevel=.075)
    cylinder('Bottom insert', body_radius - .10, .05, (0, 0, .04), IVORY, bevel=.02)
    cylinder('43-neck collar', max(body_radius + .01, .62), .38, (0, 0, 2.51 + lift), RED, bevel=.025)
    cylinder('neck step', .53, .12, (0, 0, 2.74 + lift), RED_DARK, bevel=.012)
    pump = empty('Mousse_Pump_Assembly', (0, 0, 2.79 + lift))
    spout_center_x, spout_width, spout_depth = -.28, .46, .39
    cap_outer_radius, cap_wall = .61, .035
    spout_radial_extent = math.hypot(abs(spout_center_x) + spout_width / 2, spout_depth / 2)
    if spout_radial_extent + .02 > cap_outer_radius - cap_wall:
        raise RuntimeError('HD-1267 dispenser exceeds the transparent cap inner radius')
    for obj in [cylinder('Foam dispenser stem', .33, .52, (0, 0, 3.0 + lift), RED, bevel=.03),
                cylinder('Dispenser shoulder', .41, .12, (0, 0, 2.81 + lift), RED, bevel=.02),
                box('Lateral dispenser spout', (spout_width, spout_depth, .13), (spout_center_x, 0, 3.22 + lift), RED, bevel=.055)]:
        parent_keep_position(obj, pump)
    cap = empty('Mousse_Cap_Assembly', (0, 0, 2.77 + lift))
    obj = protective_cap('Clear protective cap', cap_outer_radius, cap_wall, 2.75 + lift, 3.51 + lift, CAP_CLEAR)
    obj.parent = cap
    obj.location.z = (2.75 + 3.51) / 2 + lift - cap.location.z
    obj = ring('Cap lower lip', cap_outer_radius - .015, .013, (0, 0, 2.77 + lift), CAP_EDGE)
    parent_keep_position(obj, cap)
    obj = ring('Cap top edge', cap_outer_radius - .013, .009, (0, 0, 3.49 + lift), CAP_EDGE)
    parent_keep_position(obj, cap)
    text('RED DESIGN print', 'RED DESIGN', (0, -body_radius - .016, .03 + body_height * .81), .11, WHITE)
    text('product descriptor', 'CLEANSING MOUSSE', (0, -body_radius - .016, .03 + body_height * .22), .047, WHITE)
    return cap


def jar(body_radius=1.05, body_height=.68, lid_height=.45):
    body_top = .03 + body_height
    lid_bottom = body_top + .035
    cylinder('PETG cream jar body', body_radius, body_height, (0, 0, .03 + body_height / 2), IVORY, 'body', bevel=.11)
    cylinder('Jar foot', body_radius - .14, .06, (0, 0, .065), CREAM, bevel=.025)
    cylinder('Lid parting line', body_radius - .01, .018, (0, 0, body_top + .025), INK, bevel=.006)
    lid = empty('Jar_Lid_Assembly', (0, 0, lid_bottom + .015))
    obj = cylinder('Wide soft white cap', body_radius + .01, lid_height, (0, 0, lid_bottom + lid_height / 2), IVORY, 'trim', bevel=.1)
    parent_keep_position(obj, lid)
    obj = cylinder('Inner cap lip', body_radius - .1, .055, (0, 0, lid_bottom), CREAM, bevel=.012)
    parent_keep_position(obj, lid)
    text('Jar identity', 'Essence lotion & face cream', (0, -body_radius - .015, .03 + body_height * .72), .074, WHITE)
    text('Jar logo', 'RED DESIGN', (0, -body_radius - .015, .03 + body_height * .46), .083, WHITE)
    return lid


def cotton():
    box('PP lower shell', (2.25, 1.84, 1.23), (0, 0, .64), YELLOW_CLEAR, 'body', bevel=.19)
    box('Cotton pad inner well', (2.04, 1.63, .91), (0, .02, .77), YELLOW, bevel=.12)
    box('Translucent lower band', (2.17, 1.76, .26), (0, 0, .22), CLEAR, 'glass', bevel=.11)
    box('Upper rim', (2.3, 1.89, .12), (0, 0, 1.25), YELLOW_EDGE, 'trim', bevel=.065)
    box('White pad insert', (1.88, 1.44, .025), (0, 0, 1.317), PAPER, bevel=.05)
    box('Pad pickup slot', (.68, .18, .012), (0, -.1, 1.337), INK, bevel=.08)
    box('Rear hinge', (1.5, .18, .12), (0, .94, 1.27), YELLOW_EDGE, bevel=.04)
    lid = empty('Cotton_Lid_Assembly', (0, .94, 1.34))
    obj = box('Hinged upper lid', (2.29, 1.87, .2), (0, 0, 1.46), YELLOW, 'trim', bevel=.11)
    parent_keep_position(obj, lid)
    obj = box('Inset lid panel', (1.91, 1.47, .035), (0, 0, 1.57), YELLOW_EDGE, bevel=.055)
    parent_keep_position(obj, lid)
    for side, angle in ((-1, -.19), (1, .19)):
        obj = box('Lid tweezer arm', (.028, .92, .028), (side * .11, .03, 1.34), STEEL, bevel=.008)
        obj.rotation_euler.z = angle
        parent_keep_position(obj, lid)
    obj = box('Tweezer grip', (.22, .075, .025), (0, .47, 1.34), STEEL, bevel=.01)
    parent_keep_position(obj, lid)
    text('Cotton box logo', 'RED DESIGN', (0, -.951, .58), .18, WHITE)
    text('Cotton box descriptor', 'RESEARCH AND INNOVATIVE PRODUCTS', (0, -.951, .42), .045, WHITE)
    return lid


def dual(body_height=2.54, body_width=1.31, body_depth=.67):
    body_top = .03 + body_height
    chamber_width = (body_width - .19) / 2
    pump_offset = min(.28, body_width * .22)
    box('Transparent dual chamber casing', (body_width, body_depth, body_height), (0, 0, .03 + body_height / 2), CLEAR, 'glass', bevel=.18)
    box('Chamber A liquid', (chamber_width, body_depth - .19, body_height - .24), (-pump_offset, .02, .03 + body_height / 2 - .05), GREEN, 'chamber-a', bevel=.095)
    box('Chamber B liquid', (chamber_width, body_depth - .19, body_height - .24), (pump_offset, .02, .03 + body_height / 2 - .05), GREEN_LIGHT, 'chamber-b', bevel=.095)
    box('Center separation seam', (.018, body_depth - .22, body_height - .38), (0, .015, .03 + body_height / 2 - .02), WHITE, bevel=.004)
    box('Sage shoulder', (body_width, body_depth + .02, .38), (0, 0, body_top + .16), GREEN, 'trim', bevel=.16)
    box('Two-port neck', (body_width * .72, body_depth * .73, .36), (0, 0, body_top + .45), GREEN, bevel=.07)
    for x in (-pump_offset, pump_offset):
        cylinder('Dual pump stem', .09, .35, (x, 0, body_top + .62), GREEN, bevel=.01)
    cap = empty('Dual_Cap_Assembly', (0, 0, body_top + .59))
    obj = box('Twin dispensing dome', (body_width - .09, body_depth + .06, .31), (0, 0, body_top + .82), WHITE, bevel=.155)
    parent_keep_position(obj, cap)
    for x in (-pump_offset, pump_offset):
        obj = box('Two pump orifices', (.18, .06, .055), (x, -(body_depth + .06) / 2 - .008, body_top + .84), YELLOW_EDGE, bevel=.024)
        parent_keep_position(obj, cap)
    compact = body_height < 1.8
    text('Dual brand', 'RED DESIGN', (0, -body_depth / 2 - .014, body_top - (.22 if compact else .42)), .08 if compact else .115, INK)
    chamber_label_size = .42 * min(1, body_height / 1.8)
    text('A chamber label', 'A', (-pump_offset, -body_depth / 2 - .014, .03 + body_height * .44), chamber_label_size, INK)
    text('B chamber label', 'B', (pump_offset, -body_depth / 2 - .014, .03 + body_height * .44), chamber_label_size, INK)
    return cap


def review_stage():
    floor = box('Matte studio plinth', (7, 7, .1), (0, 0, -.09), material('review floor', (.79, .78, .74), .76), bevel=.015)
    floor.hide_render = False
    world = bpy.context.scene.world
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (.28, .28, .27, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = .22
    bpy.ops.object.light_add(type='AREA', location=(1, -4, 7))
    bpy.context.object.data.energy = 650
    bpy.context.object.data.shape = 'DISK'
    bpy.context.object.data.size = 5
    bpy.ops.object.light_add(type='AREA', location=(-4, 1, 5))
    bpy.context.object.data.energy = 480
    bpy.context.object.data.size = 4
    bpy.ops.object.camera_add(location=(.8, -8.5, 2.9))
    cam = bpy.context.object
    direction = Vector((0, 0, 1.6)) - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = 5.2
    bpy.context.scene.camera = cam
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 64
    scene.render.resolution_x = 1100
    scene.render.resolution_y = 1100
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = 'AgX'
    scene.render.image_settings.file_format = 'PNG'
    return floor, cam


MODELS = [
    ('HD-1267', mousse, 7, '250 ml PET mousse bottle'),
    ('HD-1159', jar, 13, '50 g PETG scrub jar'),
    ('HD-843', cotton, 21, '300 ml PP dual-layer cotton pad box'),
    ('HD-844', dual, 31, '100 ml x 2 PETG dual-chamber bottle'),
]

# Separate editable meshes for each photographed capacity. Proportions are visual
# estimates from the catalogue, not millimetre measurements or a uniform scale.
VARIANT_MODELS = [
    ('HD-1167', partial(mousse, 2.10, .65), 7, '200 ml PET mousse bottle'),
    ('HD-1168', partial(mousse, 1.88, .64), 7, '150 ml PET mousse bottle'),
    ('HD-1169', partial(mousse, 1.66, .62), 7, '120 ml PET mousse bottle'),
    ('HD-1170', partial(mousse, 1.52, .61), 7, '100 ml PET mousse bottle'),
    ('HD-1160', partial(jar, .87, .54, .39), 13, '30 g PETG scrub jar'),
    ('HD-1161', partial(jar, .95, .50, .44), 13, '30 g PETG scrub jar, broad profile'),
    ('HD-1162', partial(jar, 1.12, .56, .39), 13, '50 g PETG scrub jar, broad profile'),
    ('HD-845', partial(dual, 2.16, 1.24, .65), 31, '75 ml x 2 PETG dual-chamber bottle'),
    ('HD-846', partial(dual, 1.58, 1.16, .63), 31, '50 ml x 2 PETG dual-chamber bottle'),
    ('HD-847', partial(dual, 1.22, 1.04, .60), 31, '30 ml x 2 PETG dual-chamber bottle'),
]


requested = set(sys.argv[sys.argv.index('--') + 1:]) if '--' in sys.argv else None
build_list = MODELS + VARIANT_MODELS if __name__ == '__main__' else []
for sku, builder, source_page, description in build_list:
    if requested and sku not in requested:
        continue
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.render.film_transparent = False
    scene.world = bpy.data.worlds.new(f'{sku} warm studio')
    movable = builder()
    geometry = list(scene.objects)
    floor, camera = review_stage()
    bpy.ops.wm.save_as_mainfile(filepath=str(REVIEW / f'{sku}.blend'))
    bpy.ops.object.select_all(action='DESELECT')
    for obj in geometry:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = next(obj for obj in geometry if obj.type == 'MESH')
    bpy.ops.export_scene.gltf(filepath=str(PUBLIC_MODELS / f'{sku.lower()}.glb'), export_format='GLB', use_selection=True, export_extras=True, export_apply=True)
    for obj in geometry:
        obj.select_set(False)
    base_location = movable.location.copy()
    views = [
        ('front', (.8, -8.5, 2.9), False),
        ('side', (7.0, -3.7, 4.1), False),
        ('open', (4.4, -6.9, 5.2), True),
    ] if sku in {item[0] for item in MODELS} else [('front', (.8, -8.5, 2.9), False)]
    for suffix, location, open_state in views:
        camera.location = location
        camera.rotation_euler = (Vector((0, 0, 1.55)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
        movable.rotation_euler.x = -1.85 if open_state and sku == 'HD-843' else 0
        movable.location.x = base_location.x + (.65 if open_state and sku == 'HD-1159' else 0)
        movable.location.z = base_location.z + (1.6 if open_state and sku in ('HD-1267', 'HD-844') else (.5 if open_state and sku == 'HD-1159' else 0))
        scene.render.filepath = str(REVIEW / f'{sku}-{suffix}.png')
        bpy.ops.render.render(write_still=True)
    (PUBLIC_IMAGES / f'{sku.lower()}.png').write_bytes((REVIEW / f'{sku}-front.png').read_bytes())
    print('SAMPLE_READY', sku, source_page, description, flush=True)
