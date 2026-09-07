import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import * as T from 'three';
import { build, dispose, statistics, collision } from './mesh-studio.js';
import { mobileRecipe, rarityLimits } from './mobile-recipe.js';
import { finishNames,finishProperties,surfaceDetail,coatingDetail,carbonDetail } from './material-detail.js';
import { anisotropyExporter } from './export-anisotropy.js';
import capture from './captured-wood.json' with {type:'json'};
import {capturedWood,capturedWoodTint} from './captured-wood.js';
import {carveHeight,carvedNormal} from './carved-top.js';
import {rosewoodSample} from './captured-rosewood.js';
import rosewoodCapture from './captured-rosewood.json' with {type:'json'};
import studioCapture from './captured-studio.json' with {type:'json'};
import {studioPixels} from './studio-environment.js';

test('carbon uses repeatable two-over/two-under tows and bounded relief',()=>{
  assert.deepEqual([0,1,2,3].map(x=>carbonDetail((x+.5)/64,.5/64,123).vertical),[true,true,false,false]);
  assert.deepEqual([0,1,2,3].map(x=>carbonDetail((x+.5)/64,1.5/64,123).vertical),[false,true,true,false]);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++) {
    const d=carbonDetail(x/256,y/256,123);
    assert.ok(Number.isFinite(d.color+d.height+d.roughness));
    assert.ok(Math.abs(d.height)<.06);
  }
  assert.deepEqual(carbonDetail(.31,.67,123),carbonDetail(.31,.67,123));
  const root=build(config,{...design,primaryFinish:'Carbon Weave',accentFinish:'Carbon Weave'},outlines[config.profile],1);
  const paint=root.getObjectByName('Soundboard').material[0];
  assert.ok(paint.anisotropyMap);assert.equal(paint.metalnessMap.image.pixels[2],0);
  assert.equal(paint.map.image.width,512);assert.equal(paint.normalMap.image.width,512);
  const pixels=paint.anisotropyMap.image.pixels;
  assert.ok(pixels.some((v,i)=>i%4===0&&v===128));assert.ok(pixels.some((v,i)=>i%4===0&&v===255));
  dispose(root);
});

test('captured source is bounded, attributed and repeatable',()=>{
  assert.equal(capture.license,'CC0-1.0');assert.equal(capture.size,256);
  assert.equal(Buffer.from(capture.pixels,'base64').length,256*256*3);
  assert.equal(Buffer.from(capture.color,'base64').length,256*256*3);
  const tint=capturedWoodTint(.3,.7,123);
  assert.ok(tint.every(v=>v>=.8&&v<=1.2));assert.notEqual(tint[0],tint[2]);
  assert.equal(Object.keys(capture.sourceSha256).length,3);
  assert.deepEqual(capturedWood(.3,.7,123),capturedWood(.3,.7,123));
  assert.ok(capturedWood(.3,.7,123).every(Number.isFinite));
});

test('rosewood is an attributed independent source, not recolored body grain',()=>{
  assert.equal(rosewoodCapture.license,'CC0-1.0');assert.match(rosewoodCapture.source,/polyhaven/);
  assert.equal(Buffer.from(rosewoodCapture.pixels,'base64').length,64*512*4);
  assert.equal(Object.keys(rosewoodCapture.sourceSha256).length,2);
  const a=rosewoodSample(.3,.4),b=rosewoodSample(.3,.8);
  assert.notDeepEqual(a,b);assert.ok(a.slice(0,3).every(v=>v>=0&&v<=255));assert.ok(a[3]>=.6&&a[3]<=.8);
});

