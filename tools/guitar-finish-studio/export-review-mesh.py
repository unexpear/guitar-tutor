"""Local geometry review only. Original sources are never saved or modified."""
import bpy
import sys
import json
import hashlib
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:]
source,out,kind=args[:3]
budget=int(args[3]) if len(args)>3 else None
approved=json.loads(Path(__file__).with_name('approved-imports.json').read_text())
entry=next((m for m in approved['models'] if m['sourceKind']==kind),None)
if not entry or hashlib.sha256(Path(source).read_bytes()).hexdigest().upper()!=entry['sourceSha256']:
    raise RuntimeError('Source is not in the approved import manifest')
if budget is not None and not 10000<=budget<=100000:
    raise ValueError('Review triangle budget must be between 10000 and 100000')
bpy.ops.wm.open_mainfile(filepath=str(Path(source).resolve()),load_ui=False,use_scripts=False)
def included(o):
    if o.type not in {'MESH','CURVE'} or o.hide_render:
        return False
    if kind=='classical':
        excluded={'environment','Scheen','Cube.007','Cylinder.003'}
        if budget:
            # Stand components and the branded soundhole label are not instrument assets.
            excluded.update({'Sticker','Cylinder.004','Cylinder.005','Cylinder.006',
                             'Cylinder.007','Cylinder.008','Cube.006'})
        return o.name not in excluded
    if kind=='cotton':
        if budget and ('logo' in o.name.lower() or o.name in {'Wires','Solder','Capacitor_01','Scratchplate_Foil','Scrath_Plate.006','Scrath_Plate.007','Scrath_Plate.008'}): return False
        p=o
        while p:
            if p.name=='1C_Empty_Guitar': return True
            p=p.parent
        return False
    return max(o.dimensions)<2
selected=[o for o in bpy.context.scene.objects if included(o)]
for o in bpy.context.view_layer.objects: o.select_set(False)
for o in selected:
    o.hide_set(False)
    o.hide_viewport=False
    o.select_set(True)
    for m in o.modifiers:
        if m.type=='SUBSURF': m.levels=min(m.levels,1);m.render_levels=m.levels
    if o.type=='CURVE': o.data.resolution_u=min(o.data.resolution_u,8)
if not selected: raise RuntimeError('No review geometry')
bpy.context.view_layer.objects.active=selected[0]
bpy.ops.object.convert(target='MESH')
meshes=[o for o in bpy.context.selected_objects if o.type=='MESH']
count=lambda o:sum(len(p.vertices)-2 for p in o.data.polygons)
before=sum(count(o) for o in meshes)
protected_names=({'Deck','Deck inside','Vulture','Stand','frets','Nut','Bottom nut'} if kind=='classical'
                 else {'1A_Body','Headstock_Future_Finished','Strings_01','Scrath_Plate_01'})
protected=[o for o in meshes if o.name in protected_names or count(o)<100]
reducible=[o for o in meshes if o not in protected]
if budget and before>budget:
    reserved=sum(count(o) for o in protected)
    available=budget*.92-reserved
    if available<=0:
        raise RuntimeError(f'Budget cannot preserve primary surfaces ({reserved} triangles); increase budget')
    ratio=min(1,available/sum(count(o) for o in reducible))
    for o in reducible:
        bpy.context.view_layer.objects.active=o
        mod=o.modifiers.new('Review LOD reduction','DECIMATE')
        mod.ratio=ratio
        bpy.ops.object.modifier_apply(modifier=mod.name,single_user=True)
after=sum(count(o) for o in meshes)
if budget and after>budget: raise RuntimeError(f'Over budget: {after}')
camera=bpy.context.scene.camera
if camera: camera.select_set(True)
Path(out).parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(Path(out).resolve()),use_selection=True,
    export_format='GLB',export_materials='NONE',export_animations=False,
    export_skins=False,export_morph=False,export_cameras=True,export_lights=False,
    export_texcoords=False,export_normals=True,export_tangents=False,
    export_copyright='LOCAL GEOMETRY REVIEW ONLY - source rights not cleared for redistribution')
print('REVIEW_EXPORT',kind,out)
Path(out).with_suffix('.json').write_text(json.dumps(dict(sourceKind=kind,
    trianglesBefore=before,trianglesAfter=after,meshes=len(meshes),
    objects=[dict(name=o.name,triangles=count(o),protected=o in protected) for o in meshes],
    geometryOnly=True,runtimeReady=False),indent=2),encoding='utf-8')
