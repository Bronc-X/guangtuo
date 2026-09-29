"""Build editable, reference-led hydrogel studies using Blender's Python API.

Run with Blender 4.5 LTS: blender -b --factory-startup -t 8 --python this.py -- --output DIR
Visual approximation only: the source specifies weight, not manufacturing dimensions.
"""
import argparse
import json
import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector
from mathutils.geometry import delaunay_2d_cdt


def options():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    parser.add_argument('--product', choices=['face', 'eye', 'both'], default='both')
    parser.add_argument('--size', type=int, default=1280)
    parser.add_argument('--samples', type=int, default=64)
    parser.add_argument('--draft', action='store_true')
    parser.add_argument('--animation', action='store_true')
    parser.add_argument('--frames', type=int, default=144)
    return parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])


ARGS = options()
OUT = Path(ARGS.output).resolve()
OUT.mkdir(parents=True, exist_ok=True)


def color(hex_value):
    c = [int(hex_value[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in c) + (1,)


def material(name, base, roughness=.3, metallic=0, transmission=0, ior=1.45):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = color(base)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Transmission Weight'].default_value = transmission
    shader.inputs['IOR'].default_value = ior
    return mat, shader


def gel_material():
    mat, shader = material('Hydrogel — milky / translucent study', 'F4F8F5', .19, transmission=.28, ior=1.37)
    shader.inputs['Coat Weight'].default_value = .35
    shader.inputs['Coat Roughness'].default_value = .1
    shader.inputs['Subsurface Weight'].default_value = .065
    shader.inputs['Subsurface Radius'].default_value = (.32, .2, .12)
    shader.inputs['Subsurface Scale'].default_value = .035
    noise = mat.node_tree.nodes.new('ShaderNodeTexNoise')
    noise.name = 'Microscopic gel surface (render only)'
    noise.inputs['Scale'].default_value = 145
    noise.inputs['Detail'].default_value = 2
    bump = mat.node_tree.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = .095
    bump.inputs['Distance'].default_value = .003
    mat.node_tree.links.new(noise.outputs['Fac'], bump.inputs['Height'])
    mat.node_tree.links.new(bump.outputs['Normal'], shader.inputs['Normal'])
    for frame, transparency, roughness in [(1, .28, .19), (49, .62, .13), (73, .99, .075), (97, .82, .11), (145, .28, .19)]:
        shader.inputs['Transmission Weight'].default_value = transparency
        shader.inputs['Transmission Weight'].keyframe_insert('default_value', frame=frame)
        shader.inputs['Roughness'].default_value = roughness
        shader.inputs['Roughness'].keyframe_insert('default_value', frame=frame)
        shader.inputs['Subsurface Weight'].default_value = .07*(1-transparency)
        shader.inputs['Subsurface Weight'].keyframe_insert('default_value', frame=frame)
        shader.inputs['Coat Weight'].default_value = .3-.2*transparency
        shader.inputs['Coat Weight'].keyframe_insert('default_value', frame=frame)
    return mat


def point_inside(p, loop):
    x, y = p
    inside = False
    j = len(loop) - 1
    for i, (xi, yi) in enumerate(loop):
        xj, yj = loop[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def ellipse(x, y, rx, ry, rotation=0, count=72):
    c, s = math.cos(rotation), math.sin(rotation)
    return [(x + rx*math.cos(t)*c - ry*math.sin(t)*s,
             y + rx*math.cos(t)*s + ry*math.sin(t)*c)
            for t in [i * 2 * math.pi/count for i in range(count)]]


def closed_spline(points, steps=9):
    result = []
    for i in range(len(points)):
        p0, p1, p2, p3 = [points[j % len(points)] for j in (i-1, i, i+1, i+2)]
        for step in range(steps):
            t = step/steps
            result.append(tuple(.5*((2*p1[k]) + (-p0[k]+p2[k])*t +
                (2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t*t +
                (-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t*t*t) for k in (0, 1)))
    return result


def surface(name, outer, holes, height, mat, thickness=.012, spacing=.055):
    verts, edges = [], []
    for loop in [outer] + holes:
        start = len(verts)
        verts.extend(Vector(p) for p in loop)
        edges.extend((start+i, start+(i+1) % len(loop)) for i in range(len(loop)))
    rng = random.Random(47)
    ymin, ymax = min(p[1] for p in outer), max(p[1] for p in outer)
    xmin, xmax = min(p[0] for p in outer), max(p[0] for p in outer)
    y = ymin + spacing
    while y < ymax:
        x = xmin + spacing
        while x < xmax:
            p = (x + rng.uniform(-.12, .12)*spacing, y + rng.uniform(-.12, .12)*spacing)
            if point_inside(p, outer) and not any(point_inside(p, hole) for hole in holes):
                verts.append(Vector(p))
            x += spacing
        y += spacing
    v2, _, triangles, *_ = delaunay_2d_cdt(verts, edges, [], 0, .00001, False)
    accepted = []
    for tri in triangles:
        center = tuple(sum(v2[i][k] for i in tri)/len(tri) for k in (0, 1))
        if point_inside(center, outer) and not any(point_inside(center, hole) for hole in holes):
            accepted.append(tri)
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(v.x, v.y, height(v.x, v.y)) for v in v2], [], accepted)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj.shape_key_add(name='Basis')
    flex = obj.shape_key_add(name='Gentle flex — art direction')
    for v in flex.data:
        x, y = v.co.x, v.co.y
        v.co.z += .07*math.sin(x*2.3 + .5)*math.cos(y*1.6)
    for frame, value in [(1, 0), (37, .85), (73, .15), (109, .6), (145, 0)]:
        flex.value = value
        flex.keyframe_insert('value', frame=frame)
    solid = obj.modifiers.new('Gel thickness — visual estimate', 'SOLIDIFY')
    solid.thickness = thickness
    solid.offset = 0
    solid.use_even_offset = True
    bevel = obj.modifiers.new('Soft wet edge', 'BEVEL')
    bevel.width = thickness*.38
    bevel.segments = 3
    bevel.limit_method = 'ANGLE'
    subdivision = obj.modifiers.new('Continuous soft surface', 'SUBSURF')
    subdivision.levels = 1
    subdivision.render_levels = 1
    return obj


def face_model(mat):
    a = math.acos(-.04/1.28)
    outer = [(.98*math.sin(t), 1.28*math.cos(t)) for t in [-a + 2*a*i/140 for i in range(141)]]
    outer += [(x, y) for x, y in [(.45,-.04),(.24,-.06),(.18,-.12),(.13,-.29),(.08,-.33),(-.08,-.33),(-.13,-.29),(-.18,-.12),(-.24,-.06),(-.45,-.04)]]
    eyes = [ellipse(-.405, .43, .225, .106, -.06), ellipse(.405, .43, .225, .106, .06)]
    def upper_height(x, y):
        return .13*(1-(x/1.15)**2) + .055*math.cos(y*1.2) + .16*math.exp(-(x/.16)**2-((y+.035)/.31)**2)
    upper = surface('HG-F-02 · upper face and nose flap', outer, eyes, upper_height, mat, .013)
    a = math.acos(-.13/1.28)
    lower_outer = [(.98*math.sin(t), 1.28*math.cos(t)) for t in [a + (2*math.pi-2*a)*i/125 for i in range(126)]]
    lower = surface('HG-F-02 · lower face', lower_outer, [ellipse(0, -.53, .265, .095)],
                    lambda x,y: .12*(1-(x/1.12)**2)+.07*math.cos((y+.4)*2), mat, .012)
    lower.location.y = -.04
    return [upper, lower]


def eye_model(mat):
    # Reference-led broad butterfly cheek wing, not a generic crescent patch.
    wing = closed_spline([(.14,.29),(.38,.31),(.7,.40),(1.07,.64),(1.18,.60),
        (1.15,.38),(.97,.10),(1.00,-.10),(.84,-.34),(.65,-.56),(.39,-.62),(.22,-.48),(.12,-.15)])
    objects = []
    for side in (-1, 1):
        outline = [(side*x, y) for x,y in wing]
        obj = surface('HG-E-01 · ' + ('left' if side < 0 else 'right'), outline, [],
            lambda x,y: .055 + .18*(abs(x)/1.3)**2 + .055*math.sin(y*3 + abs(x)), mat, .018, .047)
        obj.location.x = side*.055
        obj.location.y = .12 if side == 1 else -.13
        obj.rotation_euler.z = side*math.radians(5)
        objects.append(obj)
    return objects


def aim(obj, target):
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat('-Z', 'Y').to_euler()


def area(name, location, target, energy, size, tint, shape='DISK', size_y=None):
    light = bpy.data.lights.new(name, 'AREA')
    light.energy = energy
    light.shape = shape
    light.size = size
    if size_y is not None:
        light.size_y = size_y
    light.color = color(tint)[:3]
    obj = bpy.data.objects.new(name, light)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    aim(obj, target)


def cylinder(name, radius, depth, z, mat, bevel=.045):
    bpy.ops.mesh.primitive_cylinder_add(vertices=160, radius=radius, depth=depth, location=(0,0,z))
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    mod = obj.modifiers.new('Rounded edge', 'BEVEL')
    mod.width, mod.segments = bevel, 4
    obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def stage(kind):
    scene = bpy.context.scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = .1
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = ARGS.samples
    scene.cycles.use_denoising = True
    scene.render.use_persistent_data = True
    scene.cycles.adaptive_threshold = .035
    scene.cycles.max_bounces = 10
    scene.cycles.transmission_bounces = 8
    scene.cycles.transparent_max_bounces = 8
    scene.cycles.sample_clamp_indirect = 3
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'OPTIX'
    prefs.get_devices()
    for device in prefs.devices:
        device.use = device.type == 'OPTIX'
    scene.cycles.device = 'GPU' if any(d.type == 'OPTIX' for d in prefs.devices) else 'CPU'
    scene.render.resolution_x = ARGS.size
    scene.render.resolution_y = round(ARGS.size*.8)
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGB'
    scene.render.film_transparent = False
    scene.render.fps = 24
    scene.frame_start, scene.frame_end = 1, 144
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.view_settings.exposure = .3
    world = bpy.data.worlds.new('Soft studio ambient')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = color('CBD5CD')
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = .32
    scene.world = world
    floor, _ = material('Warm mineral backdrop', 'E3DFD4', .46)
    porcelain, porcelain_shader = material('Sage ceramic display', '8EAAA1', .27)
    porcelain_shader.inputs['Coat Weight'].default_value = .32
    dark, _ = material('Deep botanical green', '254E46', .28)
    copper, _ = material('Brushed champagne rim', 'B59C75', .24, metallic=.72)
    water, _ = material('Clear water accents', 'F2FFFB', .065, transmission=1, ior=1.333)
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0,0,-.18))
    bpy.context.object.name = 'Studio floor'
    bpy.context.object.data.materials.append(floor)
    cylinder('Sculpted display base', 1.64, .24, -.045, porcelain)
    cylinder('Botanical inset', 1.49, .04, .09, dark, .018)
    cylinder('Fine champagne edge', 1.51, .012, .104, copper, .006)
    cylinder('Gloss surface', 1.485, .015, .118, dark, .008)
    rng = random.Random(61)
    for i in range(22):
        angle = rng.uniform(0, math.tau)
        radius = rng.uniform(1.16, 1.41)
        drop_radius = rng.uniform(.015, .037)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, radius=drop_radius,
            location=(math.cos(angle)*radius,math.sin(angle)*radius,.139 + drop_radius*.48))
        drop = bpy.context.object
        drop.name = f'Water accent {i:02d}'
        drop.scale.z = .58
        drop.data.materials.append(water)
        for p in drop.data.polygons:
            p.use_smooth = True
    area('Key · large softbox',(-3.4,-2.7,5.7),(0,0,.3),620,4.3,'FFF0DC')
    area('Rim · cool strip',(2.5,2.1,3.4),(0,0,.5),850,3.2,'DBF5EC','RECTANGLE',.7)
    area('Silk reflection',(-.6,2.3,5.3),(0,0,.5),430,2.3,'FFFFFF','RECTANGLE',1.0)
    area('Front fill',(1,-4,2.4),(0,0,.5),115,2.6,'F8DBD8')
    bpy.ops.object.camera_add(location=(3.4,-5.0,7.4))
    camera = bpy.context.object
    camera.name = 'Camera · product portrait'
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = 4.45 if kind == 'face' else 4.4
    aim(camera,(0,0,.34))
    scene.camera = camera
    return scene, camera


