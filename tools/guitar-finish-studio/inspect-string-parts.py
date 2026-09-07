"""Read-only connectivity audit for string mapping; never saves a source blend."""
import bpy
import sys
import json
source,name=sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.open_mainfile(filepath=source,load_ui=False,use_scripts=False)
obj=bpy.data.objects[name];mesh=obj.data
adj=[[] for _ in mesh.vertices]
for e in mesh.edges:
    a,b=e.vertices;adj[a].append(b);adj[b].append(a)
unseen=set(range(len(adj)));parts=[]
while unseen:
    stack=[unseen.pop()];part=[]
    while stack:
        i=stack.pop();part.append(i)
        for j in adj[i]:
            if j in unseen: unseen.remove(j);stack.append(j)
    points=[obj.matrix_world@mesh.vertices[i].co for i in part]
    low=[min(p[i] for p in points) for i in range(3)]
    high=[max(p[i] for p in points) for i in range(3)]
    parts.append(dict(vertices=len(part),low=low,high=high))
print(json.dumps(sorted(parts,key=lambda p:-p['vertices']),indent=2))
