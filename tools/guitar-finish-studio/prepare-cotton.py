"""Convert approved legacy Cotton Candy materials for local PBR review only."""
import bpy
import sys
import runpy
import json
import struct
from pathlib import Path
from mathutils import Vector

source,destination=sys.argv[sys.argv.index('--')+1:]
out=Path(destination).resolve()
if out.suffix.lower()!='.glb': raise ValueError('Expected GLB output')
sys.argv=['blender','--',source,str(out.with_name('cotton-geometry.glb')),'cotton','100000']
context=runpy.run_path(str(Path(__file__).with_name('export-review-mesh.py')))
meshes=context['meshes']
# Static hardware can share one draw call. Preserve all world transforms before
# removing parent relationships; do not join the body, strings or textured parts.
def bounds(objects):
    points=[o.matrix_world@Vector(c) for o in objects for c in o.bound_box]
    return [min(p[i] for p in points) for i in range(3)]+[max(p[i] for p in points) for i in range(3)]
before_bounds=bounds(meshes)
for obj in meshes:
    world=obj.matrix_world.copy();obj.parent=None;obj.matrix_world=world
chrome=[o for o in meshes if len(o.data.materials)==1 and o.data.materials[0] and o.data.materials[0].name=='Chrome']
if len(chrome)>1:
    for obj in bpy.context.view_layer.objects: obj.select_set(False)
    for obj in chrome: obj.select_set(True)
    keeper=chrome[0];bpy.context.view_layer.objects.active=keeper
    other=[o for o in meshes if o not in chrome]
    bpy.ops.object.join();keeper.name='Cotton_Chrome_Hardware'
    meshes=other+[keeper]
bpy.context.view_layer.update()
if sum(context['count'](o) for o in meshes)!=context['after']: raise RuntimeError('Hardware join changed triangle count')
if max(abs(a-b) for a,b in zip(before_bounds,bounds(meshes)))>1e-5: raise RuntimeError('Hardware join changed bounds')
strings=next(o for o in meshes if o.name=='Strings_01')
for obj in bpy.context.view_layer.objects: obj.select_set(False)
strings.select_set(True);bpy.context.view_layer.objects.active=strings
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.separate(type='LOOSE');bpy.ops.object.mode_set(mode='OBJECT')
parts=list(bpy.context.selected_objects)
if len(parts)!=6: raise RuntimeError(f'Expected six string components, found {len(parts)}')
# At mid-neck (source world Z 0.8), X increases from bass to treble.
def string_x(obj):
    points=[obj.matrix_world@v.co for v in obj.data.vertices]
    mid=[]
    for edge in obj.data.edges:
        a,b=(points[i] for i in edge.vertices)
        if min(a.z,b.z)<=.8<=max(a.z,b.z) and abs(b.z-a.z)>1e-8:
            mid.append(a.x+(b.x-a.x)*(.8-a.z)/(b.z-a.z))
    if not mid: raise RuntimeError('String does not cross the audited neck region')
    return sum(mid)/len(mid)
