import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import * as T from 'three';
import { build, dispose, statistics, collision } from './mesh-studio.js';

// Geometry-only tests: no WebGL or fake success from the exporter. Actual browser
// GLBs are separately checked with Khronos validateBytes.
globalThis.document={createElement:()=>{const canvas={width:0,height:0};canvas.getContext=()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(image){canvas.pixels=image.data;}});return canvas;}};
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const literal=source.match(/const outlines = (\{[\s\S]*?\n    \});/)[1];
const outlines=vm.runInNewContext(`(${literal})`);
const design={primary:'#a51931',accent:'#ffd166',primaryFinish:'Gloss',accentFinish:'Metallic Flake',textureStrength:55,pattern:'Center Stripe',patternScale:100,seed:1847};
const config={profile:'acoustic-dreadnought',strings:6,frets:20,scaleLengthMm:645.2,nutWidthMm:44.5,bridgeSpacingMm:54.8,bodyDepthMeters:.1,joinFret:14,pickups:'none',handedness:'right'};

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
  assert.ok(board.min.y<new T.Box3().setFromObject(root.getObjectByName('Fret_20')) .min.y);
  assert.equal(root.animations.length,0); dispose(root);
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