test('captured studio retains HDR radiance in a bounded offline environment',()=>{
  assert.equal(studioCapture.license,'CC0-1.0');
  assert.equal(studioCapture.width,512);assert.equal(studioCapture.height,256);
  const pixels=studioPixels();assert.equal(pixels.length,512*256*4);
  let peak=0;
  for(let i=0;i<pixels.length;i+=4) {
    for(let c=0;c<3;c++){const value=T.DataUtils.fromHalfFloat(pixels[i+c]);assert.ok(Number.isFinite(value)&&value>=0);peak=Math.max(peak,value);}
    assert.equal(T.DataUtils.fromHalfFloat(pixels[i+3]),1);
  }
  assert.ok(peak>100,'must not tone-map away real light intensities');
  assert.ok(Math.abs(peak-studioCapture.peak)/studioCapture.peak<.01);
});

test('carve keeps the mounting plateau and lowers the perimeter by six millimeters',()=>{
  const square=[new T.Vector2(-.2,0),new T.Vector2(.2,0),new T.Vector2(.2,.5),new T.Vector2(-.2,.5)];
  assert.equal(carveHeight(0,.25,square),0);
  assert.equal(carveHeight(.2,.25,square),-.006);
  assert.ok(carveHeight(.17,.25,square)>-.006&&carveHeight(.17,.25,square)<0);
});

test('carved normals agree with the deformed tangent plane inside and outside the slab',()=>{
  const outline=[new T.Vector2(-.2,0),new T.Vector2(.2,0),new T.Vector2(.2,.5),new T.Vector2(-.2,.5)],depth=.045;
  const deform=p=>new T.Vector3(p.x,p.y,p.z+carveHeight(p.x,p.y,outline)*T.MathUtils.clamp(p.z/depth,0,1));
  const n=new T.Vector3(1,.3,1).normalize(),a=new T.Vector3().crossVectors(n,new T.Vector3(0,1,0)).normalize(),b=new T.Vector3().crossVectors(n,a).normalize();
  for(const z of [-.003,.02,.048]) {
    const p=new T.Vector3(.17,.25,z),h=.00001;
    const tangent=t=>deform(p.clone().addScaledVector(t,h)).sub(deform(p.clone().addScaledVector(t,-h)));
    const expected=tangent(a).cross(tangent(b)).normalize();
    assert.ok(carvedNormal(p,n,outline,depth).dot(expected)>.999999);
  }
});

test('GLB plugin preserves anisotropy strength, direction, texture channel and transform',async()=>{
  const writer={extensionsUsed:{},processTextureAsync:async()=>7,applyTextureTransform(info){info.extensions={KHR_texture_transform:{offset:[.1,.2]}};}};
  const plugin=anisotropyExporter(writer),definition={};
  await plugin.writeMaterialAsync({isMeshPhysicalMaterial:true,anisotropy:.7,anisotropyRotation:.4,anisotropyMap:{channel:0}},definition);
  assert.deepEqual(definition.extensions.KHR_materials_anisotropy,{anisotropyStrength:.7,anisotropyRotation:.4,anisotropyTexture:{index:7,texCoord:0,extensions:{KHR_texture_transform:{offset:[.1,.2]}}}});
  assert.equal(writer.extensionsUsed.KHR_materials_anisotropy,true);
  const matte={};await plugin.writeMaterialAsync({isMeshPhysicalMaterial:true,anisotropy:0},matte);assert.deepEqual(matte,{});
});

test('seeded phone recipes obey rarity complexity and polish limits reproducibly',()=>{
  const rarities=['Starter','Rare','Epic','Legendary'];
  for(let seed=0;seed<1000;seed++)for(let tier=0;tier<4;tier++) {
    const input={id:'sample',seed,faceMid:'#aa7755',rarity:rarities[tier]};
    const recipe=mobileRecipe(input),limits=rarityLimits[tier];
    assert.deepEqual(recipe,mobileRecipe(input));assert.equal(recipe.qualityTier,tier);
    assert.ok(limits.wood.includes(recipe.collectionStyle));assert.ok(limits.bodies.includes(recipe.bodyStyle));
    assert.equal(recipe.clearcoatLimit,limits.clearcoat);
    if(tier>0)assert.ok(recipe.clearcoatLimit>rarityLimits[tier-1].clearcoat);
    else {assert.equal(recipe.figureStrength,0);assert.ok(['Matte','Solid Matte','Rough Paint','Open Pore Wood'].includes(recipe.primaryFinish));}
  }
});

