import capture from './captured-rosewood.json' with {type:'json'};
const data=Uint8Array.from(atob(capture.pixels),c=>c.charCodeAt(0));
export function rosewoodSample(u,v) {
  const x=Math.max(0,Math.min(63,Math.floor(u*63))),y=Math.max(0,Math.min(511,Math.floor(v*511))),i=(y*64+x)*4;
  return [data[i]*.55,data[i+1]*.55,data[i+2]*.55,.6+data[i+3]/255*.2];
}
