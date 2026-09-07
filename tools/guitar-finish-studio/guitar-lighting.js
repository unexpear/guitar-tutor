import * as T from 'three';

// One shadow-casting light; rendering remains event-driven, including on phones.
export function guitarShadows(renderer,scene,key,resolution=512) {
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  key.castShadow=true;key.shadow.mapSize.set(resolution,resolution);
  Object.assign(key.shadow.camera,{left:-.85,right:.85,top:.85,bottom:-.85,near:.1,far:10});
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.bias=-.00002;key.shadow.normalBias=.0002;
  key.target.position.set(0,.55,0);scene.add(key.target);
}
