import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { studioEnvironment } from './studio-environment.js';
import { mergeVertices, mergeGeometries, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { surfaceDetail, finishProperties,coatingDetail,carbonDetail } from './material-detail.js';
import { anisotropyExporter } from './export-anisotropy.js';
import { capturedWood,capturedWoodTint } from './captured-wood.js';
import { componentMaterial,stringMaterial } from './component-materials.js';
import { guitarShadows } from './guitar-lighting.js';
import { carveTop,carveHeight } from './carved-top.js';
import { hammeredRelief } from './tactile-relief.js';
import { rosewoodSample } from './captured-rosewood.js';
import { fingerboardGeometry,fretGeometry,fingerboardSag } from './fingerboard-geometry.js';
export { finishNames } from './material-detail.js';

function accentAt(u,v,d) {
  const s=d.patternScale/100;
  switch(d.pattern) {
    case 'Center Stripe': return Math.abs(u-.5)<.1*s;
    case 'Split': return u>.5;
    case 'Pinstripes': return Math.abs(u-.38)<.015*s || Math.abs(u-.62)<.015*s;
    case 'Diagonal Band': return Math.abs(u-.5+(v-.5)*.35)<.14*s;
    case 'Chevron': return Math.abs(v-(.3+Math.abs(u-.5)*.7))<.06*s;
    case 'Quarter Panels': return (u>.5)!==(v>.5);
    case 'Edge Burst': return Math.hypot((u-.5)*1.7,(v-.5)*1.3)>.55/s;
    default: return false;
  }
}
export const collectionStyles=['Flame / traditional','Quilt / broad body','Burl / slim waist','Ribbon / offset','Ripple / compact','Spalted / sculpted'];
function paintMaterial(d,points,bounds) {
  // Carbon needs eight samples across each smaller tow. Do not increase the
  // memory cost of the other finishes (including the phone reward recipes).
  const size=[d.primaryFinish,d.accentFinish].includes('Carbon Weave')?512:256;
  const color=document.createElement('canvas'), properties=document.createElement('canvas');
  const coating=document.createElement('canvas');coating.width=coating.height=size;
  const cc=coating.getContext('2d'), coat=cc.createImageData(size,size);
  color.width=color.height=properties.width=properties.height=size;
  const c=color.getContext('2d'), p=properties.getContext('2d'), rgb=c.createImageData(size,size), orm=p.createImageData(size,size);
  const heights=new Float32Array(size*size);
  const flakeWeights=new Float32Array(size*size);
  // Chrome is neutral plating, not arbitrary colored metal. Keep colored
  // Polished Metal available for tinted finishes and preserve mixed masks.
  const colors=[d.primary,d.accent].map((hex,i)=>[d.primaryFinish,d.accentFinish][i]==='Chrome'?[196,198,201]:[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)));
  const edges=Array.from({length:size},(_,y)=>{
    if(!points)return [0,1];
    const py=T.MathUtils.lerp(bounds.max.y,bounds.min.y,(y+.5)/size),hits=[];
    for(let i=0;i<points.length;i++) {
      const a=points[i],b=points[(i+1)%points.length];
      if((a.y>py)!==(b.y>py))hits.push(a.x+(b.x-a.x)*(py-a.y)/(b.y-a.y));
    }
    const width=bounds.max.x-bounds.min.x;
    return hits.length?[(Math.min(...hits)-bounds.min.x)/width,(Math.max(...hits)-bounds.min.x)/width]:[0,1];
  });
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const index=(y*size+x)*4, accent=accentAt(x/size,1-y/size,d), finish=accent?d.accentFinish:d.primaryFinish;
    const a=finishProperties(d.primaryFinish),b=finishProperties(d.accentFinish);
    const u=x/size, v=y/size;
    const [left,right]=edges[y], edgeDistance=Math.min(u-left,right-u,v,1-v);
    const burst=d.pattern==='Edge Burst' && Number.isInteger(d.collectionStyle)?1-T.MathUtils.smoothstep(edgeDistance,.015,.12*(d.patternScale/100)):Number(accent);
    const surfaceA=surfaceDetail(d.primaryFinish,u,v,d.seed,d.collectionStyle??0,d.figureStrength??1);
    const surfaceB=surfaceDetail(d.accentFinish,u,v,d.seed,d.collectionStyle??0,d.figureStrength??1);
    const [detail,heightDetail,roughDetail]=surfaceA.map((value,i)=>T.MathUtils.lerp(value,surfaceB[i],burst)*d.textureStrength/100);
    heights[y*size+x]=heightDetail;
    const [rough,metal,clear,pearl,brushed]=a.map((value,i)=>T.MathUtils.lerp(value,b[i],burst));
    flakeWeights[y*size+x]=T.MathUtils.lerp(Number(d.primaryFinish==='Metallic Flake'),Number(d.accentFinish==='Metallic Flake'),burst)*d.textureStrength/100;
    const woodWeight=T.MathUtils.lerp(Number(['Gloss','Matte','Open Pore Wood'].includes(d.primaryFinish)),Number(['Gloss','Matte','Open Pore Wood'].includes(d.accentFinish)),burst);
    const tint=woodWeight?capturedWoodTint(u,v,d.seed):[1,1,1];
    // Subtle retained patina follows the SAME body-space depressions as the
    // mesh. This is material variation, not a painted directional highlight.
    const hammerWeight=d.primaryFinish==='Hammered Metal'?T.MathUtils.lerp(1,Number(d.accentFinish==='Hammered Metal'),burst):0;
    const dent=hammerWeight&&points?-hammeredRelief(T.MathUtils.lerp(bounds.min.x,bounds.max.x,u),T.MathUtils.lerp(bounds.max.y,bounds.min.y,v),points,d.seed)/.00045:0;
    const patina=dent*hammerWeight*Math.sqrt(T.MathUtils.clamp(d.textureStrength/100,0,1));
    colors[0].forEach((value,ch)=>rgb.data[index+ch]=Math.max(0,Math.min(255,(value*(1-burst)+colors[1][ch]*burst)*(1+detail)*T.MathUtils.lerp(1,tint[ch],woodWeight)*(1-patina*[.22,.26,.30][ch]))));
    rgb.data[index+3]=255;
    orm.data[index]=255; orm.data[index+1]=Math.max(0,Math.min(255,(rough+roughDetail+patina*.16)*255)); orm.data[index+2]=metal*255; orm.data[index+3]=255;
    // Three uses R for clearcoat / iridescence and B for anisotropy strength.
    coat.data[index]=clear*255;coat.data[index+1]=pearl*255;coat.data[index+2]=brushed*255;coat.data[index+3]=255;
  }
  c.putImageData(rgb,0,0); p.putImageData(orm,0,0);
  const map=new T.CanvasTexture(color); map.colorSpace=T.SRGBColorSpace;
  const mr=new T.CanvasTexture(properties);
  const normalCanvas=document.createElement('canvas');normalCanvas.width=normalCanvas.height=size;
  const nc=normalCanvas.getContext('2d'),normal=nc.createImageData(size,size);
  const h=(x,y)=>heights[Math.max(0,Math.min(size-1,y))*size+Math.max(0,Math.min(size-1,x))];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
    const dx=(h(x+1,y)-h(x-1,y))*4,dy=(h(x,y+1)-h(x,y-1))*4,length=Math.hypot(dx,dy,1),i=(y*size+x)*4;
    const weight=flakeWeights[y*size+x],flake=weight>0?coatingDetail(x/size,y/size,d.seed):{normalX:0,normalY:0};
    const nx=-dx/length+flake.normalX*weight*.9,ny=dy/length+flake.normalY*weight*.9,nz=1/length,nlen=Math.hypot(nx,ny,nz);
    normal.data[i]=(nx/nlen*.5+.5)*255;normal.data[i+1]=(ny/nlen*.5+.5)*255;normal.data[i+2]=(nz/nlen*.5+.5)*255;normal.data[i+3]=255;
  }
  nc.putImageData(normal,0,0);const normalMap=new T.CanvasTexture(normalCanvas);
  cc.putImageData(coat,0,0);const clearcoatMap=new T.CanvasTexture(coating);
  const material=new T.MeshPhysicalMaterial({map,roughness:1,metalness:1,roughnessMap:mr,metalnessMap:mr,normalMap,normalScale:new T.Vector2(.18,.18),clearcoat:d.clearcoatLimit??1,clearcoatMap,clearcoatRoughness:d.coatRoughness??.18});
  // Enable expensive shader features only when that finish is actually present.
  for(const [name,channel] of [['Pearlescent',1],['Anisotropic',2]]) {
    if(!(name==='Pearlescent'?[d.primaryFinish,d.accentFinish].includes(name):[d.primaryFinish,d.accentFinish].some(f=>['Brushed Metal','Carbon Weave'].includes(f))))continue;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
    const ctx=canvas.getContext('2d'),data=ctx.createImageData(size,size);
    for(let i=0;i<data.data.length;i+=4) {
      const u=(i/4%size)/size,v=Math.floor(i/4/size)/size;
      const finish=accentAt(u,1-v,d)?d.accentFinish:d.primaryFinish;
      const vertical=finish==='Carbon Weave'&&carbonDetail(u,v,d.seed).vertical;
      data.data[i]=name==='Pearlescent'?coat.data[i+channel]:vertical?128:255;
      data.data[i+1]=name==='Pearlescent'?coatingDetail(u,v,d.seed).pearlThickness*255:vertical?255:128;data.data[i+2]=coat.data[i+channel];data.data[i+3]=255;
    }
    ctx.putImageData(data,0,0);const texture=new T.CanvasTexture(canvas);
    if(name==='Pearlescent'){material.iridescence=1;material.iridescenceMap=texture;material.iridescenceThicknessMap=texture;material.iridescenceIOR=1.8;material.iridescenceThicknessRange=[300,650];}
    else {material.anisotropy=1;material.anisotropyMap=texture;}
  }
  material.name='Paint_PBR'; return material;
}
const material=(name,color,roughness=.5,metalness=0)=>Object.assign(new T.MeshStandardMaterial({color,roughness,metalness}),{name});
function timber(name,color,seed) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d'),data=ctx.createImageData(256,256);
  const roughCanvas=document.createElement('canvas');roughCanvas.width=roughCanvas.height=256;
  const rc=roughCanvas.getContext('2d'),rough=rc.createImageData(256,256);
  const rgb=[(color>>16)&255,(color>>8)&255,color&255];
  for(let y=0;y<256;y++)for(let x=0;x<256;x++) {
    const [grain,,roughness]=capturedWood(x/256,y/256,seed);const i=(y*256+x)*4;
    const tint=capturedWoodTint(x/256,y/256,seed);
    for(let c=0;c<3;c++)data.data[i+c]=Math.max(0,Math.min(255,rgb[c]*(1+grain*.8)*tint[c]));
    data.data[i+3]=255;
    rough.data[i]=rough.data[i+1]=rough.data[i+2]=Math.round((.5+roughness*.3)*255);rough.data[i+3]=255;
    if(name==='Fretboard') {
      const sample=rosewoodSample(x/256,y/256);
      for(let c=0;c<3;c++)data.data[i+c]=sample[c];
      rough.data[i]=rough.data[i+1]=rough.data[i+2]=sample[3]*255;
    }
  }
  ctx.putImageData(data,0,0);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  rc.putImageData(rough,0,0);
  const result=material(name,0xffffff,1);result.map=map;result.roughnessMap=new T.CanvasTexture(roughCanvas);return result;
}

