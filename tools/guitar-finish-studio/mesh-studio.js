import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const finishes = {
  Gloss: [.24, 0], Matte: [.85, 0], 'Metallic Flake': [.3, .75],
  Pearlescent: [.27, .18], 'Brushed Metal': [.48, .9], 'Carbon Weave': [.42, .05],
};
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
function paintMaterial(d) {
  const size=256, color=document.createElement('canvas'), properties=document.createElement('canvas');
  color.width=color.height=properties.width=properties.height=size;
  const c=color.getContext('2d'), p=properties.getContext('2d'), rgb=c.createImageData(size,size), orm=p.createImageData(size,size);
  const heights=new Float32Array(size*size);
  const colors=[d.primary,d.accent].map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)));
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const index=(y*size+x)*4, accent=accentAt(x/size,1-y/size,d), finish=accent?d.accentFinish:d.primaryFinish;
    const [rough,metal]=finishes[finish] || finishes.Gloss;
    const phase=d.seed*.013, u=x/size, v=y/size;
    const figures=[
      Math.sin(v*105+Math.sin(u*19+phase)*3),
      Math.sin(u*42+Math.sin(v*35+phase)*2)*Math.cos(v*38+Math.sin(u*23)),
      Math.sin(Math.hypot((u-.4)*65,(v-.55)*48)+Math.sin(u*22+phase)*3),
      Math.sin(u*80+Math.sin(v*11+phase)*7),
      Math.sin(Math.hypot(u-.5,v-.5)*130+Math.sin(u*13+phase)*2),
      1-2*Math.exp(-Math.abs(Math.sin(u*29+Math.sin(v*17+phase)*3))*15),
    ];
    const fineGrain=Math.sin(u*670+Math.sin(v*21+phase)*4+Math.sin(u*83)*2);
    const grain=Number.isInteger(d.collectionStyle)?figures[d.collectionStyle]*.22+fineGrain*.07:Math.sin(x*1.9 + Math.sin(y*.06)*2 + d.seed)*.015;
    const weave=((Math.floor(x/3)+Math.floor(y/3))%4<2 ? Math.sin(x*2) : Math.sin(y*2))*.09;
    const rawNoise=Math.sin(x*127.1+y*311.7+d.seed)*43758.5453;
    const noise=(rawNoise-Math.floor(rawNoise))*2-1;
    const detail=(finish==='Carbon Weave'?weave:finish==='Brushed Metal'?Math.sin(y*3)*.025:finish==='Metallic Flake'?noise*.04:grain)*d.textureStrength/100;
    // Figured wood under lacquer changes color, not deeply embossed geometry.
    heights[y*size+x]=detail*(Number.isInteger(d.collectionStyle) && ['Gloss','Matte','Pearlescent'].includes(finish)?.08:1);
    const burst=d.pattern==='Edge Burst' && Number.isInteger(d.collectionStyle)?T.MathUtils.smoothstep(Math.hypot((u-.5)*1.7,(.5-v)*1.3),.40/(d.patternScale/100),.72/(d.patternScale/100)):Number(accent);
    colors[0].forEach((value,ch)=>rgb.data[index+ch]=Math.max(0,Math.min(255,(value*(1-burst)+colors[1][ch]*burst)*(1+detail))));
    rgb.data[index+3]=255;
    orm.data[index]=255; orm.data[index+1]=Math.max(0,Math.min(255,(rough+detail)*255)); orm.data[index+2]=metal*255; orm.data[index+3]=255;
  }
  c.putImageData(rgb,0,0); p.putImageData(orm,0,0);
  const map=new T.CanvasTexture(color); map.colorSpace=T.SRGBColorSpace;
  const mr=new T.CanvasTexture(properties);
  const normalCanvas=document.createElement('canvas');normalCanvas.width=normalCanvas.height=size;
  const nc=normalCanvas.getContext('2d'),normal=nc.createImageData(size,size);
  const h=(x,y)=>heights[Math.max(0,Math.min(size-1,y))*size+Math.max(0,Math.min(size-1,x))];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
    const dx=(h(x+1,y)-h(x-1,y))*4,dy=(h(x,y+1)-h(x,y-1))*4,length=Math.hypot(dx,dy,1),i=(y*size+x)*4;
    normal.data[i]=(-dx/length*.5+.5)*255;normal.data[i+1]=(dy/length*.5+.5)*255;normal.data[i+2]=(1/length*.5+.5)*255;normal.data[i+3]=255;
  }
  nc.putImageData(normal,0,0);const normalMap=new T.CanvasTexture(normalCanvas);
  const material=new T.MeshStandardMaterial({map,roughness:1,metalness:1,roughnessMap:mr,metalnessMap:mr,normalMap,normalScale:new T.Vector2(.35,.35)});
  material.name='Paint_PBR'; return material;
}
const material=(name,color,roughness=.5,metalness=0)=>Object.assign(new T.MeshStandardMaterial({color,roughness,metalness}),{name});