parts.sort(key=string_x)
for i,obj in enumerate(parts): obj.name=f'String_{i+1}'
meshes=[o for o in meshes if o!=strings]+parts
if sum(context['count'](o) for o in meshes)!=context['after']: raise RuntimeError('String separation changed triangles')
for obj in bpy.context.view_layer.objects: obj.select_set(False)
for obj in meshes: obj.select_set(True)
if bpy.context.scene.camera: bpy.context.scene.camera.select_set(True)
used={m for obj in meshes for m in obj.data.materials if m}
image_sources={
    'Wood':'Wood_Maple_01_2K.JPG','Wood.001':'Wood_Maple_01_2K.JPG.001',
    'Knob_Tone':'Knob_Tone_01_Diff_512.jpg','Knob_Volume':'Knob_Volume_01_Diff_512.jpg',
    'Abalone':'Abalone_01_Diff_512.jpg','Strings':'String_01_Diff_256.jpg',
}
converted=[]
for mat in sorted(used,key=lambda m:m.name):
    color=tuple(mat.diffuse_color)
    mat.use_nodes=True;mat.node_tree.nodes.clear()
    nodes=mat.node_tree.nodes;links=mat.node_tree.links
    output=nodes.new('ShaderNodeOutputMaterial');bsdf=nodes.new('ShaderNodeBsdfPrincipled')
    links.new(bsdf.outputs[0],output.inputs['Surface'])
    bsdf.inputs['Base Color'].default_value=color
    bsdf.inputs['Roughness'].default_value=.35
    if mat.name in {'Chrome','Aluminum','Foil','Strings'}:
        bsdf.inputs['Metallic'].default_value=1
        bsdf.inputs['Roughness'].default_value=.18 if mat.name=='Chrome' else .32
    elif mat.name=='Glossy_Iridescent':
        # New cyan lacquer approximation; do not bake a matcap into base color.
        bsdf.inputs['Base Color'].default_value=(.012,.48,.62,1)
        bsdf.inputs['Roughness'].default_value=.22
        bsdf.inputs['Coat Weight'].default_value=1
        bsdf.inputs['Coat Roughness'].default_value=.12
    elif mat.name.startswith('Glossy_'):
        bsdf.inputs['Coat Weight'].default_value=.6
        bsdf.inputs['Roughness'].default_value=.25
    elif mat.name.startswith('Wood'):
        bsdf.inputs['Roughness'].default_value=.38
        bsdf.inputs['Coat Weight'].default_value=.35
    elif mat.name.startswith('Wire') or mat.name=='Rubber_Black':
        bsdf.inputs['Roughness'].default_value=.75
    image_name=image_sources.get(mat.name)
    if image_name:
        image=bpy.data.images.get(image_name)
        if not image or not image.packed_file: raise RuntimeError(f'Missing packed image {image_name}')
        if max(image.size)>1024:
            ratio=1024/max(image.size);image.scale(round(image.size[0]*ratio),round(image.size[1]*ratio))
            image.filepath_raw=str(out.with_name('cotton-'+mat.name.replace('.','-')+'.png'))
            image.file_format='PNG';image.save();image.pack()
        image.colorspace_settings.name='sRGB'
        tex=nodes.new('ShaderNodeTexImage');tex.image=image
        uv=nodes.new('ShaderNodeUVMap');uv.uv_map='UVMap'
        links.new(uv.outputs[0],tex.inputs['Vector']);links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
    converted.append(dict(material=mat.name,colorImage=image_name))
bpy.ops.export_scene.gltf(filepath=str(out),use_selection=True,export_format='GLB',
    export_materials='EXPORT',export_animations=False,export_skins=False,export_morph=False,
    export_cameras=True,export_lights=False,export_texcoords=True,export_normals=True,
    export_copyright='Cotton Candy by EvanG3D, CC0; local PBR reconstruction candidate')
# Blender 4.3's Principled export does not expose this thin-film coating.
# Add the standard extension without changing any mesh or embedded image bytes.
# https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_iridescence
blob=out.read_bytes();json_size=struct.unpack_from('<I',blob,12)[0]
gltf=json.loads(blob[20:20+json_size])
body_materials=[m for m in gltf['materials'] if m.get('name')=='Glossy_Iridescent']
if len(body_materials)!=1: raise RuntimeError('Expected exactly one Cotton Candy body material')
coating=dict(iridescenceFactor=.85,iridescenceIor=1.3,
             iridescenceThicknessMinimum=380,iridescenceThicknessMaximum=380)
body_materials[0].setdefault('extensions',{})['KHR_materials_iridescence']=coating
used_extensions=gltf.setdefault('extensionsUsed',[])
if 'KHR_materials_iridescence' not in used_extensions: used_extensions.append('KHR_materials_iridescence')
encoded=json.dumps(gltf,separators=(',',':')).encode('utf-8')
encoded+=b' '*((-len(encoded))%4)
binary_chunks=blob[20+json_size:]
out.write_bytes(struct.pack('<III',0x46546C67,2,20+len(encoded)+len(binary_chunks))+
                struct.pack('<II',len(encoded),0x4E4F534A)+encoded+binary_chunks)
out.with_suffix('.json').write_text(json.dumps(dict(triangles=context['after'],meshes=len(meshes),
    materials=converted,iridescence=coating,stringTargets=[f'String_{i+1}' for i in range(6)],runtimeReady=False,limitations=[
    'Thin-film coating is a new approximation, not source-render parity; unsupported viewers retain cyan lacquer',
    'Legacy normal and occlusion images have not been transferred',
    'Highlight readability, close-up geometry and Android testing pending']),indent=2),encoding='utf-8')
print('COTTON_MATERIAL_REVIEW',out)