test('solid paints have no inherited grain; rough materials vary in relief and metals have distinct polish',()=>{
  assert.equal(finishNames.length,14);
  for(const name of finishNames) {
    assert.ok(finishProperties(name).every(v=>v>=0&&v<=1));
    for(let i=0;i<10;i++)assert.ok(surfaceDetail(name,i/10,.37,42).every(Number.isFinite));
  }
  for(const name of ['Solid Gloss','Solid Satin','Solid Matte','Polished Metal']) {
    assert.deepEqual(surfaceDetail(name,.2,.3,123),[0,0,0]);
    assert.deepEqual(surfaceDetail(name,.8,.7,999),[0,0,0]);
  }
  for(const name of ['Rough Paint','Open Pore Wood','Hammered Metal']) {
    const heights=new Set();
    for(let y=0;y<16;y++)for(let x=0;x<16;x++)heights.add(surfaceDetail(name,x/16,y/16,123)[1]);
    assert.ok(heights.size>2,`${name} must contain varying relief`);
  }
  assert.ok(finishProperties('Solid Gloss')[0]<finishProperties('Solid Satin')[0]);
  assert.ok(finishProperties('Solid Satin')[0]<finishProperties('Solid Matte')[0]);
  assert.equal(finishProperties('Solid Gloss')[1],0);
  assert.equal(finishProperties('Polished Metal')[1],1);
  assert.ok(finishProperties('Polished Metal')[0]<finishProperties('Satin Metal')[0]);
});

test('pearl is independent of wood figure and open pores are recessed',()=>{
  assert.deepEqual(surfaceDetail('Pearlescent',.23,.42,321,0),surfaceDetail('Pearlescent',.23,.42,321,5));
  let pores=0;
  for(let y=0;y<32;y++)for(let x=0;x<32;x++) {
    const detail=surfaceDetail('Open Pore Wood',x/32,y/32,321);
    assert.ok(detail[1]<=0);if(detail[1]<0)pores++;
    assert.ok(surfaceDetail('Hammered Metal',x/32,y/32,321)[1]<=.16);
  }
  assert.ok(pores>0);
});

test('flake orientations and pearl thickness are bounded and deterministic',()=>{
  let flakes=0;const thickness=new Set();
  for(let y=0;y<32;y++)for(let x=0;x<32;x++) {
    const c=coatingDetail(x/32,y/32,1234);flakes+=c.flake;
    assert.deepEqual(c,coatingDetail(x/32,y/32,1234));
    assert.ok(Math.abs(c.normalX)<=1&&Math.abs(c.normalY)<=1);
    assert.ok(c.pearlThickness>=.25&&c.pearlThickness<=.75);thickness.add(c.pearlThickness);
  }
  assert.ok(flakes>100&&flakes<400);assert.ok(thickness.size>100);
  const root=build(config,{...design,primaryFinish:'Pearlescent'},outlines[config.profile],1);
  const paint=root.getObjectByName('Soundboard').material[0];
  assert.equal(paint.iridescenceThicknessMap,paint.iridescenceMap);
  assert.deepEqual(paint.iridescenceThicknessRange,[300,650]);dispose(root);
});

// Geometry-only tests: no WebGL or fake success from the exporter. Actual browser
// GLBs are separately checked with Khronos validateBytes.
globalThis.document={createElement:()=>{const canvas={width:0,height:0};canvas.getContext=()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(image){canvas.pixels=image.data;}});return canvas;}};
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const literal=source.match(/const outlines = (\{[\s\S]*?\n    \});/)[1];
const outlines=vm.runInNewContext(`(${literal})`);
const design={primary:'#a51931',accent:'#ffd166',primaryFinish:'Gloss',accentFinish:'Metallic Flake',textureStrength:55,pattern:'Center Stripe',patternScale:100,seed:1847};
const config={profile:'acoustic-dreadnought',strings:6,frets:20,scaleLengthMm:645.2,nutWidthMm:44.5,bridgeSpacingMm:54.8,bodyDepthMeters:.1,joinFret:14,pickups:'none',handedness:'right'};

