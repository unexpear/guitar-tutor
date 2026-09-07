import capture from './captured-wood.json' with {type:'json'};
const pixels=Uint8Array.from(atob(capture.pixels),c=>c.charCodeAt(0));
const color=Uint8Array.from(atob(capture.color),c=>c.charCodeAt(0));
const channelMean=[0,0,0];
for(let i=0;i<color.length;i++)channelMean[i%3]+=color[i]/(color.length/3);
let mean=0;for(let i=0;i<pixels.length;i+=3)mean+=pixels[i];mean/=pixels.length/3;
function offset(u,v,seed) {
  // Long grain aligned with neck; deterministic crop offsets, never random rotation.
  const x=((Math.floor(u*255)+seed%97)%256+256)%256;
  const y=((Math.floor(v*255)+Math.floor(seed/97)%113)%256+256)%256;
  return (y*256+x)*3;
}
export function capturedWood(u,v,seed=0) {
  const i=offset(u,v,seed);
  return [(pixels[i]-mean)/Math.max(1,mean),pixels[i+1]/255,pixels[i+2]/255];
}
export function capturedWoodTint(u,v,seed=0) {
  const i=offset(u,v,seed),luminance=pixels[i]/Math.max(1,mean);
  // Retain local warm/cool variation while leaving the chosen stain in control.
  return channelMean.map((average,c)=>Math.max(.8,Math.min(1.2,(color[i+c]/Math.max(1,average))/Math.max(.05,luminance))));
}