export function build(config, design, outline, lod=0) {
  if(!outline?.length || ![0,1,2].includes(lod)) throw new Error('Invalid geometry request');
  if(design.collectionStyle!==undefined && (!Number.isInteger(design.collectionStyle)||design.collectionStyle<0||design.collectionStyle>=collectionStyles.length)) throw new Error('Unknown collection style');
  const root=new T.Group(); root.name=`Guitar_${config.profile}_LOD${lod}`;
  root.userData={units:'meters',upAxis:'Y',frontAxis:'+Z',static:true,lod,construction:{...config},finish:{...design}};
  const acoustic=config.profile.startsWith('acoustic'), bass=config.profile==='bass-doublecut';
  const scale=bass?.0015:acoustic?.00136:.00132, depth=config.bodyDepthMeters;
  const style=design.collectionStyle;
  const proportions=[[1,0,0],[1.12,.03,0],[.95,-.14,0],[1,.03,.018],[.88,.06,0],[1.05,-.18,-.01]][style];
  const original=outline.map(([x,y])=>{
    const py=(740-y)*scale, px=(x-256)*scale;
    const waist=Math.exp(-(((py-.29)/.08)**2));
    return new T.Vector3(proportions?px*(proportions[0]+proportions[1]*waist):px,py+(proportions?proportions[2]*Math.sin(px*9):0),0);
  });
  const curve=new T.CatmullRomCurve3(original,true,'centripetal');
  const points=lod===2?original:curve.getPoints(outline.length*(lod===0?3:2)).slice(0,-1);
  const shapeFrom=(list)=>new T.Shape(list.map(p=>new T.Vector2(p.x,p.y)));
  const bounds=new T.Box3().setFromPoints(points), width=bounds.max.x-bounds.min.x,height=bounds.max.y-bounds.min.y;
  const paint=paintMaterial(design), wood=material('Wood',0x512715,.65), fretwood=material('Fretboard',0x20130e,.72), steel=material('Nickel',0xb7bac2,.25,1), ivory=material('Nut',0xe5d9b9,.5), black=material('Pickup',0x161819,.48), brass=material('Brass',0xaf8545,.3,.8);
  const add=(name,geometry,mat,x=0,y=0,z=0)=>{
    const mesh=new T.Mesh(geometry,mat); mesh.name=name; mesh.position.set(x,y,z); root.add(mesh); return mesh;
  };
  function plate(name,shape,thickness,z,mat,bevel=0) {
    let geo=new T.ExtrudeGeometry(shape,{depth:thickness,steps:1,curveSegments:lod===0?32:16,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:lod===0?3:1});
    const uv=geo.attributes.uv, pos=geo.attributes.position;
    // Front/back paint uses body-local UVs, never the full-guitar photograph.
    for(let i=0;i<uv.count;i++) uv.setXY(i,(pos.getX(i)-bounds.min.x)/width,(pos.getY(i)-bounds.min.y)/height);
    if((Array.isArray(mat)?mat:[mat]).some(m=>m.normalMap)) {
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
    // Unpainted inner back is visible through the real opening.
    plate('Back',shapeFrom(points),.003,-depth/2,wood);
    const rim=shapeFrom(points);
    rim.holes.push(new T.Path(points.map(p=>new T.Vector2(p.x*.93,.25+(p.y-.25)*.93)).reverse()));
    plate('Body_sides',rim,depth-.006,-depth/2+.003,wood);
    add('Rosette',new T.TorusGeometry(.050,.0012,6,lod===0?64:32),brass,0,.345,depth/2+.0005);
  } else plate('Body',shapeFrom(points),depth-.008,-depth/2+.004,[paint,wood],.004);
  if(proportions) {
    // Closed raised perimeter trim: real geometry, shared by preview and GLB.
    const trim=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p.x*.986,.25+(p.y-.25)*.986,depth/2+.0008)),true,'centripetal');
    add('Body_binding',new T.TubeGeometry(trim,lod===0?points.length*2:points.length,.0015,lod===0?6:4,true),ivory);
    if(acoustic && style%2===1) add('Outer_rosette',new T.TorusGeometry(.054,.001,6,lod===0?64:32),ivory,0,.345,depth/2+.0005);
  }
  const scaleLength=config.scaleLengthMm/1000, nutWidth=config.nutWidthMm/1000, spacing=config.bridgeSpacingMm/1000;
  const bridge=.19,nut=bridge+scaleLength,joint=nut-scaleLength*(1-2**(-config.joinFret/12));
  const end=nut-scaleLength*(1-2**(-config.frets/12))-.012, heelWidth=Math.max(nutWidth+.012,spacing*.92), front=depth/2;
  const taper=(bottom)=>new T.Shape([new T.Vector2(-nutWidth/2,nut),new T.Vector2(nutWidth/2,nut),new T.Vector2(heelWidth/2,bottom),new T.Vector2(-heelWidth/2,bottom)]);
  plate('Neck',taper(joint-.015),.021,front-.021,wood,.002);
  plate('Fretboard',taper(end),.004,front,fretwood);
  const headLength=bass?.205:.175, headWidth=Math.max(nutWidth*1.5,.06);
  plate('Headstock',new T.Shape([
    new T.Vector2(-nutWidth/2,nut),new T.Vector2(nutWidth/2,nut),
    new T.Vector2(headWidth*.5,nut+headLength*.22),new T.Vector2(headWidth*.5,nut+headLength*.90),
    new T.Vector2(headWidth*.3,nut+headLength),new T.Vector2(-headWidth*.3,nut+headLength),
    new T.Vector2(-headWidth*.5,nut+headLength*.9),new T.Vector2(-headWidth*.5,nut+headLength*.22)
  ]),.014,front-.014,material('Headstock_finish',design.primary,.3),.002);
  function box(name,w,h,d,x,y,z,mat) { return add(name,new T.BoxGeometry(w,h,d),mat,x,y,z); }
  box('Nut',nutWidth,.004,.005,0,nut,front+.006,ivory);
  box('Bridge',acoustic?.15:.09,.025,.01,0,bridge,front+.008,acoustic?fretwood:steel);
  box('Saddle',spacing+.005,.003,.003,0,bridge,front+.015,ivory);
  if(proportions && style%2===0) {
    const guard=acoustic?[[.054,.35],[.085,.36],[.105,.33],[.10,.27],[.055,.25],[.037,.275],[.05,.30]]:[[-.048,.425],[.049,.425],[.075,.34],[.067,.26],[.045,.245],[-.043,.245],[-.052,.32]];
    plate('Pickguard',new T.Shape(guard.map(([x,y])=>new T.Vector2(x,y))),.0015,front+.001,black);
  }
  if(lod<2) {
    for(let f=1;f<=config.frets;f++) {
      const distance=scaleLength*(1-2**(-f/12)),y=nut-distance,ratio=Math.min(1,distance/(nut-joint));
      box(`Fret_${f}`,nutWidth+(heelWidth-nutWidth)*ratio,.0014,.0015,0,y,front+.0048,steel);
      if([3,5,7,9,12,15,17,19,21,24].includes(f)) {
        const previous=scaleLength*(1-2**(-(f-1)/12)), markerY=nut-(distance+previous)/2;
        for(const x of f%12===0?[-.008,.008]:[0]) {
          const geometry=proportions && style%3===1?new T.PlaneGeometry(.007,.005):new T.CircleGeometry(proportions && style%3===2?.004:.0025,proportions && style%3===2?4:12);
          add(`Inlay_${f}_${x}`,geometry,ivory,x,markerY,front+.0041);
        }
      }
    }
    for(let i=0;i<config.strings;i++) {
      const t=i/(config.strings-1), nx=-nutWidth*.42+t*nutWidth*.84,bx=-spacing/2+t*spacing;
      const a=new T.Vector3(nx,nut,front+.010),b=new T.Vector3(bx,bridge,front+.017),delta=b.clone().sub(a);
      const radius=(bass?.00055:.00018)+(1-t)*(bass?.0003:.0003);
      const string=add(`String_${i+1}`,new T.CylinderGeometry(radius,radius,delta.length(),lod===0?8:5),steel);
      string.position.copy(a).add(b).multiplyScalar(.5); string.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
    }
  }
  for(let i=0;i<config.strings;i++) {
    const side=acoustic?(i%2?1:-1):-1;
    const row=acoustic?Math.floor(i/2):i,rows=acoustic?Math.ceil(config.strings/2):config.strings;
    const y=nut+.028+row*(headLength-.055)/Math.max(1,rows-1),x=side*headWidth*.48;
    const post=add(`Tuning_post_${i+1}`,new T.CylinderGeometry(.003,.003,.018,lod===0?12:6),steel,x*.72,y,front+.001);
    post.rotation.x=Math.PI/2;
    box(`Tuning_key_${i+1}`,.014,.01,.007,x+side*.006,y,front-.009,steel);
  }
  if(!acoustic) {
    const locations=config.pickups==='sss'?[.275,.34,.405]:config.pickups==='hh'?[.285,.405]:config.pickups==='p'||config.pickups==='pj'?[.34,...(config.pickups==='pj'?[.275]:[])]:[];
    locations.forEach((y,i)=>{
      box(`Pickup_${i+1}`,.068,config.pickups==='hh'?.035:.017,.01,0,y,front+.009,black);
      if(proportions && lod<2) for(let pole=0;pole<config.strings;pole++) {
        const cap=add(`Pickup_${i+1}_pole_${pole+1}`,new T.CylinderGeometry(.002,.002,.001,lod===0?10:6),steel,-.026+pole*.052/(config.strings-1),y,front+.0145);cap.rotation.x=Math.PI/2;
      }
    });
    for(let i=0;i<(config.pickups==='hh'?4:2);i++) {
      const knob=add(`Control_${i+1}`,new T.CylinderGeometry(.008,.008,.01,lod===0?16:8),brass,.10+(i%2)*.03,.255+Math.floor(i/2)*.065,front+.012); knob.rotation.x=Math.PI/2;
    }
  }
  if(config.handedness==='left') root.scale.x=-1;
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
  return new Blob([await new GLTFExporter().parseAsync(root,{binary:true,animations:[],onlyVisible:true})],{type:'model/gltf-binary'});
}
export async function inspectGLB(blob) {
  const loaded=await new GLTFLoader().parseAsync(await blob.arrayBuffer(),'');
  try { return {...statistics(loaded.scene),animations:loaded.animations.length}; }
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
  const room=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer),env=pmrem.fromScene(room);
  scene.environment=env.texture; scene.environmentIntensity=.45; room.dispose(); pmrem.dispose();
  scene.add(new T.HemisphereLight(0xffffff,0x353048,.45));
  const light=new T.DirectionalLight(0xffffff,2);light.position.set(2,3,4);scene.add(light);
  return {renderer,scene,camera};
}
let captureStage;
export function snapshot(target,root) {
  if(!captureStage)captureStage=stage(document.createElement('canvas'),512,768);
  const {renderer,scene,camera}=captureStage;
  const size=new T.Box3().setFromObject(root).getSize(new T.Vector3()), center=new T.Box3().setFromObject(root).getCenter(new T.Vector3());
  camera.position.set(center.x+size.y*.42,center.y+size.y*.06,size.y*2);camera.lookAt(center);
  scene.add(root); renderer.render(scene,camera); scene.remove(root);
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
    if(model){scene.remove(model);dispose(model);}model=root;scene.add(root);
    const bounds=new T.Box3().setFromObject(root),center=bounds.getCenter(new T.Vector3()),height=bounds.getSize(new T.Vector3()).y;
    if(offset)camera.position.copy(center).add(offset.multiplyScalar(height/lastHeight));
    else camera.position.set(.5,center.y+.05,height*1.8);
    lastHeight=height;controls.target.copy(center);controls.update();render();return statistics(root);
  }};
}
