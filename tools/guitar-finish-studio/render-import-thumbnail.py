"""Render the actual converted GLB into a transparent picker thumbnail."""
import bpy,sys
from mathutils import Vector
source,destination=sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=source)
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
points=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
low=Vector([min(p[i] for p in points) for i in range(3)])
high=Vector([max(p[i] for p in points) for i in range(3)])
center=(low+high)/2;height=high.z-low.z
camera=bpy.data.objects.new('Thumbnail camera',bpy.data.cameras.new('Thumbnail camera'))
bpy.context.collection.objects.link(camera);camera.data.type='ORTHO';camera.data.ortho_scale=height*1.12
front=-1 if 'classical' in source.lower() else 1
camera.location=center+Vector((0,front*height*3,0));camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
scene=bpy.context.scene;scene.camera=camera
world=bpy.data.worlds.new('Studio');world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.6,.6,.6,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.5;scene.world=world
for name,offset,power in [('Key',(-1,2,2),100),('Fill',(1,1,1),60)]:
 light=bpy.data.lights.new(name,'AREA');light.energy=power*height*height;light.shape='DISK';light.size=height*2
 obj=bpy.data.objects.new(name,light);bpy.context.collection.objects.link(obj);obj.location=center+Vector((offset[0],offset[1]*front,offset[2]))*height;obj.rotation_euler=(center-obj.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
scene.render.film_transparent=True;scene.render.resolution_x=256;scene.render.resolution_y=512;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=destination
bpy.ops.render.render(write_still=True)
