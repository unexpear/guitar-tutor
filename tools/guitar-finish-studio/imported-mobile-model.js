import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

export async function loadImportedModel(base64){
 const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer,'');
 const root=gltf.scene;root.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(root),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());
 if(!(size.y>0))throw Error('Invalid imported model bounds');
 const direction=gltf.cameras[0]?.getWorldPosition(new T.Vector3()).sub(center).normalize()??new T.Vector3(0,0,-1);
 const cameras=[];root.traverse(o=>{if(o.isCamera)cameras.push(o);});for(const c of cameras)c.removeFromParent();
 const scale=1/size.y;root.scale.multiplyScalar(scale);root.position.add(new T.Vector3(-center.x,-box.min.y,-center.z).multiplyScalar(scale));
 const group=new T.Group();group.add(root);group.userData.cameraDirection=direction;
 let triangles=0,meshes=0;group.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
 group.userData.statistics={triangles,meshes,imported:true};
 for(let i=1;i<=6;i++)if(!group.getObjectByName(`String_${i}`))throw Error('Imported string missing');
 return group;
}
export function disposeImportedModel(root){
 const materials=new Set(),textures=new Set(),images=new Set();
 root.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of [o.userData.originalMaterial??o.material].flat())materials.add(m);}});
 for(const m of materials){for(const value of Object.values(m))if(value?.isTexture)textures.add(value);m.dispose();}
 for(const t of textures){if(t.source?.data)images.add(t.source.data);t.dispose();}
 for(const i of images)i.close?.();
}
