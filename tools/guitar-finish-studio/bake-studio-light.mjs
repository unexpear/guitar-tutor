import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {FloatType} from 'three';
import {EXRLoader} from 'three/addons/loaders/EXRLoader.js';
const bytes=await readFile(new URL('../../output/material-source/studio_small_09/studio.exr',import.meta.url));
const source=new EXRLoader().setDataType(FloatType).parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
const width=512,height=256,packed=Buffer.alloc(width*height*4),sx=source.width/width,sy=source.height/height;
if(!Number.isInteger(sx)||!Number.isInteger(sy))throw Error('Expected integral HDR downsample');
let peak=0;
for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
  const rgb=[0,0,0];
  for(let dy=0;dy<sy;dy++)for(let dx=0;dx<sx;dx++) {
    const i=((y*sy+dy)*source.width+x*sx+dx)*4;
    for(let c=0;c<3;c++)rgb[c]+=Math.max(0,source.data[i+c])/(sx*sy);
  }
  const max=Math.max(...rgb),i=(y*width+x)*4;
  if(!Number.isFinite(max))throw Error('Invalid HDR radiance');
  if(max===0)continue;
  const exponent=Math.ceil(Math.log2(max));peak=Math.max(peak,max);
  for(let c=0;c<3;c++)packed[i+c]=Math.round(rgb[c]/2**exponent*255);
  packed[i+3]=exponent+128;
}
await writeFile(new URL('./captured-studio.json',import.meta.url),JSON.stringify({width,height,encoding:'shared-exponent-rgb8',source:'https://polyhaven.com/a/studio_small_09',author:'Sergej Majboroda',license:'CC0-1.0',sha256:createHash('sha256').update(bytes).digest('hex'),peak,pixels:packed.toString('base64')}));
console.log({width,height,peak,bytes:packed.length});
