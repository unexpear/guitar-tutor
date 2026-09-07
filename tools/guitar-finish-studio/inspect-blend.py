"""Read-only source audit. Run with Blender --disable-autoexec --python ... -- FILE OUT.

Never saves the source or executes its text blocks. Reports are generated data.
"""
import bpy
import json
import sys
from pathlib import Path

source, destination = map(Path, sys.argv[sys.argv.index('--') + 1:])
bpy.ops.wm.open_mainfile(filepath=str(source.resolve()), load_ui=False, use_scripts=False)
objects = []
for obj in bpy.data.objects:
    mesh = obj.data if obj.type == 'MESH' else None
    objects.append(dict(name=obj.name, type=obj.type, parent=obj.parent.name if obj.parent else None,
        dimensions=list(obj.dimensions), location=list(obj.location), hidden=obj.hide_render,
        vertices=len(mesh.vertices) if mesh else 0,
        triangles=sum(len(p.vertices)-2 for p in mesh.polygons) if mesh else 0,
        uv=[uv.name for uv in mesh.uv_layers] if mesh else [],
        materials=[m.name if m else None for m in mesh.materials] if mesh else [],
        modifiers=[dict(type=m.type, name=m.name, levels=getattr(m,'levels',None),
                        render_levels=getattr(m,'render_levels',None)) for m in obj.modifiers]))
report = dict(source=str(source), blender=bpy.app.version_string, objects=objects,
    scenes=[dict(name=s.name, camera=s.camera.name if s.camera else None, engine=s.render.engine) for s in bpy.data.scenes],
    materials=[dict(name=m.name,nodes=[n.bl_idname for n in m.node_tree.nodes] if m.node_tree else []) for m in bpy.data.materials],
    images=[dict(name=i.name, size=list(i.size), packed=bool(i.packed_file), source=i.source,
                 exists=Path(bpy.path.abspath(i.filepath)).is_file() if i.filepath else False) for i in bpy.data.images],
    embedded_text_names=[t.name for t in bpy.data.texts],
    libraries=[dict(name=l.name,exists=Path(bpy.path.abspath(l.filepath)).is_file()) for l in bpy.data.libraries])
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps(report,indent=2), encoding='utf-8')
print(json.dumps(dict(report=str(destination),objects=len(objects),
    base_triangles=sum(o['triangles'] for o in objects),materials=len(report['materials']),images=report['images'])))
