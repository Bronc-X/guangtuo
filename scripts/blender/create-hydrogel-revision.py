"""Second art direction: soft hydrogel, reference contours, neutral studio."""
import importlib.util
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector

spec = importlib.util.spec_from_file_location('gel_base', Path(__file__).with_name('create-hydrogel-samples.py'))
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
args = base.ARGS


def gel_material():
    mat, shader = base.material('Hydrated gel / soft pearl', 'F7FAF7', .055, transmission=1, ior=1.333)
    shader.inputs['Coat Weight'].default_value = .12
    shader.inputs['Coat Roughness'].default_value = .16
    shader.inputs['Subsurface Weight'].default_value = .015
    shader.inputs['Subsurface Scale'].default_value = .05
    volume = mat.node_tree.nodes.new('ShaderNodeVolumeScatter')
    volume.inputs['Color'].default_value = base.color('F3F4F1')
    volume.inputs['Density'].default_value = 18
    volume.inputs['Anisotropy'].default_value = .2
    mat.node_tree.links.new(volume.outputs[0], mat.node_tree.nodes.get('Material Output').inputs['Volume'])
    noise=mat.node_tree.nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value=32
    noise.inputs['Detail'].default_value=2
    bump=mat.node_tree.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value=.10
    bump.inputs['Distance'].default_value=.0035
    mat.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height'])
    mat.node_tree.links.new(bump.outputs[0],shader.inputs['Normal'])
    return mat


def skin_height(x, y):
    cheek = .10*math.exp(-((abs(x)-.44)/.33)**2-((y-.10)/.46)**2)
    nose = .23*math.exp(-(x/.16)**2-((y+.10)/.32)**2)
    drape = -.38*(abs(x)/.95)**2 + .08*math.sin(y*2.1+.5)
    edge = .05*math.sin(x*4.6+y*1.9)*(abs(x)/.94)**3
    return cheek+nose+drape+edge+.004*math.sin(x*13+y*3)*math.cos(y*9)


def face_model(mat):
    upper = base.closed_spline([(-.87,-.035),(-.945,.30),(-.91,.66),(-.77,.99),(-.44,1.17),(0,1.23),(.44,1.17),(.77,.99),(.91,.66),(.945,.30),(.87,-.035),(.48,-.04),(.24,-.025),(.17,-.075),(.14,-.22),(.08,-.265),(0,-.28),(-.08,-.265),(-.14,-.22),(-.17,-.075),(-.24,-.025),(-.48,-.04)], 8)
    eyes = [base.ellipse(-.395,.47,.216,.103,-.07),base.ellipse(.395,.47,.216,.103,.07)]
    a = base.surface('HG-F-02 / brow, cheeks and nose',upper,eyes,skin_height,mat,.037,.042)
    lower = base.closed_spline([(-.875,-.14),(-.45,-.145),(-.23,-.145),(-.17,-.33),(0,-.38),(.17,-.33),(.23,-.145),(.45,-.145),(.875,-.14),(.85,-.39),(.71,-.73),(.48,-.98),(.20,-1.10),(0,-1.12),(-.20,-1.10),(-.48,-.98),(-.71,-.73),(-.85,-.39)],8)
    mouth = base.ellipse(0,-.565,.245,.105)
    b = base.surface('HG-F-02 / jaw and mouth',lower,[mouth],skin_height,mat,.037,.042)
    for obj in [a,b]:
        obj.location = (0,0,.6)
        obj.rotation_euler = (math.radians(12),math.radians(-7),math.radians(-17))
    return [a,b]


def eye_model(mat):
    # Trace the visible cheek contour in the supplied 509 x 473 atlas crop.
    pixels = [(141,131),(172,112),(219,123),(268,115),(327,82),(375,31),(422,4),(450,30),(452,77),(440,108),(441,144),(431,171),(404,183),(391,180),(377,219),(353,251),(315,276),(293,292),(292,360),(278,412),(247,453),(208,473),(169,465),(179,421),(164,374),(140,340),(137,313),(159,282),(150,247),(138,208),(131,168)]
    contour = base.closed_spline([((x-285)/240,(238-y)/240) for x,y in pixels],7)
    parts=[]
    for i,side in enumerate([-1,1]):
        outline=[(x*side,y) for x,y in contour]
        def height(x,y):
            curl = .57*(max(0,y+.15)/1.15)**2
            fold = .15*math.sin(x*3.1+y*1.7)+.035*math.cos(y*4.8)
            return .19+curl+fold
        obj=base.surface('HG-E-01 / '+('left cheek' if side<0 else 'right cheek'),outline,[],height,mat,.042,.033)
        obj.location=(side*.81,.20 if i else -.20,.05 if i else 0)
        obj.rotation_euler=(math.radians(9 if i else -7),math.radians(-16 if i else 10),math.radians(-16 if i else 13))
        parts.append(obj)
    return parts


