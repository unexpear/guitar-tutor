// CC0 captured grain with bounded procedural figure. See CAPTURED-MATERIALS.md.
import { capturedWood } from './captured-wood.js';
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
function hash(x,y,seed) {
  const n=Math.sin(x*127.1+y*311.7+seed*.013)*43758.5453;
  return n-Math.floor(n);
}
function noise(x,y,seed) {
  const ix=Math.floor(x),iy=Math.floor(y),u=smooth(x-ix),v=smooth(y-iy);
  return mix(mix(hash(ix,iy,seed),hash(ix+1,iy,seed),u),mix(hash(ix,iy+1,seed),hash(ix+1,iy+1,seed),u),v);
}
export function woodDetail(u,v,seed,style=0,figureStrength=1) {
  // Longitudinal fibers, irregular cross-grain figure and a subtle bookmatch.
  const x=Math.abs(u-.5)*2, warp=noise(x*5,v*9,seed);
  const fiber=(noise(x*180+warp*1.4,v*5,seed)-.5)*2;
  let figure;
  switch(style) {
    case 1: figure=Math.sin(x*19+noise(x*4,v*7,seed)*5)*Math.sin(v*38+warp*3);break;
    case 2: { // Multiple irregular eyes rather than one concentric target.
      let sum=0;
      for(let i=0;i<5;i++) {
        const dx=x-hash(i,0,seed),dy=v-hash(i,1,seed);
        const r=Math.hypot(dx*1.2,dy);
        sum+=Math.cos(r*65+warp*6)*Math.exp(-r*7);
      }
      figure=sum*.65;break;
    }
    case 3: figure=Math.sin(x*55+noise(x*3,v*4,seed)*8);break;
    case 4: figure=Math.sin(v*75+warp*5)*(noise(x*6,v*4,seed)*.7+.3);break;
    case 5: { // Irregular branching zone-line approximation, not straight stripes.
      const field=noise(x*7,v*8,seed)+.35*noise(x*19,v*23,seed);
      figure=.35-Math.exp(-Math.abs(field-.66)*100)*2.2;break;
    }
    default: figure=(noise(x*3+warp*.4,v*32+noise(x*2,v*5,seed)*3,seed)-.5)*2;
  }
  const captured=capturedWood(u,v,seed)[0];
  return captured*.65+figure*.025*figureStrength+fiber*.006;
}
export function finishProperties(name) {
  switch(name) {
    case 'Matte': return [.78,0,0,0,0];
    case 'Metallic Flake': return [.29,.7,.9,0,0];
    case 'Pearlescent': return [.24,.35,.65,.95,0];
    case 'Brushed Metal': return [.42,1,0,0,.7];
    case 'Carbon Weave': return [.4,0,.65,0,.45];
    case 'Solid Gloss': return [.19,0,.9,0,0];
    case 'Solid Satin': return [.5,0,.12,0,0];
    case 'Solid Matte': return [.86,0,0,0,0];
    case 'Rough Paint': return [.94,0,0,0,0];
    case 'Open Pore Wood': return [.88,0,0,0,0];
    case 'Hammered Metal': return [.46,1,0,0,0];
    case 'Polished Metal': return [.12,1,0,0,0];
    case 'Satin Metal': return [.58,1,0,0,0];
    default: return [.32,0,.8,0,0];
  }
}
export const finishNames=Object.freeze(['Gloss','Matte','Metallic Flake','Pearlescent','Brushed Metal','Carbon Weave','Solid Gloss','Solid Satin','Solid Matte','Rough Paint','Open Pore Wood','Hammered Metal','Polished Metal','Satin Metal']);

export function coatingDetail(u,v,seed) {
  const x=Math.floor(u*256),y=Math.floor(v*256);
  const flake=hash(x,y,seed)>.76?1:0;
  return {flake,normalX:(hash(x,y,seed+17)*2-1)*flake,
    normalY:(hash(x,y,seed+43)*2-1)*flake,
    // Narrow variation at pigment scale, not large oil-slick color islands.
    pearlThickness:.45+noise(u*96,v*96,seed)*.1};
}

// Two-over/two-under twill. Eight texels per tow keep the visible bundles
// resolved in the carbon-only 512px map; individual micron-scale filaments are not
// simulated. This is an artistic laminate, not a measured carbon scan.
export function carbonDetail(u,v,seed) {
  const x=u*64,y=v*64,ix=Math.floor(x),iy=Math.floor(y);
  const vertical=((ix-iy)%4+4)%4<2;
  const across=vertical?x-ix:y-iy;
  const along=vertical?y:x;
  const crown=Math.pow(Math.max(0,Math.sin(Math.PI*across)),.6);
  const fiber=Math.cos(across*Math.PI*4)*.012;
  const variation=(noise((vertical?ix:iy)*.7,along*.35,seed)-.5)*.025;
  return {vertical,color:(crown-.65)*.16+fiber+variation,
    height:crown*.055+fiber*.12,roughness:(1-crown)*.04+variation*.2};
}

// Color, microscopic height and roughness variation are different signals.
export function surfaceDetail(finish,u,v,seed,style=0,figureStrength=1) {
  const n=hash(Math.floor(u*256),Math.floor(v*256),seed)*2-1;
  if(finish.startsWith('Solid ')||finish==='Polished Metal')return [0,0,0];
  if(finish==='Rough Paint')return [n*.015,n*.18,n*.04];
  if(finish==='Satin Metal')return [0,n*.015,n*.025];
  if(finish==='Hammered Metal') {
    // Rounded, irregular tool impressions instead of high-frequency static.
    const x=u*28,y=v*28,ix=Math.floor(x),iy=Math.floor(y);
    let nearest=2;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) {
      const cx=ix+dx,cy=iy+dy;
      const distance=Math.hypot(x-cx-hash(cx,cy,seed),y-cy-hash(cx,cy,seed+83));
      nearest=Math.min(nearest,distance);
    }
    const dent=1-Math.exp(-nearest*nearest*4);
    return [(dent-.5)*.015,dent*.16,(dent-.5)*.045];
  }
  if(finish==='Brushed Metal') {
    const brush=hash(Math.floor(v*256),0,seed)*2-1;
    return [brush*.015,brush*.04,brush*.025];
  }
  if(finish==='Carbon Weave') {
    const tow=carbonDetail(u,v,seed);
    return [tow.color,tow.height,tow.roughness];
  }
  if(finish==='Metallic Flake') {
    const flake=Math.max(0,n-.65)/.35;
    return [flake*.055,flake*.018,-flake*.045];
  }
  // Pearl paint is fine mica under a clear layer, not figured wood.
  if(finish==='Pearlescent')return [n*.006,n*.001,n*.003];
  const grain=woodDetail(u,v,seed,style,figureStrength);
  if(finish==='Open Pore Wood') {
    const [,height,roughness]=capturedWood(u,v,seed);
    return [grain,(height-1)*.045,(roughness-.5)*.08];
  }
  return [grain,grain*.008,grain*.06];
}