def animate(objects, kind):
    for i,obj in enumerate(objects):
        base_location = obj.location.copy()
        base_location.z += .47 if kind == 'face' else .52
        base_rotation = obj.rotation_euler.copy()
        base_rotation.z += math.radians(-14 if kind == 'face' else 0)
        for frame in range(1,146):
            t = (frame-1)/144*math.tau
            obj.location = base_location + Vector((0, .02*math.sin(t+i), .045*math.sin(t + i*.7)))
            obj.rotation_euler = (base_rotation.x + .065*math.sin(t + i*.5),
                base_rotation.y + .07*math.sin(t*.0 + t + i*.4),base_rotation.z + .06*math.sin(t))
            obj.keyframe_insert('location',frame=frame)
            obj.keyframe_insert('rotation_euler',frame=frame)


def export_gel(objects, path):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=True,
        export_apply=True, export_animations=False, export_extras=True)


def render(scene, path):
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def build(kind):
    product_dir = OUT/kind
    product_dir.mkdir(parents=True,exist_ok=True)
    scene,camera = stage(kind)
    gel = gel_material()
    objects = face_model(gel) if kind == 'face' else eye_model(gel)
    for obj in objects:
        obj['source_format_id'] = 'HG-F-02' if kind == 'face' else 'HG-E-01'
        obj['asset_status'] = 'Reference-led visual study; dimensions and cut lines are not manufacturing specifications.'
        obj['reference'] = 'Company product atlas, slide 8' if kind == 'face' else 'Company product atlas, slide 9'
    animate(objects,kind)
    scene.frame_set(1)
    export_gel(objects,product_dir/'model.glb')
    bpy.ops.wm.save_as_mainfile(filepath=str(product_dir/'hydrogel-study.blend'))
    scene.frame_set(49)
    render(scene,product_dir/'hero.png')
    if not ARGS.draft:
        scene.frame_set(73)
        render(scene,product_dir/'translucent.png')
        camera.location = (1.6,-3.3,4.5) if kind == 'face' else (2.5,-3,4.5)
        camera.data.ortho_scale = 2.75 if kind == 'face' else 2.8
        aim(camera,(.12,.2,.57) if kind == 'face' else (.3,.02,.65))
        scene.frame_set(73)
        render(scene,product_dir/'detail.png')
    if ARGS.animation:
        camera.location = (3.4,-5,7.4)
        camera.data.ortho_scale = 4.45 if kind == 'face' else 4.4
        aim(camera,(0,0,.34))
        scene.render.resolution_x,scene.render.resolution_y = 960,768
        scene.cycles.samples = 20
        scene.cycles.adaptive_threshold = .065
        frames_dir = product_dir/'frames'
        frames_dir.mkdir(exist_ok=True)
        for frame in range(1,ARGS.frames+1):
            scene.frame_set(round((frame-1)*144/ARGS.frames)+1)
            render(scene,frames_dir/f'{frame:04d}.png')
    manifest = {'format': objects[0]['source_format_id'], 'kind':kind, 'engine':'Blender '+bpy.app.version_string+' / Cycles',
        'device':scene.cycles.device,'mesh_parts':len(objects),'reference_weight':'23 g / piece' if kind=='face' else '8 g / pair',
        'geometry':'Reference-led procedural reconstruction', 'dimensions':'Visual approximation; not measured from engineering drawings',
        'animation':'Art-directed flex and optical material transition, not dissolution or efficacy timing',
        'outputs':['hydrogel-study.blend','model.glb','hero.png'] + ([] if ARGS.draft else ['translucent.png','detail.png'])}
    (product_dir/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False),encoding='utf-8')
    print('SAMPLE_COMPLETE',kind,flush=True)


if __name__ == '__main__':
    for kind in (['face','eye'] if ARGS.product=='both' else [ARGS.product]):
        build(kind)
