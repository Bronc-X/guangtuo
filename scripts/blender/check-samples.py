"""Check evaluated sample geometry and loop endpoints without rendering."""
import json
import sys
from pathlib import Path

import bmesh
import bpy

root = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
report = {}
for kind in ['face', 'eye']:
    bpy.ops.wm.open_mainfile(filepath=str(root/kind/'hydrogel-study.blend'))
    scene = bpy.context.scene
    objects = [obj for obj in scene.objects if obj.get('source_format_id')]
    assert len(objects) == 2, f'{kind}: expected two product parts'
    scene.frame_set(1)
    initial = {obj.name: obj.matrix_world.copy() for obj in objects}
    checks = []
    for obj in objects:
        evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh = evaluated.to_mesh()
        bm = bmesh.new()
        bm.from_mesh(mesh)
        item = {
            'name': obj.name,
            'vertices': len(bm.verts),
            'faces': len(bm.faces),
            'boundary_edges': sum(edge.is_boundary for edge in bm.edges),
            'non_manifold_edges': sum(not edge.is_manifold for edge in bm.edges),
            'degenerate_faces': sum(face.calc_area() < 1e-12 for face in bm.faces),
            'volume_scene_units': abs(bm.calc_volume()),
        }
        assert item['boundary_edges'] == 0, item
        assert item['non_manifold_edges'] == 0, item
        assert item['degenerate_faces'] == 0, item
        assert item['volume_scene_units'] > 0, item
        checks.append(item)
        bm.free()
        evaluated.to_mesh_clear()
    scene.frame_set(145)
    loop_error = max(abs(obj.matrix_world[i][j] - initial[obj.name][i][j])
                     for obj in objects for i in range(4) for j in range(4))
    assert loop_error < 1e-5, f'{kind}: transform loop endpoints differ: {loop_error}'
    report[kind] = {'parts': checks, 'loop_transform_error': loop_error}
    print('GEOMETRY_CHECK_PASS', kind, flush=True)
(root/'geometry-check.json').write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
