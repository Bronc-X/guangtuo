"""Render six-second loops from the editable sample .blend files."""
import argparse
import json
import sys
import time
from pathlib import Path

import bpy

parser = argparse.ArgumentParser()
parser.add_argument('--output', required=True)
parser.add_argument('--product', choices=['face', 'eye', 'both'], default='both')
args = parser.parse_args(sys.argv[sys.argv.index('--')+1:])
root = Path(args.output).resolve()
for kind in ['face', 'eye'] if args.product == 'both' else [args.product]:
    started = time.monotonic()
    folder = root/kind
    bpy.ops.wm.open_mainfile(filepath=str(folder/'hydrogel-study.blend'))
    scene = bpy.context.scene
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'OPTIX'
    prefs.get_devices()
    for device in prefs.devices:
        device.use = device.type == 'OPTIX'
    scene.cycles.device = 'GPU'
    scene.cycles.samples = 20
    scene.cycles.adaptive_threshold = .055
    scene.render.resolution_x, scene.render.resolution_y = 960, 768
    scene.render.use_persistent_data = True
    frames = folder/'frames'
    frames.mkdir(exist_ok=True)
    for frame in range(1,145):
        scene.frame_set(frame)
        scene.render.filepath = str(frames/f'{frame:04d}.png')
        bpy.ops.render.render(write_still=True)
        if frame % 24 == 0:
            print(f'LOOP_PROGRESS {kind} {frame}/144 elapsed={time.monotonic()-started:.1f}s',flush=True)
    (folder/'loop-render.json').write_text(json.dumps({'frames':144,'fps':24,'width':960,'height':768,
        'engine':'Cycles','device':'OPTIX','samples':20,'seconds':round(time.monotonic()-started,2)},indent=2),encoding='utf-8')
    print('LOOP_COMPLETE',kind,flush=True)