export function build(config, design, outline, lod=0) {
  if(!outline?.length || ![0,1,2].includes(lod)) throw new Error('Invalid geometry request');
  if(design.collectionStyle!==undefined && (!Number.isInteger(design.collectionStyle)||design.collectionStyle<0||design.collectionStyle>=collectionStyles.length)) throw new Error('Unknown collection style');
  if(design.bodyStyle!==undefined && (!Number.isInteger(design.bodyStyle)||design.bodyStyle<0||design.bodyStyle>=6)) throw new Error('Unknown body style');
  const root=new T.Group(); root.name=`Guitar_${config.profile}_LOD${lod}`;
  root.userData={units:'meters',upAxis:'Y',frontAxis:'+Z',static:true,lod,construction:{...config},finish:{...design}};
  const acoustic=config.profile.startsWith('acoustic'), bass=config.profile==='bass-doublecut';
  const scale=bass?.0015:acoustic?.00136:.00132, depth=config.bodyDepthMeters;
  const style=design.collectionStyle;
  const bodyStyle=design.bodyStyle??style;
  const proportions=[[1,0,0],[1.12,.03,0],[.95,-.14,0],[1,.03,.018],[.88,.06,0],[1.05,-.18,-.01]][bodyStyle];
  const original=outline.map(([x,y])=>{
    const py=(740-y)*scale, px=(x-256)*scale;
    const waist=Math.exp(-(((py-.29)/.08)**2));
    return new T.Vector3(proportions?px*(proportions[0]+proportions[1]*waist):px,py+(proportions?proportions[2]*Math.sin(px*9):0),0);
  });
  const curve=new T.CatmullRomCurve3(original,true,'centripetal');
  const points=lod===2?original:curve.getPoints(outline.length*(lod===0?6:4)).slice(0,-1);
  const shapeFrom=(list)=>new T.Shape(list.map(p=>new T.Vector2(p.x,p.y)));
  const bounds=new T.Box3().setFromPoints(points), width=bounds.max.x-bounds.min.x,height=bounds.max.y-bounds.min.y;
  const paint=paintMaterial(design,points,bounds), wood=timber('Wood',0x512715,design.seed), fretwood=timber('Fretboard',0x20130e,design.seed+31), steel=material('Nickel',0xb7bac2,.25,1), ivory=material('Nut',0xe5d9b9,.5), black=material('Pickup',0x161819,.48), brass=material('Brass',0xaf8545,.3,.8);
  const quality=Math.max(0,Math.min(3,design.qualityTier??1));
  steel.roughness=[.4,.3,.23,.17][quality];
  if(quality===3)steel.color.setHex(0xd8ba77);
  const plated=componentMaterial('Plated_hardware',steel.color,steel.roughness,1,design.seed);
  let polymer;
  const wound=lod<2?stringMaterial(acoustic,true):null,plain=lod<2?stringMaterial(false,false):null;
  const add=(name,geometry,mat,x=0,y=0,z=0)=>{
    const resolved=mat===steel?plated:mat===black?(polymer??=componentMaterial('Molded_polymer',0x161819,.32,0,design.seed)):mat;
    const mesh=new T.Mesh(geometry,resolved); mesh.name=name; mesh.position.set(x,y,z);
    mesh.receiveShadow=true;
    // Subpixel decorations need not add a separate shadow draw call.
    mesh.castShadow=!/^(String_|Head_string_|Fret_|Inlay_|Screw_slot_|Rosette_tile_|.*binding|.*purfling)/.test(name);
    root.add(mesh); return mesh;
  };
  function plate(name,shape,thickness,z,mat,bevel=0) {
    let geo=new T.ExtrudeGeometry(shape,{depth:thickness,steps:1,curveSegments:lod===0?32:16,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:lod===0?3:1});
    const uv=geo.attributes.uv, pos=geo.attributes.position;
    // Front/back paint uses body-local UVs, never the full-guitar photograph.
    geo.computeBoundingBox();const local=geo.boundingBox;
    const localWidth=local.max.x-local.min.x,localHeight=local.max.y-local.min.y;
    const body=['Body','Soundboard','Back','Body_sides'].includes(name);
    for(let i=0;i<uv.count;i++) {
      if(Math.abs(geo.attributes.normal.getZ(i))<.5)uv.setXY(i,.5+Math.atan2(pos.getX(i),(pos.getY(i)-local.min.y)-localHeight/2)/(2*Math.PI),pos.getZ(i)/Math.max(.001,thickness));
      else uv.setXY(i,(pos.getX(i)-(body?bounds.min.x:local.min.x))/(body?width:localWidth),(pos.getY(i)-(body?bounds.min.y:local.min.y))/(body?height:localHeight));
    }
    if(body&&lod<2) {
      // The utility quantizes positions to .01 units: work in millimeters to
      // avoid merging unrelated thin guitar surfaces in a meter-scale mesh.
      const originalNormals=geo.attributes.normal.clone();
      geo.scale(1000,1000,1000);geo=toCreasedNormals(geo,Math.PI/6);geo.scale(.001,.001,.001);
      // Never interpolate edge normals across the large planar cap triangles.
      for(let i=0;i<originalNormals.count;i++)if(Math.abs(originalNormals.getZ(i))>.999)
        geo.attributes.normal.setXYZ(i,0,0,originalNormals.getZ(i));
    }
    if((Array.isArray(mat)?mat:[mat]).some(m=>m.normalMap)) {
      const carvedBody=name==='Body'&&config.profile==='electric-singlecut';
      const tactile=['Body','Soundboard'].includes(name)&&design.primaryFinish==='Hammered Metal';
      if(lod<2&&(carvedBody||tactile)) {
        const heightAt=(x,y,outline)=>(carvedBody?carveHeight(x,y,outline):0)+(tactile?hammeredRelief(x,y,outline,design.seed):0);
        const carved=carveTop(geo,points,thickness,lod,heightAt,tactile?(lod===0?.006:.012):undefined);geo.dispose();geo=carved;
      }
      const indexed=mergeVertices(geo);geo.dispose();geo=indexed;geo.computeTangents();
      // Side faces use untextured wood and may have collapsed planar UVs.
      // Supply a valid orthogonal basis there as well for portable GLB accessors.
      const tangents=geo.attributes.tangent,normals=geo.attributes.normal;
      for(let i=0;i<tangents.count;i++) if(Math.hypot(tangents.getX(i),tangents.getY(i),tangents.getZ(i))<.5) {
        const n=new T.Vector3().fromBufferAttribute(normals,i),axis=Math.abs(n.z)<.9?new T.Vector3(0,0,1):new T.Vector3(0,1,0),t=axis.cross(n).normalize();
        tangents.setXYZW(i,t.x,t.y,t.z,1);
      }
    }
    return add(name,geo,mat,0,0,z);
  }
  if(acoustic) {
    const top=shapeFrom(points), hole=new T.Path(); hole.absarc(0,.345,.047,0,Math.PI*2,true); top.holes.push(hole);
    plate('Soundboard',top,.003,depth/2-.003,[paint,wood]);
    // Dark interior and finished exterior must not share the same appearance.
    const back=plate('Back',shapeFrom(points),.003,-depth/2,[wood,material('Cavity_wood',0x160d08,.9)]);
    const bg=back.geometry,bn=bg.attributes.normal;
    bg.clearGroups();let start=0,last=-1;
    for(let i=0;i<bn.count;i+=3) {
      const materialIndex=bn.getZ(i)>.9?1:0;
      if(last!==materialIndex){if(i>start)bg.addGroup(start,i-start,last);start=i;last=materialIndex;}
    }
    bg.addGroup(start,bn.count-start,last);
    const rim=shapeFrom(points);
    rim.holes.push(new T.Path(points.map(p=>new T.Vector2(p.x*.93,.25+(p.y-.25)*.93)).reverse()));
    plate('Body_sides',rim,depth-.006,-depth/2+.003,wood);
    add('Rosette',new T.TorusGeometry(.050,.0012,6,lod===0?64:32),brass,0,.345,depth/2+.0005);
  } else {
    // Opaque coatings wrap the body; transparent wood finishes retain wood sides.
    const exposedWood=['Gloss','Matte','Open Pore Wood'].includes(design.primaryFinish);
    plate('Body',shapeFrom(points),depth-.008,-depth/2+.004,[paint,exposedWood?wood:paint],.004);
  }
  if(proportions && quality>=1) {
    // Closed raised perimeter trim: real geometry, shared by preview and GLB.
    const trim=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p.x*.986,.25+(p.y-.25)*.986,depth/2+.0008+(config.profile==='electric-singlecut'&&lod<2?carveHeight(p.x*.986,.25+(p.y-.25)*.986,points):0))),true,'centripetal');
    add('Body_binding',new T.TubeGeometry(trim,lod===0?points.length*2:points.length,.0015,lod===0?6:4,true),ivory);
    if(acoustic) {
      const backTrim=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p.x*.995,p.y,-depth/2-.0005)),true,'centripetal');
      add('Back_binding',new T.TubeGeometry(backTrim,points.length,.0011,4,true),ivory);
    }
    if(acoustic && style%2===1) add('Outer_rosette',new T.TorusGeometry(.054,.001,6,lod===0?64:32),ivory,0,.345,depth/2+.0005);
  }
  const scaleLength=config.scaleLengthMm/1000, nutWidth=config.nutWidthMm/1000, spacing=config.bridgeSpacingMm/1000;
  const bridge=.19,nut=bridge+scaleLength,joint=nut-scaleLength*(1-2**(-config.joinFret/12));
  const end=nut-scaleLength*(1-2**(-config.frets/12))-.012, heelWidth=Math.max(nutWidth+.012,spacing*.92), front=depth/2;
  const taper=(bottom)=>new T.Shape([new T.Vector2(-nutWidth/2,nut),new T.Vector2(nutWidth/2,nut),new T.Vector2(heelWidth/2,bottom),new T.Vector2(-heelWidth/2,bottom)]);
  plate('Neck',taper(joint-.015),.021,front-.021,wood,.002);
  // Rounded C-section on the back, rather than an exposed rectangular plank.
  const neck=root.getObjectByName('Neck'),neckBottom=joint-.015,neckLength=nut-neckBottom;
  const neckBack=new T.CylinderGeometry(nutWidth/2,heelWidth/2,neckLength,lod===0?24:12,1,false,Math.PI/2,Math.PI);
  const np=neckBack.attributes.position;
  for(let i=0;i<np.count;i++) {
    const ratio=(np.getY(i)+neckLength/2)/neckLength,radius=T.MathUtils.lerp(heelWidth/2,nutWidth/2,ratio);
    np.setZ(i,np.getZ(i)*.020/radius);
  }
  neckBack.computeVertexNormals();neck.geometry.dispose();neck.geometry=neckBack;
  neck.position.set(0,(nut+neckBottom)/2,front);
  add('Fretboard',fingerboardGeometry(nut,end,nutWidth,heelWidth),fretwood,0,0,front);
  if(quality>=2) {
    // Slim contrasting fretboard edge strips; no new material or texture cost.
    for(const side of [-1,1]) {
      const a=new T.Vector3(side*(nutWidth/2+.0005),nut,front+.002-fingerboardSag(nutWidth/2));
      const b=new T.Vector3(side*(heelWidth/2+.0005),end,front+.002-fingerboardSag(heelWidth/2)),delta=b.clone().sub(a);
      const trim=add(`Fretboard_binding_${side}`,new T.CylinderGeometry(.00065,.00065,delta.length(),4),ivory);
      trim.position.copy(a).add(b).multiplyScalar(.5);trim.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
    }
  }
  const paired=acoustic||config.profile==='electric-singlecut';
  const headLength=bass?.205:paired?.15:.175, headWidth=Math.max(nutWidth*1.5,.06);
  plate('Headstock',new T.Shape([
    new T.Vector2(-nutWidth/2,nut),new T.Vector2(nutWidth/2,nut),
    new T.Vector2(headWidth*.43,nut+headLength*.22),new T.Vector2(headWidth*.49,nut+headLength*.82),
    new T.Vector2(headWidth*.32,nut+headLength*.98),new T.Vector2(0,nut+headLength),new T.Vector2(-headWidth*.32,nut+headLength*.98),
    new T.Vector2(-headWidth*.49,nut+headLength*.82),new T.Vector2(-headWidth*.43,nut+headLength*.22)
  ]),.014,front-.014,material('Headstock_finish',quality>=2?0x211a18:design.primary,.35),.002);
  function box(name,w,h,d,x,y,z,mat) {
    // Small manufactured edge radii catch reflections without extra draw calls.
    // Tiny marquetry remains simple, and the lowest LOD retains plain boxes.
    const rounded=lod<2&&!name.startsWith('Rosette_tile_');
    const geometry=rounded?new RoundedBoxGeometry(w,h,d,lod===0?2:1,Math.min(.0012,Math.min(w,h,d)*.22)):new T.BoxGeometry(w,h,d);
    return add(name,geometry,mat,x,y,z);
  }
  box('Nut',nutWidth,.004,.005,0,nut,front+.006,ivory);
  if(quality>=1) {
    const emblem=add('Headstock_inlay',new T.CircleGeometry(.006,4),ivory,0,nut+headLength*.80,front+.0025);
    emblem.scale.y=1.8;
    if(quality===3) {
      for(const side of [-1,1]) {
        const flourish=add(`Headstock_flourish_${side}`,new T.CircleGeometry(.003,4),brass,side*.010,nut+headLength*.80,front+.0025);
        flourish.scale.y=2.5;
      }
    }
  }
  if(acoustic) {
    // Gently tapered bridge wings, with a raised center supporting the saddle.
    const bridgeShape=new T.Shape([[-.075,-.009],[-.073,.008],[-.038,.011],[.038,.011],[.073,.008],[.075,-.009],[.034,-.013],[-.034,-.013]].map(([x,y])=>new T.Vector2(x,bridge+y)));
    plate('Bridge',bridgeShape,.007,front+.003,fretwood,.001);
    box('Bridge_center',.069,.021,.004,0,bridge,front+.011,fretwood);
  } else box('Bridge',.09,.025,.01,0,bridge,front+.008,steel);
  if(acoustic) box('Saddle',spacing+.005,.003,.003,0,bridge,front+.015,ivory);
  // Distinct bridge details instead of a featureless rectangular block.
  for(let i=0;i<config.strings;i++) {
    const x=-spacing/2+i*spacing/(config.strings-1);
    if(acoustic) {
      const pin=add(`Bridge_pin_${i+1}`,new T.SphereGeometry(.0028,8,6),ivory,x,bridge-.008,front+.014);
      pin.scale.z=.6;
    } else {
      box(`Bridge_saddle_${i+1}`,Math.min(.008,spacing/(config.strings-1)*.8),.014,.003,x,bridge,front+.0155,steel);
      if(lod<2) {
        const screw=add(`Bridge_adjuster_${i+1}`,new T.CylinderGeometry(.001,.001,.009,6),steel,x,bridge-.010,front+.011);
        screw.castShadow=false;
        // Small height screws flank the string rather than blocking its path.
        for(const side of [-1,1]) {
          const socket=add(`Bridge_socket_${i+1}_${side}`,new T.CircleGeometry(.00075,6),black,x+side*.0023,bridge+.003,front+.0171);
          socket.castShadow=false;
        }
      }
    }
  }
  if(quality>=2 && acoustic) {
    add('Premium_rosette',new T.TorusGeometry(.056,.0008,6,48),brass,0,.345,front+.001);
    // Bounded alternating marquetry segments; no transparent overlay or animation.
    for(let i=0;i<24;i++) {
      const angle=i*Math.PI/12;
      const tile=box(`Rosette_tile_${i}`,.0025,.0015,.0006,Math.cos(angle)*.053, .345+Math.sin(angle)*.053,front+.001, i%2?ivory:brass);
      tile.rotation.z=angle;
    }
  }
  if(quality===3) {
    const purfling=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p.x*.97,.25+(p.y-.25)*.97,front+.001+(config.profile==='electric-singlecut'&&lod<2?carveHeight(p.x*.97,.25+(p.y-.25)*.97,points):0))),true,'centripetal');
    add('Premium_purfling',new T.TubeGeometry(purfling,points.length,.0007,4,true),brass);
  }
  if(proportions && style%2===0) {
    const guard=acoustic?[[.054,.35],[.085,.36],[.105,.33],[.10,.27],[.055,.25],[.037,.275],[.05,.30]]:[[.043,.35],[.064,.344],[.085,.303],[.077,.26],[.045,.245]];
    const guardCurve=new T.CatmullRomCurve3(guard.map(([x,y])=>new T.Vector3(x,y,0)),true,'centripetal');
    plate('Pickguard',new T.Shape(guardCurve.getPoints(lod===0?64:32).slice(0,-1).map(p=>new T.Vector2(p.x,p.y))),.0015,front+.001,black);
  }
  if(lod<2) {
    for(let f=1;f<=config.frets;f++) {
      const distance=scaleLength*(1-2**(-f/12)),y=nut-distance,ratio=Math.min(1,distance/(nut-end));
      add(`Fret_${f}`,fretGeometry(nutWidth+(heelWidth-nutWidth)*ratio-.0005),steel,0,y,front+.0048);
      if([3,5,7,9,12,15,17,19,21,24].includes(f)) {
        const previous=scaleLength*(1-2**(-(f-1)/12)), markerY=nut-(distance+previous)/2;
        for(const x of f%12===0?[-.008,.008]:[0]) {
          const geometry=quality===3?new T.PlaneGeometry(.016,.006):quality===2?new T.CircleGeometry(.004,4):new T.CircleGeometry(.0025,12);
          const ip=geometry.attributes.position;
          for(let i=0;i<ip.count;i++)ip.setZ(i,-fingerboardSag(ip.getX(i)+x));
          geometry.computeVertexNormals();
          add(`Inlay_${f}_${x}`,geometry,ivory,x,markerY,front+.0041);
        }
      }
    }
    for(let i=0;i<config.strings;i++) {
      const t=i/(config.strings-1), nx=-nutWidth*.42+t*nutWidth*.84,bx=-spacing/2+t*spacing;
      const a=new T.Vector3(nx,nut,front+.010),b=new T.Vector3(bx,bridge,front+.017),delta=b.clone().sub(a);
      const radius=(bass?.00055:.00018)+(1-t)*(bass?.0003:.0003);
      const stringGeometry=new T.CylinderGeometry(radius,radius,delta.length(),lod===0?8:5,1,true);
      stringGeometry.computeTangents();
      const string=add(`String_${i+1}`,stringGeometry,i<(bass?config.strings:acoustic?config.strings-2:config.strings-3)?wound:plain);
      string.position.copy(a).add(b).multiplyScalar(.5); string.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
      // Continue over the saddle into the anchor: strings must not end in midair.
      const anchor=new T.Vector3(bx,bridge-(acoustic?.008:config.pickups==='hh'?.031:.011),front+(acoustic?.013:config.pickups==='hh'?.010:.006));
      const tailDelta=anchor.clone().sub(b);
      const tail=add(`String_anchor_${i+1}`,new T.CylinderGeometry(radius,radius,tailDelta.length(),4,1,true),string.material);
      tail.position.copy(b).add(anchor).multiplyScalar(.5);tail.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),tailDelta.normalize());
    }
  }
  for(let i=0;i<config.strings;i++) {
    const side=paired?(i<Math.ceil(config.strings/2)?-1:1):-1;
    const row=paired?(side<0?i:config.strings-1-i):i,rows=paired?Math.ceil(config.strings/2):config.strings;
    const y=nut+.028+row*(headLength-.055)/Math.max(1,rows-1),x=side*headWidth*.48;
    const post=add(`Tuning_post_${i+1}`,new T.CylinderGeometry(.003,.003,.018,lod===0?12:6),steel,x*.72,y,front+.001);
    post.rotation.x=Math.PI/2;
    const key=add(`Tuning_key_${i+1}`,new T.SphereGeometry(.008,lod===0?16:8,8),steel,x+side*.006,y,front-.009);
    key.scale.set(1,.72,.4);
    if(lod<2) {
      box(`Tuner_housing_${i+1}`,.012,.016,.008,x*.72,y,front-.019,steel);
      const a=new T.Vector3(x*.72,y,front-.015),b=new T.Vector3(x+side*.006,y,front-.009),delta=b.clone().sub(a);
      const shaft=add(`Tuner_shaft_${i+1}`,new T.CylinderGeometry(.0018,.0018,delta.length(),8),steel);
      shaft.position.copy(a).add(b).multiplyScalar(.5);shaft.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
    }
    add(`Tuning_collar_${i+1}`,new T.TorusGeometry(.004,.001,4,10),steel,x*.72,y,front+.002);
    if(lod<2) {
      const start=new T.Vector3(-nutWidth*.42+i/(config.strings-1)*nutWidth*.84,nut,front+.010);
      const stop=new T.Vector3(x*.72,y,front+.010),delta=stop.clone().sub(start);
      const run=add(`Head_string_${i+1}`,new T.CylinderGeometry(.00022,.00022,delta.length(),4),plain);
      run.position.copy(start).add(stop).multiplyScalar(.5);run.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
    }
  }
  if(!acoustic) {
    // Neck pickup must clear the end of the actual fretboard, including 24 frets.
    const splitBass=config.pickups==='p'||config.pickups==='pj';
    const neckPickup=splitBass?Math.min(end-.030,.365):end-(config.pickups==='hh'?.024:.015);
    const locations=config.pickups==='sss'?[.255,(.255+neckPickup)/2,neckPickup]:config.pickups==='hh'?[.26,neckPickup]:config.pickups==='p'||config.pickups==='pj'?[neckPickup,...(config.pickups==='pj'?[.255]:[])]:[];
    locations.forEach((y,i)=>{
      if(splitBass&&i===0) {
        // Two offset coils, each covering a subset of strings; not a full-width bar.
        // Double poles flank each string (Seymour Duncan's split-coil anatomy).
        const split=Math.ceil(config.strings/2);
        for(const [half,first,last,offset] of [[0,0,split-1,.011],[1,split,config.strings-1,-.011]]) {
          const py=y+offset,fraction=(py-bridge)/(nut-bridge);
          const span=T.MathUtils.lerp(spacing,nutWidth*.84,fraction);
          const stringX=index=>-span/2+index*span/(config.strings-1);
          const left=stringX(first),right=stringX(last);
          box(`Pickup_split_${half+1}`,right-left+.014,.018,.01,(left+right)/2,py,front+.009,black);
          if(lod<2)for(let s=first;s<=last;s++)for(const side of [-1,1]) {
            const pole=add(`Pickup_split_${half+1}_pole_${s+1}_${side}`,new T.CylinderGeometry(.0017,.0017,.001,lod===0?10:6),steel,stringX(s)+side*.0026,py,front+.0145);
            pole.rotation.x=Math.PI/2;pole.castShadow=false;
          }
        }
        return;
      }
      const humbucker=config.pickups==='hh',covered=humbucker&&quality>=2;
      if(humbucker) {
        box(`Pickup_ring_${i+1}`,.077,.043,.003,0,y,front+.006,quality>=1?ivory:black);
        box(`Pickup_${i+1}`,.068,.035,.006,0,y,front+.008,black);
        if(covered) box(`Pickup_cover_${i+1}`,.065,.032,.006,0,y,front+.0115,steel);
        else for(const side of [-1,1]) {
          // Seeded cream/black bobbins give an unbranded, reproducible zebra option.
          const zebra=quality>=1&&Math.abs(Math.trunc(design.seed))%2===1;
          box(`Pickup_bobbin_${i+1}_${side}`,.065,.015,.004,0,y+side*.0085,front+.012,zebra&&side===1?ivory:black);
        }
        if(lod<2) for(const x of [-.035,.035])for(const dy of [-.018,.018]) {
          add(`Pickup_mount_${i}_${x}_${dy}`,new T.CircleGeometry(.0014,8),steel,x,y+dy,front+.0077);
        }
      } else box(`Pickup_${i+1}`,.068,.017,.01,0,y,front+.009,black);
      if(lod<2) for(let pole=0;pole<config.strings;pole++) {
        // Follow the actual taper from bridge spacing to nut spacing.
        const fraction=(y-bridge)/(nut-bridge),poleSpan=T.MathUtils.lerp(spacing,nutWidth*.84,fraction);
        const poleX=-poleSpan/2+pole*poleSpan/(config.strings-1),poleY=y+(humbucker?.0085:0);
        const cap=add(`Pickup_${i+1}_pole_${pole+1}`,new T.CylinderGeometry(.002,.002,.001,lod===0?10:6),steel,poleX,poleY,front+.0145);cap.rotation.x=Math.PI/2;
        if(humbucker) {
          add(`Screw_slot_${i}_${pole}`,new T.PlaneGeometry(.0028,.00045),black,poleX,poleY,front+.0151);
          if(!covered) {
            const slug=add(`Pickup_${i+1}_slug_${pole+1}`,new T.CylinderGeometry(.002,.002,.001,lod===0?10:6),steel,poleX,y-.0085,front+.0145);slug.rotation.x=Math.PI/2;
          }
        }
      }
    });
    if(config.pickups==='hh') box('Stop_tailpiece',.074,.009,.008,0,bridge-.031,front+.010,steel);
    for(let i=0;i<(config.pickups==='hh'?4:2);i++) {
      const profile=[[.001,-.005],[.008,-.005],[.009,-.003],[.008,.003],[.006,.006],[.001,.006]].map(([r,h])=>new T.Vector2(r,h));
      const knobGeometry=new T.LatheGeometry(profile,lod===0?24:12);knobGeometry.normalizeNormals();
      const controlX=.09+(i%2)*.038,controlY=.14+Math.floor(i/2)*.055;
      const controlZ=front+.005+(config.profile==='electric-singlecut'&&lod<2?carveHeight(controlX,controlY,points):0);
      const knob=add(`Control_${i+1}`,knobGeometry,black,controlX,controlY,controlZ); knob.rotation.x=Math.PI/2;
      if(lod<2) {
        add(`Control_cap_${i+1}`,new T.CircleGeometry(.0055,16),quality>=2?steel:black,controlX,controlY,controlZ+.0061);
        box(`Control_pointer_${i+1}`,.0007,.003,.00025,controlX,controlY+.0025,controlZ+.0063,ivory);
      }
    }
  }
  // Batch subpixel hardware by material to preserve the phone draw-call budget.
  // Strings stay separate for selection/highlighting.
  const detailGroups=new Map();
  for(const mesh of root.children.filter(m=>/^(Bridge_adjuster_|Bridge_socket_|Pickup_mount_|Control_cap_|Control_pointer_)/.test(m.name))) {
    mesh.updateMatrix();
    const geo=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
    geo.applyMatrix4(mesh.matrix);
    const group=detailGroups.get(mesh.material)??[];group.push(geo);detailGroups.set(mesh.material,group);
    root.remove(mesh);mesh.geometry.dispose();
  }
  for(const [mat,geometries] of detailGroups) {
    const merged=mergeGeometries(geometries);
    geometries.forEach(g=>g.dispose());
    add(`Hardware_details_${mat.name}`,merged,mat).castShadow=false;
  }
  if(config.handedness==='left') root.scale.x=-1;
  steel.dispose();black.dispose();
  root.updateMatrixWorld(true);
  root.userData.statistics=statistics(root);
  return root;
}
export function statistics(root) {
  let triangles=0,meshes=0;
  root.traverse(node=>{if(node.isMesh){meshes++;triangles+=(node.geometry.index?.count || node.geometry.attributes.position.count)/3;}});
  const bounds=new T.Box3().setFromObject(root),size=bounds.getSize(new T.Vector3());
  return {triangles,meshes,sizeMeters:size.toArray()};
}
export function dispose(root) {
  const materials=new Set(),textures=new Set();
  root.traverse(node=>{if(node.isMesh){node.geometry.dispose();for(const m of Array.isArray(node.material)?node.material:[node.material])materials.add(m);}});
  for(const m of materials){for(const value of Object.values(m))if(value?.isTexture)textures.add(value);m.dispose();}
  for(const texture of textures)texture.dispose();
}
export async function glb(root) {
  const exporter=new GLTFExporter();exporter.register(anisotropyExporter);
  return new Blob([await exporter.parseAsync(root,{binary:true,animations:[],onlyVisible:true})],{type:'model/gltf-binary'});
}
export function obj(root) {
  root.updateMatrixWorld(true);
  const exportRoot=new T.Group(),geometries=[];
  try {
    root.traverseVisible(source=>{
      if(!source.isMesh||source.userData.isStringGlow)return;
      const geometry=source.geometry.clone();geometries.push(geometry);
      // OBJExporter transforms positions/normals but does not reverse mirrored faces.
      if(source.matrixWorld.determinant()<0) {
        if(!geometry.index)geometry.setIndex(Array.from({length:geometry.attributes.position.count},(_,i)=>i));
        const indices=geometry.index;
        for(let i=0;i<indices.count;i+=3){const b=indices.getX(i+1);indices.setX(i+1,indices.getX(i+2));indices.setX(i+2,b);}
      }
      const mesh=new T.Mesh(geometry,source.material);mesh.name=source.name;
      mesh.matrixAutoUpdate=false;mesh.matrix.copy(source.matrixWorld);exportRoot.add(mesh);
    });
    exportRoot.updateMatrixWorld(true);
    return '# Guitar Finish Studio — current preview geometry; meters, Y up, +Z front\n# Materials/textures omitted; use GLB for PBR finishes.\n'+new OBJExporter().parse(exportRoot).replace(/^usemtl .*\n/gm,'');
  } finally {geometries.forEach(g=>g.dispose());}
}
export async function inspectGLB(blob) {
  const loaded=await new GLTFLoader().parseAsync(await blob.arrayBuffer(),'');
  try {
    const materials=new Map();
    loaded.scene.traverse(node=>{if(node.isMesh)for(const m of Array.isArray(node.material)?node.material:[node.material])materials.set(m.uuid,{name:m.name,anisotropy:m.anisotropy??0,hasAnisotropyMap:!!m.anisotropyMap,iridescence:m.iridescence??0,hasIridescenceThicknessMap:!!m.iridescenceThicknessMap,iridescenceThicknessRange:m.iridescenceThicknessRange,hasClearcoatMap:!!m.clearcoatMap});});
    return {...statistics(loaded.scene),animations:loaded.animations.length,materials:[...materials.values()]};
  }
  finally { dispose(loaded.scene); }
}
export function collision(root) {
  const group=new T.Group(); group.name='Collision_proxies';
  for(const label of ['Body','Soundboard','Neck','Headstock']) {
    const part=root.getObjectByName(label); if(!part)continue;
    const bounds=new T.Box3().setFromObject(part),size=bounds.getSize(new T.Vector3());
    if(label==='Soundboard')size.z=root.userData.construction.bodyDepthMeters;
    const mesh=new T.Mesh(new T.BoxGeometry(size.x,size.y,size.z),material('Collision',0x44ff88,1));
    mesh.name=`COL_${label}`; mesh.position.copy(bounds.getCenter(new T.Vector3())); if(label==='Soundboard')mesh.position.z=0;
    mesh.userData={collisionOnly:true,shape:'box'}; group.add(mesh);
  }
  return group;
}
function stage(canvas,width,height) {
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.setSize(width,height,false); renderer.setPixelRatio(1); renderer.toneMapping=T.ACESFilmicToneMapping;
  const scene=new T.Scene(), camera=new T.PerspectiveCamera(32,width/height,.01,20);
  const env=studioEnvironment(renderer);
  scene.environment=env.texture; scene.environmentIntensity=.65;
  scene.add(new T.HemisphereLight(0xffffff,0x353048,.45));
  const light=new T.DirectionalLight(0xffffff,2);light.position.set(2,3,4);scene.add(light);
  guitarShadows(renderer,scene,light,1024);
  return {renderer,scene,camera};
}
let captureStage;
export function snapshot(target,root) {
  if(!captureStage)captureStage=stage(document.createElement('canvas'),512,768);
  const {renderer,scene,camera}=captureStage;
  const size=new T.Box3().setFromObject(root).getSize(new T.Vector3()), center=new T.Box3().setFromObject(root).getCenter(new T.Vector3());
  camera.position.set(center.x+size.y*.42,center.y+size.y*.06,size.y*2);camera.lookAt(center);
  scene.add(root); renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera); scene.remove(root);
  const ctx=target.getContext('2d');ctx.clearRect(0,0,target.width,target.height);ctx.drawImage(renderer.domElement,0,0,target.width,target.height);
}
export function viewer(canvas) {
  const {renderer,scene,camera}=stage(canvas,512,600);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=false;
  let model,lastHeight;
  const render=()=>renderer.render(scene,camera);
  controls.addEventListener('change',render);
  const observer=new ResizeObserver(()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(w&&h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();render();}});observer.observe(canvas);
  return {set(root){
    const offset=model?camera.position.clone().sub(controls.target):null;
    if(model){scene.remove(model);dispose(model);}model=root;scene.add(root);renderer.shadowMap.needsUpdate=true;
    const bounds=new T.Box3().setFromObject(root),center=bounds.getCenter(new T.Vector3()),height=bounds.getSize(new T.Vector3()).y;
    if(offset)camera.position.copy(center).add(offset.multiplyScalar(height/lastHeight));
    else camera.position.set(.5,center.y+.05,height*1.8);
    lastHeight=height;controls.target.copy(center);controls.update();render();return statistics(root);
  }};
}