test('strings retain their own alloy and winding rather than inheriting hardware plating',()=>{
  for(const profile of ['acoustic-dreadnought','electric-singlecut']) {
    const root=build({...config,profile,pickups:'hh'},{...design,qualityTier:3},outlines[profile],1);
    const low=root.getObjectByName('String_1'),high=root.getObjectByName('String_6'),key=root.getObjectByName('Tuning_key_1');
    assert.notEqual(low.material,key.material);assert.notEqual(high.material,key.material);
    assert.ok(low.material.normalMap);assert.equal(high.material.normalMap,null);
    const tangent=low.geometry.attributes.tangent;
    for(let i=0;i<tangent.count;i++)assert.ok(Math.abs(Math.hypot(tangent.getX(i),tangent.getY(i),tangent.getZ(i))-1)<.001);
    assert.equal(low.material.normalMap.wrapT,T.RepeatWrapping);
    assert.equal(low.material.name,profile.startsWith('acoustic')?'Bronze_wound_string':'Nickel_wound_string');
    assert.equal(high.castShadow,false);assert.equal(key.castShadow,true);
    assert.equal(root.getObjectByName(profile.startsWith('acoustic')?'Soundboard':'Body').receiveShadow,true);
    dispose(root);
  }
});

test('opaque electric finishes wrap sides and manufactured hardware has bounded edge radii',()=>{
  for(const finish of finishNames) {
    const root=build({...config,profile:'electric-singlecut',pickups:'hh'}, {...design,primaryFinish:finish},outlines['electric-singlecut'],1);
    const [front,side]=root.getObjectByName('Body').material;
    assert.equal(front===side,!['Gloss','Matte','Open Pore Wood'].includes(finish));
    const bridge=root.getObjectByName('Bridge').geometry;
    assert.equal(bridge.type,'RoundedBoxGeometry');
    assert.ok(bridge.parameters.radius<=Math.min(bridge.parameters.width,bridge.parameters.height,bridge.parameters.depth)/2);
    const wood=root.getObjectByName('Fretboard').material;
    assert.equal(wood.roughnessMap.colorSpace,T.NoColorSpace);
    assert.equal(wood.map.colorSpace,T.SRGBColorSpace);
    assert.ok(new Set(wood.roughnessMap.image.pixels).size>2,'captured roughness must retain variation without inventing noise');
    dispose(root);
  }
});

test('craftsmanship tiers add real detail while every guitar retains bridge hardware',()=>{
  for(let qualityTier=0;qualityTier<4;qualityTier++) {
    const root=build(config,{...design,collectionStyle:qualityTier,qualityTier},outlines[config.profile],1);
    assert.ok(root.getObjectByName('Bridge_pin_6'));
    assert.equal(!!root.getObjectByName('Premium_rosette'),qualityTier>=2);
    assert.equal(!!root.getObjectByName('Premium_purfling'),qualityTier===3);
    assert.equal(!!root.getObjectByName('Body_binding'),qualityTier>=1);
    assert.equal(!!root.getObjectByName('Fretboard_binding_1'),qualityTier>=2);
    assert.equal(!!root.getObjectByName('Headstock_flourish_1'),qualityTier===3);
    assert.ok(root.getObjectByName('Soundboard').material[0].isMeshPhysicalMaterial);
    dispose(root);
  }
});

