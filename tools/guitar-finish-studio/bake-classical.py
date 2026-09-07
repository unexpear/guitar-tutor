"""Bake the approved Classical source into a local, static material-review GLB.

Blender --background --factory-startup --disable-autoexec --python-exit-code 1
--python bake-classical.py -- SOURCE OUT.glb [ATLAS_SIZE]
No source blend is saved. Geometry selection/hash checks reuse the review exporter.
"""
import bpy
import sys
import runpy
import json
from pathlib import Path

args=sys.argv[sys.argv.index('--')+1:]
source,destination=args[:2]
size=int(args[2]) if len(args)>2 else 1024
if size not in (512,1024,2048): raise ValueError('Atlas size must be 512, 1024 or 2048')
out=Path(destination).resolve()
if out.suffix.lower()!='.glb': raise ValueError('Output must be a GLB')
sys.argv=['blender','--',source,str(out.with_name('classical-geometry.glb')),'classical','80000']
context=runpy.run_path(str(Path(__file__).with_name('export-review-mesh.py')))
meshes=context['meshes']
for obj in bpy.context.view_layer.objects:
    obj.select_set(False)
    if obj not in meshes: obj.hide_render=True
materials=set()
for obj in meshes:
    obj.select_set(True)
    if not obj.data.materials:
        mat=bpy.data.materials.new('Unbranded nylon');mat.use_nodes=True
        mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.65,.58,.44,1)
        obj.data.materials.append(mat)
    old_uv=obj.data.uv_layers.active
    # Pin implicit source UV references before selecting a separate bake atlas.
    for mat in obj.data.materials:
        if not mat or not mat.use_nodes: raise RuntimeError(f'Unsupported source material on {obj.name}')
        materials.add(mat)
        if old_uv:
            for node in list(mat.node_tree.nodes):
                if node.type=='UVMAP' and not node.uv_map: node.uv_map=old_uv.name
                if node.type=='TEX_COORD':
                    for link in list(node.outputs['UV'].links):
                        uvnode=mat.node_tree.nodes.new('ShaderNodeUVMap');uvnode.uv_map=old_uv.name
                        mat.node_tree.links.new(uvnode.outputs['UV'],link.to_socket)
    atlas=obj.data.uv_layers.new(name='BakeUV')
    obj.data.uv_layers.active=atlas
bpy.context.view_layer.objects.active=meshes[0]
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=1.15192,island_margin=.01,correct_aspect=True,scale_to_bounds=True)
bpy.ops.object.mode_set(mode='OBJECT')

scene=bpy.context.scene;scene.render.engine='CYCLES'
scene.cycles.device='CPU';scene.cycles.samples=8
scene.world=None
sources={}
for mat in materials:
    nodes=mat.node_tree.nodes
    output=next(n for n in nodes if n.type=='OUTPUT_MATERIAL' and n.is_active_output)
    link=output.inputs['Surface'].links[0]
    bsdf=link.from_node
    if bsdf.type!='BSDF_PRINCIPLED': raise RuntimeError(f'Unsupported shader: {mat.name}')
    target=nodes.new('ShaderNodeTexImage');target.name='Bake target';nodes.active=target
    emission=nodes.new('ShaderNodeEmission')
    sources[mat]=(output,bsdf,target,emission)

images={}
for channel,socket_name in [('color','Base Color'),('roughness','Roughness'),('metallic','Metallic'),('normal',None)]:
    image=bpy.data.images.new('Classical '+channel,width=size,height=size,alpha=False)
    image.colorspace_settings.name='sRGB' if channel=='color' else 'Non-Color'
    for mat,(output,bsdf,target,emission) in sources.items():
        target.image=image;mat.node_tree.nodes.active=target
        if socket_name:
            for link in list(emission.inputs['Color'].links): mat.node_tree.links.remove(link)
            socket=bsdf.inputs[socket_name]
            if socket.is_linked: mat.node_tree.links.new(socket.links[0].from_socket,emission.inputs['Color'])
            else:
                value=socket.default_value
                emission.inputs['Color'].default_value=tuple(value) if socket_name=='Base Color' else (value,value,value,1)
            mat.node_tree.links.new(emission.outputs[0],output.inputs['Surface'])
        else: mat.node_tree.links.new(bsdf.outputs[0],output.inputs['Surface'])
    print('BAKING',channel,flush=True)
    bpy.ops.object.bake(type='NORMAL' if channel=='normal' else 'EMIT',
        use_clear=True,margin=8,uv_layer='BakeUV',normal_space='TANGENT')
    image.filepath_raw=str(out.with_name('classical-'+channel+'.png'))
    image.file_format='PNG';image.save();image.pack()
    images[channel]=image

for mat,(output,source_bsdf,target,emission) in sources.items():
    # Preserve untextured scalar optical properties; replace only baked channels.
    scalar={name:source_bsdf.inputs[name].default_value for name in
            ('IOR','Coat Weight','Coat Roughness','Specular IOR Level')}
    mat.node_tree.nodes.clear();nodes=mat.node_tree.nodes;links=mat.node_tree.links
    output=nodes.new('ShaderNodeOutputMaterial');bsdf=nodes.new('ShaderNodeBsdfPrincipled')
    links.new(bsdf.outputs[0],output.inputs['Surface'])
    for name,value in scalar.items(): bsdf.inputs[name].default_value=value
    uv=nodes.new('ShaderNodeUVMap');uv.uv_map='BakeUV'
    for channel,socket in [('color','Base Color'),('roughness','Roughness'),('metallic','Metallic'),('normal','Normal')]:
        tex=nodes.new('ShaderNodeTexImage');tex.image=images[channel]
        links.new(uv.outputs[0],tex.inputs['Vector'])
        if channel=='normal':
            normal=nodes.new('ShaderNodeNormalMap');normal.uv_map='BakeUV'
            links.new(tex.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs[0],bsdf.inputs[socket])
        else: links.new(tex.outputs['Color'],bsdf.inputs[socket])
for obj in meshes:
    for name in [uv.name for uv in obj.data.uv_layers if uv.name!='BakeUV']:
        obj.data.uv_layers.remove(obj.data.uv_layers[name])
    obj.data.uv_layers.active_index=0;obj.data.uv_layers[0].active_render=True
camera=scene.camera
if camera: camera.select_set(True)
for i,name in enumerate(['4','5','6','3','2','1']):
    obj=next(o for o in meshes if o.name==name)
    obj.name=f'String_{i+1}'
bpy.ops.export_scene.gltf(filepath=str(out),use_selection=True,export_format='GLB',
    export_materials='EXPORT',export_animations=False,export_skins=False,
    export_morph=False,export_cameras=True,export_lights=False,export_texcoords=True,
    export_normals=True,export_tangents=True,
    export_copyright='Classical guitar by Centurion_1705541, CC0; local material conversion candidate')
repair=runpy.run_path(str(Path(__file__).with_name('repair-zero-tangents.py')))['repair']
fallbacks=repair(out)
out.with_suffix('.json').write_text(json.dumps(dict(sourceKind='classical',atlasSize=size,
    channels=list(images),triangles=context['after'],meshes=len(meshes),
    runtimeReady=False,stringTargets=[f'String_{i+1}' for i in range(6)],tangentFallbacks=fallbacks,limitations=['Material parity and atlas detail need visual review',
    'Coat-normal detail and linked specular/coat inputs are not baked',
    'Highlight readability and Android testing pending']),indent=2),encoding='utf-8')
print('MATERIAL_REVIEW_EXPORT',out,flush=True)
