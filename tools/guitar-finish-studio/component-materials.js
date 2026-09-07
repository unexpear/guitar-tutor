import * as T from 'three';

// Subtle manufactured surface variation, never painted-on lighting or grime.
export function componentMaterial(name,color,roughness,metalness,seed=0) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d'),data=ctx.createImageData(128,128);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++) {
    const i=(y*128+x)*4;
    const h=Math.sin(x*127.1+y*311.7+seed)*43758.5453;
    const grain=(h-Math.floor(h)-.5)*.035;
    const hairline=metalness===1&&((y*37+seed)%127<1)?.035:0;
    const value=Math.round(T.MathUtils.clamp(roughness+grain+hairline,.05,.95)*255);
    data.data[i]=data.data[i+1]=data.data[i+2]=value;data.data[i+3]=255;
  }
  ctx.putImageData(data,0,0);
  const result=new T.MeshStandardMaterial({color,roughness:1,metalness,roughnessMap:new T.CanvasTexture(canvas)});
  result.name=name;return result;
}

export function stringMaterial(acoustic,wound) {
  const result=new T.MeshStandardMaterial({color:wound&&acoustic?0xb68b56:0xc5c7ca,metalness:1,roughness:wound?.34:.22});
  result.name=wound?(acoustic?'Bronze_wound_string':'Nickel_wound_string'):'Plain_steel_string';
  if(wound) {
    // A repeating tangent normal encodes windings without thousands of coils.
    const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
    const ctx=canvas.getContext('2d'),data=ctx.createImageData(32,32);
    for(let y=0;y<32;y++)for(let x=0;x<32;x++) {
      const i=(y*32+x)*4,ny=Math.sin((y/32+x/32)*Math.PI*2)*.6;
      data.data[i]=128;data.data[i+1]=(ny*.5+.5)*255;data.data[i+2]=(Math.sqrt(1-ny*ny)*.5+.5)*255;data.data[i+3]=255;
    }
    ctx.putImageData(data,0,0);result.normalMap=new T.CanvasTexture(canvas);
    result.normalMap.wrapS=result.normalMap.wrapT=T.RepeatWrapping;
    result.normalMap.repeat.set(1,600);result.normalScale.set(.3,.3);
  }
  return result;
}