test('rarity polish limits reach rendered materials without enabling costly extra effects',()=>{
  for(const rarity of ['Starter','Rare','Epic','Legendary']) {
    const recipe=mobileRecipe({id:'sample',seed:71319,faceMid:'#aa7755',rarity});
    const root=build(config,recipe,outlines[config.profile],1);
    const paint=root.getObjectByName('Soundboard').material[0];
    assert.equal(paint.clearcoat,recipe.clearcoatLimit);
    assert.equal(paint.clearcoatRoughness,recipe.coatRoughness);
    assert.equal(paint.iridescence,0);assert.equal(paint.anisotropy,0);
    assert.ok(statistics(root).triangles<25000);assert.ok(statistics(root).meshes<180);
    dispose(root);
  }
});

test('mixed finish masks preserve matte regions and enable directional/pearl effects only on demand',()=>{
  const root=build(config,{...design,primaryFinish:'Matte',accentFinish:'Gloss',pattern:'Split'},outlines[config.profile],1);
  const paint=root.getObjectByName('Soundboard').material[0];
  const pixels=paint.clearcoatMap.image.pixels;
  assert.equal(pixels[(128*256+20)*4],0);assert.ok(pixels[(128*256+220)*4]>190);
  assert.equal(paint.iridescence,0);assert.equal(paint.anisotropy,0);dispose(root);
  for(const finish of ['Pearlescent','Brushed Metal']) {
    const model=build(config,{...design,primaryFinish:finish},outlines[config.profile],1);
    const m=model.getObjectByName('Soundboard').material[0];
    assert.ok(finish==='Pearlescent'?m.iridescenceMap:m.anisotropyMap);dispose(model);
  }
});

test('phone presets fit geometry budgets and neck pickups never intersect fretboards',()=>{
  for(const profile of Object.keys(outlines))for(let tier=0;tier<4;tier++) {
    const root=build({...config,profile,pickups:'hh',frets:24},{...design,collectionStyle:tier,qualityTier:tier},outlines[profile],1);
    assert.ok(statistics(root).triangles<25000);
    assert.ok(statistics(root).meshes<180);
    if(!profile.startsWith('acoustic')) {
      const board=new T.Box3().setFromObject(root.getObjectByName('Fretboard'));
      const pickup=new T.Box3().setFromObject(root.getObjectByName('Pickup_ring_2'));
      assert.ok(pickup.max.y<board.min.y);
    }
    dispose(root);
  }
});

test('five body shapes and both hands have finite, non-degenerate triangles and unit normals',()=>{
  for(const profile of Object.keys(outlines)) for(const handedness of ['left','right']) {
    const root=build({...config,profile,handedness},design,outlines[profile]);
    root.traverse(node=>{if(!node.isMesh)return;
      const g=node.geometry,p=g.attributes.position,n=g.attributes.normal;
      for(let i=0;i<p.count;i++) { assert.ok(Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i))); assert.ok(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<.001); }
      const vertex=i=>new T.Vector3().fromBufferAttribute(p,g.index?g.index.getX(i):i);
      for(let i=0;i<(g.index?.count||p.count);i+=3){const a=vertex(i),b=vertex(i+1),c=vertex(i+2);assert.ok(b.sub(a).cross(c.sub(a)).length()>1e-12,`${profile}/${node.name}`);}
    });
    assert.ok(statistics(root).sizeMeters[1]>.9); dispose(root);
  }
});
test('acoustic soundboard has an actual hole; frets have a supporting fretboard',()=>{
  const root=build(config,design,outlines[config.profile]);
  const ray=new T.Raycaster(new T.Vector3(.01,.345,1),new T.Vector3(0,0,-1));
  assert.equal(ray.intersectObject(root.getObjectByName('Soundboard')).length,0);
  assert.ok(ray.intersectObject(root.getObjectByName('Back')).length>0);
  const board=new T.Box3().setFromObject(root.getObjectByName('Fretboard'));
  for(const name of ['Neck','Fretboard']) {
    const part=root.getObjectByName(name);assert.ok(part.material.map);
    const uv=part.geometry.attributes.uv,normal=part.geometry.attributes.normal;
    for(let i=0;i<uv.count;i++)if(normal.getZ(i)>.99) {
      assert.ok(uv.getX(i)>=-.001&&uv.getX(i)<=1.001);
      assert.ok(uv.getY(i)>=-.001&&uv.getY(i)<=1.001);
    }
  }
  assert.ok(board.min.y<new T.Box3().setFromObject(root.getObjectByName('Fret_20')) .min.y);
  assert.equal(root.animations.length,0); dispose(root);
});

