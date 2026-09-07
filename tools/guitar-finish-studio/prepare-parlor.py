"""Source-specific, non-destructive Parlor guitar conversion to static GLB.

Run via Blender --factory-startup --disable-autoexec --python FILE -- SOURCE OUT.
Output stays in staging until visual/device acceptance. Never saves the blend.
"""
import bpy
import bmesh
import json
import sys
import struct
from pathlib import Path
from mathutils import Matrix, Vector

source, output = map(Path, sys.argv[sys.argv.index('--')+1:])
bpy.ops.wm.open_mainfile(filepath=str(source.resolve()),load_ui=False,use_scripts=False)
body=bpy.data.objects.get('parlourGuitar')
if not body or body.type!='MESH':
    raise RuntimeError('Not the audited Parlor source')
strings=[bpy.data.objects['parlourGuitar.string.'+n] for n in ['E','A','D','G','B','e']]
selected=[body]+strings
for obj in bpy.context.view_layer.objects:
    obj.select_set(False)
for obj in selected:
    obj.hide_set(False)
    obj.hide_viewport=False
    obj.select_set(True)
    if obj.type=='CURVE':
        obj.data.resolution_u=6
        obj.data.render_resolution_u=6
    for modifier in obj.modifiers:
        if modifier.type=='SUBSURF':
            modifier.levels=1
            modifier.render_levels=1
bpy.context.view_layer.objects.active=body
bpy.ops.object.convert(target='MESH')
selected=list(bpy.context.selected_objects)
for obj in selected:
    if obj.name=='parlourGuitar':
        mod=obj.modifiers.new('Mobile reduction','DECIMATE')
        mod.ratio=.28
        bpy.context.view_layer.objects.active=obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
        # Decimation can leave collapsed faces. Triangulate explicitly before
        # Blender's tangent calculation (as recommended by its glTF exporter).
        bm=bmesh.new()
        bm.from_mesh(obj.data)
        bmesh.ops.triangulate(bm,faces=list(bm.faces))
        collapsed=[f for f in bm.faces if f.calc_area()<1e-12]
        if collapsed:
            bmesh.ops.delete(bm,geom=collapsed,context='FACES_ONLY')
        bm.to_mesh(obj.data)
        bm.free()
        obj.data.update()
        obj.name='Parlor_body'
    elif '.string.' in obj.name:
        note=obj.name.rsplit('.',1)[1]
        obj.name='String_'+str(['E','A','D','G','B','e'].index(note)+1)
    obj.animation_data_clear()

# Keep the source's explicitly wired color/roughness/metal maps. Export the
# existing tangent normal directly: glTF cannot represent Blender's extra
# height-bump node. This omission is recorded, not silently claimed as a bake.
mat=bpy.data.materials['Parlor-Guitar.MAT']
nodes=mat.node_tree.nodes
mat.node_tree.links.new(nodes['Normal Map'].outputs['Normal'],nodes['Principled BSDF'].inputs['Normal'])
used_images={n.image for n in nodes if n.type=='TEX_IMAGE' and n.image}
for image in used_images:
    if max(image.size)>1024:
        ratio=1024/max(image.size)
        image.scale(round(image.size[0]*ratio),round(image.size[1]*ratio))
    image.pack()

# Source lies along +X with its face toward +Z. Blender export maps Z up to
# glTF Y up. This rigid rotation gives us +Y neck and +Z face in the GLB.
orientation=Matrix(((0,-1,0,0),(0,0,-1,0),(1,0,0,0),(0,0,0,1)))
for obj in selected:
    obj.matrix_world=orientation@obj.matrix_world
bpy.context.view_layer.update()
points=[obj.matrix_world@Vector(corner) for obj in selected for corner in obj.bound_box]
low=Vector(tuple(min(p[i] for p in points) for i in range(3)))
high=Vector(tuple(max(p[i] for p in points) for i in range(3)))
offset=Vector((-(low.x+high.x)/2,-(low.y+high.y)/2,-low.z))
for obj in selected:
    obj.matrix_world=Matrix.Translation(offset)@obj.matrix_world
triangles=sum(sum(len(p.vertices)-2 for p in obj.data.polygons) for obj in selected)
if triangles>25000:
    raise RuntimeError(f'Over geometry budget: {triangles}')
output.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output.resolve()),export_format='GLB',
    use_selection=True,export_animations=False,export_skins=False,export_morph=False,
    export_tangents=True,export_yup=True,export_cameras=False,export_lights=False,
    export_copyright='Blues guitar, BlendSwap #88358, CC0-1.0',export_extras=False)
# The source has one undefined UV tangent even after triangulation. Supply a
# normal-orthogonal basis ONLY for zero vectors; preserve all valid tangents.
# Do not disable normal maps across the whole guitar to hide that local issue.
blob=bytearray(output.read_bytes())
json_length=struct.unpack_from('<I',blob,12)[0]
gltf=json.loads(blob[20:20+json_length])
binary_start=28+json_length
repairs=0
seen=set()
for mesh in gltf['meshes']:
    for primitive in mesh['primitives']:
        attrs=primitive['attributes']
        if 'TANGENT' not in attrs or attrs['TANGENT'] in seen:
            continue
        seen.add(attrs['TANGENT'])
        tangent=gltf['accessors'][attrs['TANGENT']]
        normal=gltf['accessors'][attrs['NORMAL']]
        assert tangent['componentType']==normal['componentType']==5126
        assert tangent['type']=='VEC4' and normal['type']=='VEC3'
        def address(accessor,index,width):
            view=gltf['bufferViews'][accessor['bufferView']]
            return binary_start+view.get('byteOffset',0)+accessor.get('byteOffset',0)+index*view.get('byteStride',width)
        for i in range(tangent['count']):
            at=address(tangent,i,16)
            x,y,z,w=struct.unpack_from('<4f',blob,at)
            if x*x+y*y+z*z<1e-12:
                n=Vector(struct.unpack_from('<3f',blob,address(normal,i,12))).normalized()
                axis=Vector((1,0,0)) if abs(n.x)<.9 else Vector((0,1,0))
                t=n.cross(axis).normalized()
                struct.pack_into('<4f',blob,at,t.x,t.y,t.z,-1.0 if w<0 else 1.0)
                repairs+=1
output.write_bytes(blob)
report=dict(source=str(source),output=str(output),triangles=triangles,meshes=len(selected),
    strings=[o.name for o in selected if o.name.startswith('String_')],
    max_texture_size=1024,omissions=['extra height-bump layer','pick','floor','source lighting'],
    tangent_fallbacks=repairs,status='staging; not device-validated')
output.with_suffix('.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
