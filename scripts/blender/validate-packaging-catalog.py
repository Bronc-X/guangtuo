"""Validate every brochure variant's editable scene, GLB and preview image.

This checks deliverable integrity and size budgets, not visual fidelity.
"""

from __future__ import annotations

import json
import struct
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA = json.loads((ROOT / 'docs/packaging-brochure-variants.json').read_text(encoding='utf-8'))
EDITABLE_SOURCES = ROOT / 'models/packaging-source'
MODELS = ROOT / 'public/models/packaging'
POSTERS = ROOT / 'public/assets/packaging'


def inspect_glb(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    if len(data) < 20 or data[:4] != b'glTF':
        raise ValueError('invalid GLB header')
    total_size = struct.unpack_from('<I', data, 8)[0]
    if total_size != len(data):
        raise ValueError('GLB byte count differs from header')
    json_size, chunk_type = struct.unpack_from('<II', data, 12)
    if chunk_type != 0x4E4F534A:
        raise ValueError('missing JSON chunk')
    gltf = json.loads(data[20:20 + json_size])
    if gltf.get('asset', {}).get('version') != '2.0':
        raise ValueError('not glTF 2.0')
    mesh_count = len(gltf.get('meshes', []))
    triangles = 0
    for mesh in gltf.get('meshes', []):
        for primitive in mesh.get('primitives', []):
            accessor = primitive.get('indices', primitive.get('attributes', {}).get('POSITION'))
            if accessor is None:
                continue
            triangles += gltf['accessors'][accessor]['count'] // 3
    return mesh_count, triangles


issues = []
largest = []
for item in DATA['variants']:
    name = item['id']
    glb = MODELS / f'{name.lower()}.glb'
    blend = EDITABLE_SOURCES / f'{name}.blend'
    poster = POSTERS / f'{name.lower()}.png'
    if not glb.is_file() or not blend.is_file() or not poster.is_file():
        issues.append(f"{name}: missing " + ', '.join(label for label, path in [('GLB', glb), ('blend', blend), ('poster', poster)] if not path.is_file()))
        continue
    try:
        meshes, triangles = inspect_glb(glb)
    except (ValueError, KeyError, json.JSONDecodeError) as error:
        issues.append(f'{name}: {error}')
        continue
    if meshes < 2:
        issues.append(f'{name}: only {meshes} mesh; body and closure should be separate')
    if glb.stat().st_size > 5_000_000:
        issues.append(f'{name}: GLB exceeds 5 MB')
    if triangles > 100_000:
        issues.append(f'{name}: {triangles} triangles exceed the target')
    largest.append((glb.stat().st_size, name, meshes, triangles))

print(f"{len(largest)}/{DATA['variantCount']} complete model sets")
for size, name, meshes, triangles in sorted(largest, reverse=True)[:8]:
    print(f'{name}: {size / 1_000_000:.2f} MB, {meshes} meshes, {triangles} triangles')
if issues:
    print('ISSUES:')
    for issue in issues:
        print('-', issue)
    raise SystemExit(1)