test('fret ends stay inside the tapered board at every position',()=>{
  for(const frets of [20,22,24]) {
    const root=build({...config,frets},design,outlines[config.profile],1);
    const board=root.getObjectByName('Fretboard');
    for(let f=1;f<=frets;f++) {
      const fret=root.getObjectByName(`Fret_${f}`);
      fret.geometry.computeBoundingBox();const half=fret.geometry.boundingBox.max.x;
      assert.ok(Number.isFinite(half)&&half>0);
      for(const side of [-1,1]) {
        const ray=new T.Raycaster(new T.Vector3(side*half,fret.position.y,1),new T.Vector3(0,0,-1));
        assert.ok(ray.intersectObject(board).length>0,`fret ${f} must be supported`);
        const hit=ray.intersectObject(board)[0];
        assert.ok(hit.point.z<config.bodyDepthMeters/2+.0048,'fret crown must stand above the curved board');
      }
    }
    assert.ok(root.getObjectByName('Bridge_center'));dispose(root);
  }
});
test('LODs reduce triangle count and collision is a separate three-box asset',()=>{
  const levels=[0,1,2].map(lod=>build(config,design,outlines[config.profile],lod));
  assert.ok(statistics(levels[0]).triangles>statistics(levels[1]).triangles);
  assert.ok(statistics(levels[1]).triangles>statistics(levels[2]).triangles);
  const proxy=collision(levels[0]);assert.equal(proxy.children.length,3);assert.equal(statistics(proxy).triangles,36);
  for(const root of [...levels,proxy])dispose(root);
});

test('collection families change actual geometry and PBR pixels, reproducibly, without recoloring',()=>{
  const hash=data=>createHash('sha256').update(Buffer.from(data.buffer,data.byteOffset,data.byteLength)).digest('hex');
  const fingerprints=[];
  for(let collectionStyle=0;collectionStyle<6;collectionStyle++) {
    const root=build(config,{...design,collectionStyle},outlines[config.profile]);
    const top=root.getObjectByName('Soundboard'),paint=top.material[0];
    assert.ok(root.getObjectByName('Body_binding'));
    const signature=[hash(top.geometry.attributes.position.array),hash(paint.map.image.pixels),hash(paint.normalMap.image.pixels),hash(paint.roughnessMap.image.pixels)];
    assert.equal(paint.map.colorSpace,T.SRGBColorSpace);
    assert.equal(paint.normalMap.colorSpace,T.NoColorSpace);
    const repeat=build(config,{...design,collectionStyle},outlines[config.profile]);
    assert.equal(hash(repeat.getObjectByName('Soundboard').material[0].map.image.pixels),signature[1]);
    fingerprints.push(signature);dispose(root);dispose(repeat);
  }
  for(let channel=0;channel<4;channel++) assert.equal(new Set(fingerprints.map(f=>f[channel])).size,6);
});

test('every new family supports all profiles and keeps an open acoustic soundhole',()=>{
  for(const profile of Object.keys(outlines)) for(let collectionStyle=0;collectionStyle<6;collectionStyle++) {
    const root=build({...config,profile},{...design,collectionStyle},outlines[profile]);
    root.traverse(node=>{if(!node.isMesh)return;const p=node.geometry.attributes.position;for(const value of p.array)assert.ok(Number.isFinite(value));});
    if(profile.startsWith('acoustic')) assert.equal(new T.Raycaster(new T.Vector3(.01,.345,1),new T.Vector3(0,0,-1)).intersectObject(root.getObjectByName('Soundboard')).length,0);
    dispose(root);
  }
});