def studio(kind):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene
    scene.render.engine='CYCLES'
    scene.cycles.samples=args.samples
    scene.cycles.use_denoising=True
    scene.cycles.adaptive_threshold=.018
    scene.cycles.max_bounces=12
    scene.cycles.transmission_bounces=10
    scene.cycles.volume_bounces=3
    scene.render.use_persistent_data=True
    prefs=bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type='OPTIX'
    prefs.get_devices()
    for d in prefs.devices:d.use=d.type=='OPTIX'
    scene.cycles.device='GPU' if any(d.type=='OPTIX' for d in prefs.devices) else 'CPU'
    scene.render.resolution_x=args.size
    scene.render.resolution_y=round(args.size*.8)
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'
    scene.render.image_settings.color_mode='RGB'
    scene.render.fps=24
    scene.frame_start,scene.frame_end=1,144
    scene.view_settings.view_transform='AgX'
    scene.view_settings.look='AgX - Medium High Contrast'
    scene.view_settings.exposure=0
    world=bpy.data.worlds.new('Neutral photographic studio')
    world.use_nodes=True
    world.node_tree.nodes['Background'].inputs['Color'].default_value=base.color('E7DED3')
    world.node_tree.nodes['Background'].inputs['Strength'].default_value=.13
    scene.world=world
    floor,_=base.material('Seamless botanical backdrop','405C52',.42)
    bpy.ops.mesh.primitive_plane_add(size=200)
    bpy.context.object.name='Seamless backdrop'
    bpy.context.object.data.materials.append(floor)
    base.area('Long window / edge reflection',(-3,-.2,5),(0,0,.7),470,3.8,'FFFFFF','RECTANGLE',.65)
    base.area('Backlit diffusion',(1,3.2,4),(0,0,1),720,3,'FFF9F0','RECTANGLE',2)
    base.area('Soft front',(0,-4.5,2.8),(0,0,1),125,3,'FFFFFF','RECTANGLE',4)
    # Broad negative fill keeps a readable edge in the translucent material.
    black,_=base.material('Off-camera negative fill','101B1B',.9)
    bpy.ops.mesh.primitive_plane_add(size=2,location=(3,.3,2))
    flag=bpy.context.object
    flag.name='Black reflection card'
    flag.scale=(1.5,2.8,1)
    flag.rotation_euler=(0,math.pi/2,0)
    flag.data.materials.append(black)
    flag.visible_camera=False
    bpy.ops.object.camera_add(location=(1.5,-4.8,6.8) if kind=='face' else (2.1,-3.8,6.5))
    camera=bpy.context.object
    camera.name='Portrait camera'
    camera.data.type='ORTHO'
    camera.data.ortho_scale=3.50 if kind=='face' else 3.95
    target=(0,0,.35) if kind=='face' else (0,.07,.28)
    base.aim(camera,target)
    scene.camera=camera
    return scene,camera,target


def build(kind):
    folder=base.OUT/kind
    folder.mkdir(parents=True,exist_ok=True)
    scene,camera,target=studio(kind)
    mat=gel_material()
    objects=face_model(mat) if kind=='face' else eye_model(mat)
    for obj in objects:
        obj['source_format_id']='HG-F-02' if kind=='face' else 'HG-E-01'
        obj['asset_status']='Visual approximation based on company atlas; not manufacturing geometry.'
        obj['reference']='Company atlas slide 8' if kind=='face' else 'Company atlas slide 9'
        flex=obj.data.shape_keys.key_blocks[1]
        flex.id_data.animation_data_clear()
        for frame,value in [(1,.22),(37,.6),(73,.22),(109,0),(145,.22)]:
            flex.value=value
            flex.keyframe_insert('value',frame=frame)
    scene.frame_set(1)
    if kind in ['face','eye']:
        depsgraph=bpy.context.evaluated_depsgraph_get()
        minima=[]
        for obj in objects:
            evaluated=obj.evaluated_get(depsgraph)
            mesh=evaluated.to_mesh()
            minimum=min((obj.matrix_world@v.co).z for v in mesh.vertices)
            evaluated.to_mesh_clear()
            minima.append(minimum)
        for obj,minimum in zip(objects,minima):
            obj.location.z+=.045-(min(minima) if kind=='face' else minimum)
        bpy.context.view_layer.update()
    base.export_gel(objects,folder/'model.glb')
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/'hydrogel-study.blend'))
    base.render(scene,folder/'hero.png')
    if not args.draft:
        mat.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.08
        mat.node_tree.nodes.get('Volume Scatter').inputs['Density'].default_value=2.0
        base.render(scene,folder/'translucent.png')
        camera.data.ortho_scale=2.20 if kind=='face' else 2.60
        base.aim(camera,(.08,0,1.5) if kind=='face' else (.15,.10,.3))
        base.render(scene,folder/'detail.png')
    (folder/'manifest.json').write_text(json.dumps({'format':'HG-F-02' if kind=='face' else 'HG-E-01','revision':2,'engine':bpy.app.version_string+' / Cycles','parts':2,'source':'Company product atlas, slide '+('8' if kind=='face' else '9'),'geometry':'Reference-led visual approximation, not measured manufacturing dimensions','animation':'Gentle flex of a stable material; no dissolution or timed efficacy claim'},ensure_ascii=False,indent=2),encoding='utf-8')
    print('REVISION_COMPLETE',kind,flush=True)


for kind in ['face','eye'] if args.product=='both' else [args.product]:
    build(kind)
