"""Package the two approved V2 samples as separate scenes in one review file."""
import sys
from pathlib import Path

import bpy

root=Path(sys.argv[sys.argv.index('--')+1]).resolve()
bpy.ops.wm.open_mainfile(filepath=str(root/'face/hydrogel-study.blend'))
face=bpy.context.scene
face.name='01 - HG-F-02 - Face mask'
with bpy.data.libraries.load(str(root/'eye/hydrogel-study.blend'),link=False) as (source,target):
    target.scenes=source.scenes
eye=target.scenes[0]
eye.name='02 - HG-E-01 - Butterfly eye mask'

for scene in [face,eye]:
    scene.frame_set(1)
    scene.render.resolution_x=1500
    scene.render.resolution_y=1200
    scene.render.resolution_percentage=100
    scene.cycles.samples=128
    scene.cycles.preview_samples=16
    # CPU remains usable on a clean Blender user profile; the UI can select GPU.
    scene.cycles.device='CPU'
    scene.render.filepath=str(root/('face' if scene==face else 'eye')/'blender-live-render.png')

bpy.context.window.scene=eye
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_perspective='CAMERA'
            area.spaces.active.region_3d.view_camera_zoom=0
            area.spaces.active.overlay.show_overlays=False
            area.spaces.active.shading.type='SOLID'
        elif area.type=='PROPERTIES':
            area.spaces.active.context='RENDER'

notes=bpy.data.texts.new('START HERE - two hydrogel scenes')
notes.write('GUANGTUO / V2 review\n\nUse the Scene selector at the top-right to switch the face mask and butterfly eye mask.\nF12: render the current scene. F11: show/hide the render result.\nNumpad 0: camera view. Middle mouse: orbit. Space: play the gentle flex timeline.\n\nThe actual meshes, modifiers, gel shader, lights and cameras are editable.\nReference shapes and thickness remain visual approximations.\n')
destination=root/'Guangtuo-Hydrogel-V2-Review.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(destination))
print('REVIEW_READY',destination,flush=True)
