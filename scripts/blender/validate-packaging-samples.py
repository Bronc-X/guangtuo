"""Re-import the four sample families and their size variants."""

from pathlib import Path
from math import hypot

import bpy
from mathutils import Vector


root = Path(__file__).resolve().parents[2] / 'public/models/packaging'
body_heights = {}
for sku in ('HD-1267', 'HD-1167', 'HD-1168', 'HD-1169', 'HD-1170',
            'HD-1159', 'HD-1160', 'HD-1161', 'HD-1162', 'HD-843',
            'HD-844', 'HD-845', 'HD-846', 'HD-847'):
    path = root / f'{sku.lower()}.glb'
    if not path.exists() or path.stat().st_size > 5_000_000:
        raise RuntimeError(f'{sku}: missing or above 5 MB')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(path))
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    triangle_count = sum(sum(len(face.vertices) - 2 for face in obj.data.polygons) for obj in meshes)
    roles = {obj.get('role') for obj in meshes if obj.get('role')}
    editable = {'chamber-a', 'chamber-b'} if sku in ('HD-844', 'HD-845', 'HD-846', 'HD-847') else {'body'}
    if not meshes or triangle_count > 100_000 or not {'label', *editable} <= roles:
        raise RuntimeError(f'{sku}: invalid geometry or editable parts: {triangle_count} triangles, {roles}')
    body_name = 'PET body' if sku in ('HD-1267', 'HD-1167', 'HD-1168', 'HD-1169', 'HD-1170') else 'Transparent dual chamber casing' if sku in ('HD-844', 'HD-845', 'HD-846', 'HD-847') else None
    if body_name:
        body = bpy.data.objects[body_name]
        corners = [body.matrix_world @ Vector(corner) for corner in body.bound_box]
        body_heights[sku] = max(point.z for point in corners) - min(point.z for point in corners)
    if sku in ('HD-1267', 'HD-1167', 'HD-1168', 'HD-1169', 'HD-1170'):
        cap = bpy.data.objects['Clear protective cap']
        nozzle = bpy.data.objects['Lateral dispenser spout']
        cap_corners = [cap.matrix_world @ Vector(corner) for corner in cap.bound_box]
        nozzle_corners = [nozzle.matrix_world @ Vector(corner) for corner in nozzle.bound_box]
        cap_x = (max(point.x for point in cap_corners) + min(point.x for point in cap_corners)) / 2
        cap_y = (max(point.y for point in cap_corners) + min(point.y for point in cap_corners)) / 2
        cap_radius = (max(point.x for point in cap_corners) - min(point.x for point in cap_corners)) / 2
        nozzle_radius = max(hypot(point.x - cap_x, point.y - cap_y) for point in nozzle_corners)
        if nozzle_radius > cap_radius - .04 or max(point.z for point in nozzle_corners) > max(point.z for point in cap_corners) - .04:
            raise RuntimeError(f'{sku}: dispenser protrudes through protective cap ({nozzle_radius:.3f} > {cap_radius - .04:.3f})')
    print(f'{sku}: {len(meshes)} mesh parts, {triangle_count} triangles, {path.stat().st_size} bytes, roles={sorted(roles)}', flush=True)

for series in (('HD-1267', 'HD-1167', 'HD-1168', 'HD-1169', 'HD-1170'), ('HD-844', 'HD-845', 'HD-846', 'HD-847')):
    if not all(body_heights[a] > body_heights[b] for a, b in zip(series, series[1:])):
        raise RuntimeError(f'{series[0]}: model body heights do not follow printed capacities')
