"""Render an unmodified source scene at review resolution; never save its blend."""
import bpy
import sys
from pathlib import Path

source, destination = map(Path, sys.argv[sys.argv.index('--')+1:])
bpy.ops.wm.open_mainfile(filepath=str(source.resolve()), load_ui=False, use_scripts=False)
scene=bpy.context.scene
if not scene.camera:
    raise RuntimeError('Source has no active camera; choose framing explicitly')
scene.render.engine='CYCLES'
scene.cycles.device='CPU'
scene.cycles.samples=16
scene.cycles.use_denoising=True
scale=720/max(scene.render.resolution_x,scene.render.resolution_y)
scene.render.resolution_x=max(1,round(scene.render.resolution_x*scale))
scene.render.resolution_y=max(1,round(scene.render.resolution_y*scale))
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
destination.parent.mkdir(parents=True,exist_ok=True)
scene.render.filepath=str(destination.resolve())
bpy.ops.render.render(write_still=True)
