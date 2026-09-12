import {MathUtils} from 'three';
import {carveHeight} from './carved-top.js';

const hash=(x,y,seed)=>{const n=Math.sin(x*127.1+y*311.7+seed*.013)*43758.5453;return n-Math.floor(n);};

// Real shallow depressions in meters, not a displaced photograph or painted shadow.
// Leave the perimeter, central hardware, and control mounting zone untouched.
export function hammeredRelief(x,y,outline,seed=0) {
  const edge=1+carveHeight(x,y,outline)/.006;
  const hardware=MathUtils.smootherstep(Math.abs(x),.075,.095);
  const controls=x>0?MathUtils.smootherstep(y,.22,.255):1;
  if(edge<=0||hardware===0||controls===0)return 0;
  const cell=.021,ix=Math.floor(x/cell),iy=Math.floor(y/cell);
  let dent=0;
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++) {
    const cx=ix+dx,cy=iy+dy;
    const px=(cx+.25+.5*hash(cx,cy,seed))*cell,py=(cy+.25+.5*hash(cx,cy,seed+1))*cell;
    const radius=.008+.003*hash(cx,cy,seed+2),r=Math.hypot(x-px,y-py)/radius;
    if(r<1)dent=Math.max(dent,(1-MathUtils.smootherstep(r,0,1))*(.00025+.0002*hash(cx,cy,seed+3)));
  }
  return -dent*edge*hardware*controls;
}
