import * as T from 'three';
import { studioEnvironment } from './studio-environment.js';
import { build, dispose } from './mesh-studio.js';
import outlines from './mobile-outlines.json';
import { mobileRecipe } from './mobile-recipe.js';
import { guitarShadows } from './guitar-lighting.js';
import {loadImportedModel,disposeImportedModel} from './imported-mobile-model.js';
import {stringHighlight} from './string-highlight.js';

const send = type => window.ReactNativeWebView?.postMessage(JSON.stringify({type}));
try {
  const canvas = document.querySelector('canvas');
  const renderer = new T.WebGLRenderer({canvas, antialias:true, alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .9;
  const scene = new T.Scene(); scene.background = new T.Color('#141522');
  const camera = new T.PerspectiveCamera(32, 1, .01, 20);
  const environment = studioEnvironment(renderer); scene.environment = environment.texture;
  scene.environmentIntensity = .65;
  scene.add(new T.HemisphereLight(0xffeee0, 0x151522, .6));
  const key = new T.DirectionalLight(0xffefdf, 1.5); key.position.set(-2,3,4); scene.add(key);
  guitarShadows(renderer,scene,key,512);
  const rim = new T.DirectionalLight(0xaabfff, 1); rim.position.set(2,2,-1); scene.add(rim);
  const floor = new T.Mesh(new T.PlaneGeometry(10,10),new T.MeshStandardMaterial({color:0x242534,roughness:.85}));
  floor.rotation.x=-Math.PI/2; floor.position.y=-.035; scene.add(floor);
  floor.receiveShadow=true;
  const shadow = new T.Mesh(new T.CircleGeometry(.25,48),new T.MeshBasicMaterial({color:0x060609,transparent:true,opacity:.45,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2; shadow.scale.y=.5; shadow.position.y=-.033; scene.add(shadow);
  const stand = new T.Group();
  for (const [x,z] of [[-.15,.10],[.15,.10],[0,-.15]]) {
    const a=new T.Vector3(0,.17,-.065),b=new T.Vector3(x,-.02,z),delta=b.clone().sub(a);
    const leg=new T.Mesh(new T.CylinderGeometry(.006,.006,delta.length(),8),new T.MeshStandardMaterial({color:0x555965,metalness:.6,roughness:.3}));
    leg.position.copy(a).add(b).multiplyScalar(.5);leg.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());stand.add(leg);
  }
  scene.add(stand);
  let model, recipeKey, gold, requestedKey, latestPayload, generation=0, importedAsset, highlight, acknowledgedKey;
  window.setImportedAsset=(id,data)=>{importedAsset={id,data};};
  const release=m=>m.userData.statistics?.imported?disposeImportedModel(m):dispose(m);
  const render=()=>renderer.render(scene,camera);
  window.updateGuitar = async payload => {try {
    latestPayload=payload;
    const imported=payload.modelId==='acoustic-classical'||payload.modelId==='electric-cotton-candy';
    const nextKey=JSON.stringify([payload.modelId,imported?null:payload.design]);
    if(nextKey===recipeKey&&requestedKey!==nextKey){generation++;requestedKey=nextKey;}
    if(nextKey===requestedKey&&nextKey!==recipeKey)return;
    if(nextKey!==recipeKey) {
      requestedKey=nextKey;const ticket=++generation;
      let replacement;
      if(imported){
        if(importedAsset?.id!==payload.modelId)throw Error('Missing offline guitar');
        replacement=await loadImportedModel(importedAsset.data);
      }else{
      const profile=payload.modelId==='acoustic-grand'?'acoustic-dreadnought':payload.modelId;
      if(!outlines[profile])throw Error('Unknown guitar model');
      const acoustic=profile.startsWith('acoustic');
      const d=payload.design;
      replacement=build({profile,strings:6,frets:acoustic?20:22,scaleLengthMm:acoustic?645.2:648,nutWidthMm:acoustic?44.5:42.8,bridgeSpacingMm:54,bodyDepthMeters:acoustic?.1:.045,joinFret:acoustic?14:17,pickups:acoustic?'none':profile==='electric-singlecut'?'hh':'sss',handedness:'right'},
        mobileRecipe(d),outlines[profile],1);
      replacement.rotation.y=-.22;
      }
      if(ticket!==generation){release(replacement);return;}
      if(model){highlight?.dispose();model.traverse(o=>{if(o.userData.originalMaterial)o.material=o.userData.originalMaterial;});scene.remove(model);release(model);gold?.dispose();}
      model=replacement;scene.add(model);renderer.shadowMap.needsUpdate=true;
      const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3()),height=bounds.getSize(new T.Vector3()).y;
      if(imported)camera.position.copy(center).addScaledVector(model.userData.cameraDirection,height*2.05);
      else camera.position.set(.18,center.y+.03,height*2.05);
      camera.lookAt(center);
      gold=new T.MeshStandardMaterial({color:0xffd36a,emissive:0x9b6208,emissiveIntensity:.65,metalness:.7,roughness:.2});
      recipeKey=nextKey;
      highlight=stringHighlight(model,render);
    }
    payload=latestPayload;
    for(let i=0;i<6;i++) {
      const string=model.getObjectByName(`String_${i+1}`);
      string?.traverse(o=>{if(o.isMesh&&!o.userData.isStringGlow){o.userData.originalMaterial??=o.material;o.material=i===payload.highlightedString?gold:o.userData.originalMaterial;}});
    }
    highlight?.select(payload.highlightedString);
    render();
    if(payload.requestKey&&acknowledgedKey!==payload.requestKey){
      acknowledgedKey=payload.requestKey;
      window.ReactNativeWebView?.postMessage(JSON.stringify({type:'rendered',requestKey:payload.requestKey}));
    }
    window.guitarDiagnostics={...model.userData.statistics,modelId:payload.modelId,selectedString:payload.highlightedString,drawCalls:renderer.info.render.calls,textures:renderer.info.memory.textures};
  }catch{if(latestPayload?.modelId===payload.modelId)send('error');}};
  const resize=()=>{const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);highlight?.resize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();render();};
  addEventListener('resize',resize);resize();
  canvas.addEventListener('webglcontextlost',()=>send('error'));
  addEventListener('error',()=>send('error'));
  send('ready');
} catch { send('error'); }
